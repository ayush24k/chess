import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import prismaClient from "@/services/primsaClient";

export const nextAuthConfig = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                identifier: { label: "Email or Username", type: "text", placeholder: "email or username" },
                password: { label: "Password", type: "password", placeholder: "password" },
            },

            async authorize(credentials: any): Promise<any> {
                const { identifier, password } = credentials;

                if (!identifier || !password) {
                    throw new Error('Missing credentials');
                }

                const isEmail = identifier.includes('@');

                const user = await prismaClient.user.findUnique({
                    where: isEmail ? { email: identifier } : { username: identifier },
                });

                if (!user) {
                    throw new Error('User not found');
                }

                if (!user.password) {
                    throw new Error('This account uses social login');
                }

                const isPasswordValid = await bcrypt.compare(password, user.password);

                if (!isPasswordValid) {
                    throw new Error('Invalid password');
                }

                return {
                    id: user.id,
                    name: user.username,
                    email: user.email,
                }
            }
        }),

        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || ""
        }),

        GitHubProvider({
            clientId: process.env.GITHUB_ID || "",
            clientSecret: process.env.GITHUB_SECRET || ""
        })
    ],

    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        
        async signIn({ user, account }: any) {
            
            if (account.provider !== 'credentials') {
                await prismaClient.user.upsert({
                    where: { email: user.email },
                    update: {
                        profilePicture: user.image || undefined,
                    },
                    create: {
                        email: user.email,
                        username: user.name || user.email.split('@')[0],
                        password: '',  // OAuth users don't use password
                        profilePicture: user.image || null,
                    },
                });
            }

            return true;
        },

        async jwt({ token, user }: any) {
            token.userID = token.sub;
            return token;
        },

        async session({ session, token, user }: any) {
            session.user.id = token.userID
            return session;
        }
    },
    pages: {
        signIn: '/signin'
    }
}