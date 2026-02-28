import { NextRequest, NextResponse } from "next/server";
import prismaClient from "@/services/primsaClient";
import { getAuthUserId } from "@/lib/auth";

// GET /api/friends — List friends and pending requests
// POST /api/friends — Send a friend request (body: { username: string })
export async function GET(req: NextRequest) {
    try {
        const userId = await getAuthUserId(req);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const [sentRequests, receivedRequests] = await Promise.all([
            prismaClient.friendRequest.findMany({
                where: { requesterId: userId },
                include: {
                    addressee: { select: { id: true, username: true, rating: true, profilePicture: true } },
                },
                orderBy: { createdAt: "desc" },
            }),
            prismaClient.friendRequest.findMany({
                where: { addresseeId: userId },
                include: {
                    requester: { select: { id: true, username: true, rating: true, profilePicture: true } },
                },
                orderBy: { createdAt: "desc" },
            }),
        ]);

        // Accepted friends = accepted from either direction
        const friends = [
            ...sentRequests
                .filter((r) => r.status === "ACCEPTED")
                .map((r) => ({ ...r.addressee, requestId: r.id })),
            ...receivedRequests
                .filter((r) => r.status === "ACCEPTED")
                .map((r) => ({ ...r.requester, requestId: r.id })),
        ];

        // Pending incoming
        const pendingIncoming = receivedRequests
            .filter((r) => r.status === "PENDING")
            .map((r) => ({ ...r.requester, requestId: r.id, createdAt: r.createdAt }));

        // Pending outgoing
        const pendingOutgoing = sentRequests
            .filter((r) => r.status === "PENDING")
            .map((r) => ({ ...r.addressee, requestId: r.id, createdAt: r.createdAt }));

        return NextResponse.json({ friends, pendingIncoming, pendingOutgoing });
    } catch (error: any) {
        console.error("Error fetching friends:", error);
        return NextResponse.json({ error: "Failed to fetch friends" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const userId = await getAuthUserId(req);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { username } = await req.json();

        if (!username || typeof username !== "string") {
            return NextResponse.json({ error: "Username is required" }, { status: 400 });
        }

        // Find the target user
        const targetUser = await prismaClient.user.findUnique({
            where: { username: username.trim() },
            select: { id: true, username: true },
        });

        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (targetUser.id === userId) {
            return NextResponse.json({ error: "Cannot send friend request to yourself" }, { status: 400 });
        }

        // Check if a request already exists in either direction
        const existing = await prismaClient.friendRequest.findFirst({
            where: {
                OR: [
                    { requesterId: userId, addresseeId: targetUser.id },
                    { requesterId: targetUser.id, addresseeId: userId },
                ],
            },
        });

        if (existing) {
            if (existing.status === "ACCEPTED") {
                return NextResponse.json({ error: "Already friends" }, { status: 400 });
            }
            if (existing.status === "PENDING") {
                return NextResponse.json({ error: "Friend request already pending" }, { status: 400 });
            }
            if (existing.status === "BLOCKED") {
                return NextResponse.json({ error: "Cannot send friend request" }, { status: 400 });
            }
            // DECLINED — allow re-sending by updating
            await prismaClient.friendRequest.update({
                where: { id: existing.id },
                data: { requesterId: userId, addresseeId: targetUser.id, status: "PENDING" },
            });
            return NextResponse.json({ message: "Friend request sent" });
        }

        await prismaClient.friendRequest.create({
            data: { requesterId: userId, addresseeId: targetUser.id },
        });

        return NextResponse.json({ message: "Friend request sent" });
    } catch (error: any) {
        console.error("Error sending friend request:", error);
        return NextResponse.json({ error: "Failed to send friend request" }, { status: 500 });
    }
}
