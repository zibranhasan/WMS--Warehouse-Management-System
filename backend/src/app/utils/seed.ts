import { Role, UserStatus } from "../../generated/prisma/enums";
import { envVars } from "../config/env";
import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";

export const seedSuperAdmin = async () => {
    try {
        const existingSuperAdmin = await prisma.user.findFirst({
            where: {
                role: Role.SUPER_ADMIN,
                isDeleted: false,
            },
        });

        if (existingSuperAdmin) {
            console.log("Super Admin already exists. Skipping seed.");
            return;
        }

        const result = await auth.api.signUpEmail({
            body: {
                email: envVars.SUPER_ADMIN_EMAIL,
                password: envVars.SUPER_ADMIN_PASSWORD,
                name: "Super Admin",
            },
        });

        if (!result.user) {
            throw new Error("Failed to create Super Admin.");
        }

        await prisma.user.update({
            where: {
                id: result.user.id,
            },
            data: {
                role: Role.SUPER_ADMIN,
                status: UserStatus.ACTIVE,
                needPasswordChange: false,
                isDeleted: false,
                deletedAt: null,
                emailVerified: true,
            },
        });

        console.log("Super Admin created successfully.");
    } catch (error) {
        console.error("Error seeding Super Admin:", error);

        const existingUser = await prisma.user.findUnique({
            where: {
                email: envVars.SUPER_ADMIN_EMAIL,
            },
        });

        if (existingUser) {
            await prisma.user.delete({
                where: {
                    id: existingUser.id,
                },
            });
        }

        throw error;
    }
};