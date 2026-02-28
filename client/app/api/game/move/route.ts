import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prismaClient from "@/services/primsaClient";

// POST /api/game/move — Save a move to the database
export async function POST(req: NextRequest) {
    try {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        if (!token?.userID) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { gameId, from, to, piece, moveNumber, notation, timeTakenMs } = body;

        if (!gameId || !from || !to || !piece || moveNumber === undefined || !notation) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const move = await prismaClient.move.create({
            data: {
                gameId,
                from,
                to,
                piece,
                moveNumber,
                notation,
                timeTakenMs: timeTakenMs || 0,
            },
        });

        // Update time left on the game
        const game = await prismaClient.game.findUnique({ where: { id: gameId } });
        if (game) {
            const isWhiteMove = moveNumber % 2 !== 0;
            await prismaClient.game.update({
                where: { id: gameId },
                data: isWhiteMove
                    ? { whitePlayerTimeLeft: { decrement: timeTakenMs || 0 } }
                    : { blackPlayerTimeLeft: { decrement: timeTakenMs || 0 } },
            });
        }

        return NextResponse.json({ move }, { status: 201 });
    } catch (error: any) {
        console.error("Error saving move:", error);
        return NextResponse.json({ error: "Failed to save move" }, { status: 500 });
    }
}
