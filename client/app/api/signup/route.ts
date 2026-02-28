import prismaClient from "@/services/primsaClient";
import bcrypt from 'bcrypt';
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const { email, password , username } = await request.json();

    const existingUser = await prismaClient.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        return new Response(JSON.stringify({ error: 'User already exists' }), 
        { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prismaClient.user.create({
        data: {
            email,
            username,
            password: hashedPassword
        }
    });

    return NextResponse.json(
        { message: 'User created successfully' }, 
        { status: 201 }
    );
}