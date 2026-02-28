import prismaClient from "@/services/primsaClient";
import bcrypt from 'bcryptjs';
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { email, password, username } = await request.json();

        if (!email || !password || !username) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters' },
                { status: 400 }
            );
        }

        const existingEmail = await prismaClient.user.findUnique({
            where: { email },
        });

        if (existingEmail) {
            return NextResponse.json(
                { error: 'Email already in use' },
                { status: 409 }
            );
        }

        const existingUsername = await prismaClient.user.findUnique({
            where: { username },
        });

        if (existingUsername) {
            return NextResponse.json(
                { error: 'Username already taken' },
                { status: 409 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prismaClient.user.create({
            data: {
                email,
                username,
                password: hashedPassword,
            },
        });

        return NextResponse.json(
            { message: 'Account created successfully' },
            { status: 201 }
        );
    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json(
            { error: 'Something went wrong. Please try again.' },
            { status: 500 }
        );
    }
}