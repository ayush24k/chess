import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prismaClient from "@/services/primsaClient";

// GET /api/games/history — Get current user's game history
export async function GET(req: NextRequest) {
    try {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        if (!token?.userID) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = token.userID as string;
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
        const skip = (page - 1) * limit;

        const [games, total] = await Promise.all([
            prismaClient.game.findMany({
                where: {
                    status: "COMPLETED",
                    OR: [
                        { whitePlayerId: userId },
                        { blackPlayerId: userId },
                    ],
                },
                include: {
                    whitePlayer: { select: { id: true, username: true, rating: true, profilePicture: true } },
                    blackPlayer: { select: { id: true, username: true, rating: true, profilePicture: true } },
                    _count: { select: { moves: true } },
                },
                orderBy: { startedAt: "desc" },
                skip,
                take: limit,
            }),
            prismaClient.game.count({
                where: {
                    status: "COMPLETED",
                    OR: [
                        { whitePlayerId: userId },
                        { blackPlayerId: userId },
                    ],
                },
            }),
        ]);

        const formatted = games.map((game) => {
            const playedAsWhite = game.whitePlayerId === userId;
            const opponent = playedAsWhite ? game.blackPlayer : game.whitePlayer;
            let resultText = "Draw";
            if (game.result === "WHITE_WIN") resultText = playedAsWhite ? "Win" : "Loss";
            else if (game.result === "BLACK_WIN") resultText = playedAsWhite ? "Loss" : "Win";
            else if (game.result === "STALEMATE") resultText = "Stalemate";
            else if (game.result === "TIMEOUT") resultText = playedAsWhite
                ? (game.whitePlayerTimeLeft <= 0 ? "Loss" : "Win")
                : (game.blackPlayerTimeLeft <= 0 ? "Loss" : "Win");

            return {
                id: game.id,
                opponent: { username: opponent.username, rating: opponent.rating, profilePicture: opponent.profilePicture },
                playedAs: playedAsWhite ? "white" : "black",
                result: resultText,
                gameResult: game.result,
                moves: game._count.moves,
                pgn: game.pgn,
                startedAt: game.startedAt,
                endedAt: game.endedAt,
            };
        });

        return NextResponse.json({ games: formatted, total, page, totalPages: Math.ceil(total / limit) });
    } catch (error: any) {
        console.error("Error fetching game history:", error);
        return NextResponse.json({ error: "Failed to fetch game history" }, { status: 500 });
    }
}
