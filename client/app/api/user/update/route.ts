import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prismaClient from "@/services/primsaClient";
import bcrypt from "bcryptjs";

// PUT /api/user/update — Update user profile (username, password)
export async function PUT(req: NextRequest) {
    try {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        if (!token?.userID) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = token.userID as string;
        const body = await req.json();
        const { username, currentPassword, newPassword } = body;

        const user = await prismaClient.user.findUnique({ where: { id: userId } });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const updateData: Record<string, any> = {};

        // Update username
        if (username && username.trim() !== user.username) {
            const existing = await prismaClient.user.findUnique({ where: { username: username.trim() } });
            if (existing) {
                return NextResponse.json({ error: "Username already taken" }, { status: 400 });
            }
            updateData.username = username.trim();
        }

        // Update password (only for credential users)
        if (newPassword) {
            if (!user.password) {
                return NextResponse.json({ error: "OAuth accounts cannot set password" }, { status: 400 });
            }
            if (!currentPassword) {
                return NextResponse.json({ error: "Current password is required" }, { status: 400 });
            }
            const valid = await bcrypt.compare(currentPassword, user.password);
            if (!valid) {
                return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
            }
            if (newPassword.length < 6) {
                return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
            }
            updateData.password = await bcrypt.hash(newPassword, 10);
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ message: "No changes" });
        }

        const updated = await prismaClient.user.update({
            where: { id: userId },
            data: updateData,
            select: { id: true, username: true, email: true, rating: true, profilePicture: true },
        });

        return NextResponse.json({ user: updated, message: "Profile updated" });
    } catch (error: any) {
        console.error("Error updating user:", error);
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
}
