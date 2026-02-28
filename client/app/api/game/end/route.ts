import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prismaClient from "@/services/primsaClient";

// POST /api/game/end — End a game, update result & ratings
export async function POST(req: NextRequest) {
    try {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        if (!token?.userID) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { gameId, winner, reason } = body;

        if (!gameId || !winner) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Map winner + reason to GameResult enum
        let result: "WHITE_WIN" | "BLACK_WIN" | "DRAW" | "STALEMATE" | "TIMEOUT";
        if (reason === "stalemate") {
            result = "STALEMATE";
        } else if (reason === "draw") {
            result = "DRAW";
        } else if (reason === "timeout") {
            result = winner === "white" ? "WHITE_WIN" : "BLACK_WIN";
        } else {
            // checkmate or resignation
            result = winner === "white" ? "WHITE_WIN" : "BLACK_WIN";
        }

        // Get game with PGN from chess.js (client sends it)
        const pgn = body.pgn || null;

        // Update game record
        const game = await prismaClient.game.update({
            where: { id: gameId },
            data: {
                status: "COMPLETED",
                result,
                pgn,
                endedAt: new Date(),
                whitePlayerTimeLeft: body.whiteTimeLeft ?? undefined,
                blackPlayerTimeLeft: body.blackTimeLeft ?? undefined,
            },
            include: {
                whitePlayer: { select: { id: true, rating: true } },
                blackPlayer: { select: { id: true, rating: true } },
            },
        });

        // Simple ELO rating update (K-factor = 32)
        const K = 32;
        const whiteRating = game.whitePlayer.rating;
        const blackRating = game.blackPlayer.rating;

        const expectedWhite = 1 / (1 + Math.pow(10, (blackRating - whiteRating) / 400));
        const expectedBlack = 1 / (1 + Math.pow(10, (whiteRating - blackRating) / 400));

        let whiteScore: number;
        let blackScore: number;

        if (result === "DRAW" || result === "STALEMATE") {
            whiteScore = 0.5;
            blackScore = 0.5;
        } else if (result === "WHITE_WIN") {
            whiteScore = 1;
            blackScore = 0;
        } else {
            whiteScore = 0;
            blackScore = 1;
        }

        const newWhiteRating = Math.round(whiteRating + K * (whiteScore - expectedWhite));
        const newBlackRating = Math.round(blackRating + K * (blackScore - expectedBlack));

        // Update player ratings
        await prismaClient.$transaction([
            prismaClient.user.update({
                where: { id: game.whitePlayer.id },
                data: { rating: newWhiteRating },
            }),
            prismaClient.user.update({
                where: { id: game.blackPlayer.id },
                data: { rating: newBlackRating },
            }),
        ]);

        return NextResponse.json({
            game: { id: game.id, result, status: "COMPLETED" },
            ratings: {
                white: { old: whiteRating, new: newWhiteRating },
                black: { old: blackRating, new: newBlackRating },
            },
        }, { status: 200 });
    } catch (error: any) {
        console.error("Error ending game:", error);
        return NextResponse.json({ error: "Failed to end game" }, { status: 500 });
    }
}
