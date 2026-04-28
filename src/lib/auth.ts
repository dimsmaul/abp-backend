import { betterAuth } from "better-auth"
import { kyselyAdapter } from "@better-auth/kysely-adapter"
import { db } from "./database"

export const auth = betterAuth({
    database: kyselyAdapter(db, {
        type: "postgres", // Specify the database provider
    }),
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "employee",
                input: false, // Don't allow user to set role during sign up
            },
            department: {
                type: "string",
                required: false,
            }
        }
    }
})
