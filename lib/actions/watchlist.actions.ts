"use server";

import { connectToDatabase } from "@/database/mongoose";
import Watchlist from "@/database/models/watchlist.model";

/**
 * Returns all watchlist symbols for a user
 */
export async function getWatchlistSymbolsByEmail(
    email: string
): Promise<string[]> {
  try {
    if (!email) return [];

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("MongoDB connection not connected");

    type BetterAuthUserDoc = { _id?: unknown; id?: string; email?: string };

    // BetterAuth stores users in the `user` collection. We read the user's id(s)
    // and then query our watchlist model (which stores `userId` as a string).
    const user = await db
      .collection<BetterAuthUserDoc>("user")
      .findOne({ email }, { projection: { _id: 1, id: 1 } });

    const candidateUserIds = [
      typeof user?.id === "string" ? user.id : "",
      user?._id ? String(user._id) : "",
    ].filter((x): x is string => Boolean(x));

    if (candidateUserIds.length === 0) {
      console.warn("User not found:", email);
      return [];
    }

    /**
     * Fetch symbols
     */
    const userIdQuery =
      candidateUserIds.length === 1
        ? candidateUserIds[0]
        : { $in: candidateUserIds };

    const watchlist = await Watchlist.find({ userId: userIdQuery })
      .select("symbol")
      .lean();

    if (!watchlist.length) return [];

    return watchlist.map((item) => item.symbol);
  } catch (error) {
    console.error(
        "Error fetching watchlist symbols:",
        error
    );
    return [];
  }
}
