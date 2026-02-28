import { NextRequest, NextResponse } from "next/server";
import prismaClient from "@/services/primsaClient";
import { getAuthUserId } from "@/lib/auth";

// POST /api/friends/respond — Accept or decline a friend request
// body: { requestId: string, action: "accept" | "decline" }
export async function POST(req: NextRequest) {
    try {
        const userId = await getAuthUserId(req);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { requestId, action } = await req.json();

        if (!requestId || !["accept", "decline"].includes(action)) {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 });
        }

        const friendRequest = await prismaClient.friendRequest.findUnique({
            where: { id: requestId },
        });

        if (!friendRequest) {
            return NextResponse.json({ error: "Friend request not found" }, { status: 404 });
        }

        // Only the addressee can respond
        if (friendRequest.addresseeId !== userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        if (friendRequest.status !== "PENDING") {
            return NextResponse.json({ error: "Request already handled" }, { status: 400 });
        }

        await prismaClient.friendRequest.update({
            where: { id: requestId },
            data: { status: action === "accept" ? "ACCEPTED" : "DECLINED" },
        });

        return NextResponse.json({ message: `Friend request ${action}ed` });
    } catch (error: any) {
        console.error("Error responding to friend request:", error);
        return NextResponse.json({ error: "Failed to respond" }, { status: 500 });
    }
}
