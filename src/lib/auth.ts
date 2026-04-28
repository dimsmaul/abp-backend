import { betterAuth } from "better-auth"
import { kyselyAdapter } from "@better-auth/kysely-adapter"
import { db } from "./database"

export const auth = betterAuth({
    database: kyselyAdapter(db, {
        type: "postgres", // Specify the database provider
    }),
    emailAndPassword: {
        enabled: true,
    }
})
