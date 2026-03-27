'use server';

import {connectToDatabase} from "@/database/mongoose";

export type NewsEmailUser = {
    id: string;
    email: string;
    name: string;
};

type BetterAuthUserDoc = {
    id?: string;
    email?: string;
    name?: string;
    country?: string;
};

export const getAllUsersForNewsEmail = async (): Promise<NewsEmailUser[]> => {
    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if (!db) throw new Error('MongoDB connection not connected');

        const users = await db.collection<BetterAuthUserDoc>('user').find(
            {email: { $exists: true, $type: 'string', $ne: ''}},
            {projection: {_id: 1, id: 1, email: 1, name: 1, country: 1}}
        ).toArray();

        return users
            .map((user) => {
                const emailValue = typeof user.email === 'string' ? user.email : '';
                const nameValue = typeof user.name === 'string' ? user.name : '';
                if (!emailValue || !nameValue) return null;

                const idValue =
                    (typeof user.id === 'string' && user.id) ||
                    (user._id ? String(user._id) : '');

                if (!idValue) return null;

                const mapped: NewsEmailUser = {
                    id: idValue,
                    email: emailValue,
                    name: nameValue,
                };

                return mapped;
            })
            .filter((u): u is NewsEmailUser => Boolean(u));
    } catch (e){
        console.error('Error fetching users for news email:', e)
        return []
    }

}
