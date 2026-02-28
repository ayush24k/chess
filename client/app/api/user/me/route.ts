import { NextRequest, NextResponse } from "next/server";
import prismaClient from "@/services/primsaClient";
import { getAuthUserId } from "@/lib/auth";

// GET /api/user/me — Get current user's profile with stats
export async function GET(req: NextRequest) {
    try {
        const userId = await getAuthUserId(req);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

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
