import z  from "zod"
import { tool } from "ai"

export const dateTime = tool ({
    description: "helps to get the current date and time",
    inputSchema : z.object({}),
    execute : async()=> {
        return new Date().toISOString()
    }
})

