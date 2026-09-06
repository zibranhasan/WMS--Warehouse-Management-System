import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../../generated/prisma/index.js";
import { envVars } from "../config/env.js";
const pool = new pg.Pool({
    connectionString: envVars.DATABASE_URL,
    // Allow enough connections so interactive transactions never starve
    max: 20,
    // How long (ms) to wait for a connection from the pool before throwing
    connectionTimeoutMillis: 10000,
    // How long (ms) a client can sit idle before being closed
    idleTimeoutMillis: 30000,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
export { prisma };
