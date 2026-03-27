import { betterAuth } from "better-auth";
import {mongodbAdapter} from "better-auth/adapters/mongodb";
import {connectToDatabase} from "@/database/mongoose";
import {nextCookies} from "better-auth/next-js";
import type { Db } from "mongodb";

const buildAuth = (db: Db, secret: string, baseURL: string) =>
    betterAuth({
        database: mongodbAdapter(db),
        secret,
        baseURL,
        emailAndPassword: {
            enabled: true,
            disableSignUp: false,
            requireEmailVerification: false,
            minPasswordLength: 8,
            maxPasswordLength: 128,
            autoSignIn: true,
        },
        plugins: [nextCookies()],
    });

type AuthInstance = ReturnType<typeof buildAuth>;

let authInstance: AuthInstance | undefined;

export const getAuth = async (): Promise<AuthInstance> => {
    if (authInstance) return authInstance;

    const secret = process.env.BETTER_AUTH_SECRET;
    const baseURL = process.env.BETTER_AUTH_URL;
    if (!secret) throw new Error("BETTER_AUTH_SECRET is missing in .env");
    if (!baseURL) throw new Error("BETTER_AUTH_URL is missing in .env");

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;

    if (!db) throw new Error("MongoDB connection not found!");
    // Mongoose ships its own mongodb dependency, so the Db type differs at compile-time.
    // Cast via `unknown` (not `any`) to satisfy Better Auth's mongodb adapter types.
    const betterAuthDb = db as unknown as Db;

    authInstance = buildAuth(betterAuthDb, secret, baseURL);

    return authInstance;

}
