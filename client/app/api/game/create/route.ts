import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prismaClient from "@/services/primsaClient";

// POST /api/game/create — Create a new game record in DB
export async function POST(req: NextRequest) {
    try {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        if (!token?.userID) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { gameId, whitePlayerId, blackPlayerId, timeControl } = body;

        if (!gameId || !whitePlayerId || !blackPlayerId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const game = await prismaClient.game.create({
            data: {
                id: gameId,
                whitePlayerId,
                blackPlayerId,
                status: "IN_PROGRESS",
                TimeControl: timeControl || 600000,
                whitePlayerTimeLeft: timeControl || 600000,
                blackPlayerTimeLeft: timeControl || 600000,
            },
            include: {
                whitePlayer: { select: { id: true, username: true, rating: true, profilePicture: true } },
                blackPlayer: { select: { id: true, username: true, rating: true, profilePicture: true } },
            },
        });

        return NextResponse.json({ game }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating game:", error);
        return NextResponse.json({ error: "Failed to create game" }, { status: 500 });
    }
}
