import { seedSuperAdmin } from "./seed.js";
import { prisma } from "../lib/prisma.js";

const main = async () => {
    try {
        await seedSuperAdmin();
    } catch (error) {
        console.error("Seed failed:", error);
        await prisma.$disconnect();
        process.exit(1);
    }
    await prisma.$disconnect();
    process.exit(0);
};

main();
