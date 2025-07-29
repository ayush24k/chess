import { PrismaClient } from "@prisma/client";

const primsClient = new PrismaClient({
    log: ['query']
}) 

export default primsClient;