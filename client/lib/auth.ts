import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import prismaClient from "@/services/primsaClient";

/**
 * Resolves the authenticated user's database UUID from the JWT token.
 * Handles OAuth users where token.sub (provider ID) ≠ DB id by falling back to email lookup.
 * Returns null if unauthenticated or user not found.
 */
export async function getAuthUserId(req: NextRequest): Promise<string | null> {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.userID) return null;

    const userId = token.userID as string;

    // Check if the token ID matches a DB user
    const user = await prismaClient.user.findUnique({
        where: { id: userId },
        select: { id: true },
    });

    if (user) return user.id;

    // Fallback: look up by email (handles OAuth where sub ≠ DB UUID)
    if (token.email) {
        const emailUser = await prismaClient.user.findUnique({
            where: { email: token.email as string },
            select: { id: true },
        });
        if (emailUser) return emailUser.id;
    }

    return null;
}
