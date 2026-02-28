import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prismaClient from "@/services/primsaClient";

// GET /api/user/me — Get current user's profile with stats
export async function GET(req: NextRequest) {
    try {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        if (!token?.userID) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = token.userID as string;

        const user = await prismaClient.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                rating: true,
                profilePicture: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get game stats
        const [totalGames, wins] = await Promise.all([
            prismaClient.game.count({
                where: {
                    status: "COMPLETED",
                    OR: [
                        { whitePlayerId: userId },
                        { blackPlayerId: userId },
                    ],
                },
            }),
            prismaClient.game.count({
                where: {
                    status: "COMPLETED",
                    OR: [
                        { whitePlayerId: userId, result: "WHITE_WIN" },
                        { blackPlayerId: userId, result: "BLACK_WIN" },
                    ],
                },
            }),
        ]);

        return NextResponse.json({
            user: {
                ...user,
                totalGames,
                wins,
            },
        });
    } catch (error: any) {
        console.error("Error fetching user:", error);
        return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
    }
}
