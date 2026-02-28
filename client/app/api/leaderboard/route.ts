import { NextRequest, NextResponse } from "next/server";
import prismaClient from "@/services/primsaClient";

// GET /api/leaderboard — Top players by rating
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

        const players = await prismaClient.user.findMany({
            select: {
                id: true,
                username: true,
                rating: true,
                profilePicture: true,
            },
            orderBy: { rating: "desc" },
            take: limit,
        });

        // Get game counts for each player in parallel
        const playersWithStats = await Promise.all(
            players.map(async (player, index) => {
                const [totalGames, wins] = await Promise.all([
                    prismaClient.game.count({
                        where: {
                            status: "COMPLETED",
                            OR: [{ whitePlayerId: player.id }, { blackPlayerId: player.id }],
                        },
                    }),
                    prismaClient.game.count({
                        where: {
                            status: "COMPLETED",
                            OR: [
                                { whitePlayerId: player.id, result: "WHITE_WIN" },
                                { blackPlayerId: player.id, result: "BLACK_WIN" },
                            ],
                        },
                    }),
                ]);

                return {
                    rank: index + 1,
                    username: player.username,
                    rating: player.rating,
                    profilePicture: player.profilePicture,
                    totalGames,
                    wins,
                    winRate: totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0,
                };
            })
        );

        return NextResponse.json({ players: playersWithStats });
    } catch (error: any) {
        console.error("Error fetching leaderboard:", error);
        return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
    }
}
