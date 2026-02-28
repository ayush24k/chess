import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    const { pathname } = request.nextUrl;

    // Allow access to auth routes, API routes, and public assets
    if (
        pathname.startsWith("/api/") ||
        pathname.startsWith("/signin") ||
        pathname.startsWith("/signup") ||
        pathname.startsWith("/_next/") ||
        pathname.startsWith("/chessPieces/") ||
        pathname === "/"
    ) {
        return NextResponse.next();
    }

    // Redirect unauthenticated users to signin
    if (!token) {
        const signInUrl = new URL("/signin", request.url);
        signInUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/game/:path*"],
};
