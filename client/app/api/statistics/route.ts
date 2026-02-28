import { NextRequest, NextResponse } from "next/server";
import prismaClient from "@/services/primsaClient";
import { getAuthUserId } from "@/lib/auth";

// GET /api/statistics — Get current user's detailed statistics
export async function GET(req: NextRequest) {
    try {
        const userId = await getAuthUserId(req);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prismaClient.user.findUnique({
            where: { id: userId },
            select: { username: true, rating: true, createdAt: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // All completed games for this user
        const games = await prismaClient.game.findMany({
            where: {
                status: "COMPLETED",
                OR: [{ whitePlayerId: userId }, { blackPlayerId: userId }],
            },
            select: {
                id: true,
                whitePlayerId: true,
                blackPlayerId: true,
                result: true,
                startedAt: true,
                endedAt: true,
                _count: { select: { moves: true } },
            },
            orderBy: { startedAt: "asc" },
        });

        let wins = 0, losses = 0, draws = 0;
        let gamesAsWhite = 0, gamesAsBlack = 0;
        let winsAsWhite = 0, winsAsBlack = 0;
        let totalMoves = 0;
        let longestGame = 0;
        let shortestGame = Infinity;

        // Rating history (approximate — we'll track wins/losses chronologically)
        const ratingHistory: { date: string; rating: number }[] = [];
        let runningRating = 500; // starting rating

        for (const game of games) {
            const asWhite = game.whitePlayerId === userId;
            const moveCount = game._count.moves;
            totalMoves += moveCount;

            if (moveCount > longestGame) longestGame = moveCount;
            if (moveCount < shortestGame) shortestGame = moveCount;

            if (asWhite) gamesAsWhite++;
            else gamesAsBlack++;

            if (game.result === "WHITE_WIN") {
                if (asWhite) { wins++; winsAsWhite++; runningRating += 16; }
                else { losses++; runningRating -= 16; }
            } else if (game.result === "BLACK_WIN") {
                if (!asWhite) { wins++; winsAsBlack++; runningRating += 16; }
                else { losses++; runningRating -= 16; }
            } else if (game.result === "DRAW" || game.result === "STALEMATE") {
                draws++;
            } else if (game.result === "TIMEOUT") {
                // Approximate: whoever had time left won
                if (asWhite) { losses++; runningRating -= 16; }
                else { losses++; runningRating -= 16; }
            }

            ratingHistory.push({
                date: game.startedAt.toISOString().split("T")[0],
                rating: runningRating,
            });
        }

        if (shortestGame === Infinity) shortestGame = 0;

        const totalGames = games.length;
        const avgMovesPerGame = totalGames > 0 ? Math.round(totalMoves / totalGames) : 0;
        const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

        // Recent form (last 10 games)
        const recentGames = games.slice(-10);
        const recentForm = recentGames.map((game) => {
            const asWhite = game.whitePlayerId === userId;
            if (game.result === "WHITE_WIN") return asWhite ? "W" : "L";
            if (game.result === "BLACK_WIN") return asWhite ? "L" : "W";
            return "D";
        });

        return NextResponse.json({
            overview: {
                username: user.username,
                rating: user.rating,
                totalGames,
                wins,
                losses,
                draws,
                winRate,
                memberSince: user.createdAt,
            },
            colorStats: {
                gamesAsWhite,
                gamesAsBlack,
                winsAsWhite,
                winsAsBlack,
                whiteWinRate: gamesAsWhite > 0 ? Math.round((winsAsWhite / gamesAsWhite) * 100) : 0,
                blackWinRate: gamesAsBlack > 0 ? Math.round((winsAsBlack / gamesAsBlack) * 100) : 0,
            },
            gameStats: {
                avgMovesPerGame,
                longestGame,
                shortestGame,
                totalMoves,
            },
            recentForm,
            ratingHistory,
        });
    } catch (error: any) {
        console.error("Error fetching statistics:", error);
        return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 });
    }
}
