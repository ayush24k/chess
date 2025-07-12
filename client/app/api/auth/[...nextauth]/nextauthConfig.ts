import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { signIn } from "next-auth/react";
import { pages } from "next/dist/build/templates/app-page";

export const nextAuthConfig = {
    providers: [
        CredentialsProvider({
            name: "Email",
            credentials: {
                username: { label: "email", type: "text", placeholder: "email" },
                password: { label: "password", type: "password", placeholder: "password" },
            },
            async authorize(credentials: any) {

                // validations here

                return {
                    id: "1",
                    name: "ayush",
                    email: "hello@gmai.com"
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
        async signIn({user}: any) {

            // validate and store the user in db if new entry
            console.log(user)
            return user;
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