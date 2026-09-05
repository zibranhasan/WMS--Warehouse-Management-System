import { NextFunction, Request, Response } from "express";
import status from "http-status";

import { Role } from "../../generated/prisma/enums";
import AppError from "../errorHelpers/AppError";
import { prisma } from "../lib/prisma";

// ---------------------------------------------------------------------------
// INTERNAL: Extract warehouseId from request sources (params → body → query)
// ---------------------------------------------------------------------------

const extractWarehouseId = (req: Request): string | undefined => {
    const fromParams = req.params.warehouseId;
    if (fromParams && typeof fromParams === "string" && fromParams.trim()) {
        return fromParams.trim();
    }

    const fromBody = req.body?.warehouseId;
    if (fromBody && typeof fromBody === "string" && fromBody.trim()) {
        return fromBody.trim();
    }

    const fromQuery = req.query?.warehouseId;
    if (fromQuery && typeof fromQuery === "string" && fromQuery.trim()) {
        return fromQuery.trim();
    }

    return undefined;
};

// ---------------------------------------------------------------------------
// INTERNAL: Check if the role has global (unrestricted) warehouse access
// ---------------------------------------------------------------------------

const hasGlobalAccess = (role: Role): boolean => {
    return role === Role.SUPER_ADMIN || role === Role.ADMIN;
};

// ---------------------------------------------------------------------------
// checkWarehouseAccess — Middleware
// Validates that the requested warehouseId matches the user's assigned warehouse.
// Supports warehouseId from req.params, req.body, or req.query.
// SUPER_ADMIN and ADMIN bypass all warehouse checks.
// ---------------------------------------------------------------------------

export const checkWarehouseAccess = async (
    req: Request,
    _res: Response,
    next: NextFunction,
) => {
    try {
        const user = req.user;

        if (!user) {
            throw new AppError(
                status.UNAUTHORIZED,
                "Authentication required.",
            );
        }

        if (hasGlobalAccess(user.role)) {
            return next();
        }

        const requestedWarehouseId = extractWarehouseId(req);

        if (!requestedWarehouseId) {
            throw new AppError(
                status.BAD_REQUEST,
                "Warehouse ID is required.",
            );
        }

        if (!user.warehouseId) {
            throw new AppError(
                status.FORBIDDEN,
                "No warehouse is assigned to your account.",
            );
        }

        if (user.warehouseId !== requestedWarehouseId) {
            throw new AppError(
                status.FORBIDDEN,
                "You do not have access to this warehouse.",
            );
        }

        next();
    } catch (error) {
        next(error);
    }
};

// ---------------------------------------------------------------------------
// resolveBinWarehouseId — Helper
// Resolves the actual warehouseId for a given bin by traversing:
//   Bin → Shelf → Aisle → Zone → Warehouse
// Returns the resolved warehouseId or throws if bin not found.
// ---------------------------------------------------------------------------

export const resolveBinWarehouseId = async (binId: string): Promise<string> => {
    const bin = await prisma.bin.findFirst({
        where: { id: binId, isDeleted: false },
        include: {
            shelf: {
                include: {
                    aisle: {
                        include: {
                            zone: {
                                select: { warehouseId: true },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!bin) {
        throw new AppError(status.NOT_FOUND, "Bin not found.");
    }

    const warehouseId = bin.shelf?.aisle?.zone?.warehouseId;

    if (!warehouseId) {
        throw new AppError(
            status.INTERNAL_SERVER_ERROR,
            "Could not resolve warehouse for the specified bin.",
        );
    }

    return warehouseId;
};

// ---------------------------------------------------------------------------
// resolvePoWarehouseId — Helper
// Resolves the warehouseId for a given Purchase Order by querying the DB directly.
// Returns the resolved warehouseId or throws if PO not found.
// ---------------------------------------------------------------------------

export const resolvePoWarehouseId = async (poId: string): Promise<string> => {
    const po = await prisma.purchaseOrder.findUnique({
        where: { id: poId },
        select: { warehouseId: true },
    });

    if (!po) {
        throw new AppError(status.NOT_FOUND, "Purchase order not found.");
    }

    return po.warehouseId;
};

// ---------------------------------------------------------------------------
// checkPoWarehouseAccess — Middleware
// Resolves the PO's actual warehouse from the database, then validates that
// the authenticated user has access to that warehouse.
// Extracts PO id from req.params.id.
// ---------------------------------------------------------------------------

export const checkPoWarehouseAccess = async (
    req: Request,
    _res: Response,
    next: NextFunction,
) => {
    try {
        const user = req.user;

        if (!user) {
            throw new AppError(
                status.UNAUTHORIZED,
                "Authentication required.",
            );
        }

        if (hasGlobalAccess(user.role)) {
            return next();
        }

        const poId = req.params.id as string;

        if (!poId || typeof poId !== "string" || !poId.trim()) {
            throw new AppError(
                status.BAD_REQUEST,
                "Purchase order ID is required.",
            );
        }

        const resolvedWarehouseId = await resolvePoWarehouseId(poId.trim());

        if (!user.warehouseId) {
            throw new AppError(
                status.FORBIDDEN,
                "No warehouse is assigned to your account.",
            );
        }

        if (user.warehouseId !== resolvedWarehouseId) {
            throw new AppError(
                status.FORBIDDEN,
                "You do not have access to this warehouse.",
            );
        }

        next();
    } catch (error) {
        next(error);
    }
};

// ---------------------------------------------------------------------------
// checkBinWarehouseAccess — Middleware
// Resolves the bin's actual warehouse from the database, then validates that
// the authenticated user has access to that warehouse.
// Extracts binId from req.params, req.body, or req.query.
// ---------------------------------------------------------------------------

export const checkBinWarehouseAccess = async (
    req: Request,
    _res: Response,
    next: NextFunction,
) => {
    try {
        const user = req.user;

        if (!user) {
            throw new AppError(
                status.UNAUTHORIZED,
                "Authentication required.",
            );
        }

        if (hasGlobalAccess(user.role)) {
            return next();
        }

        const binId =
            (req.params.binId as string) ||
            (req.body?.binId as string) ||
            (req.query?.binId as string);

        if (!binId || typeof binId !== "string" || !binId.trim()) {
            throw new AppError(
                status.BAD_REQUEST,
                "Bin ID is required.",
            );
        }

        const resolvedWarehouseId = await resolveBinWarehouseId(binId.trim());

        if (!user.warehouseId) {
            throw new AppError(
                status.FORBIDDEN,
                "No warehouse is assigned to your account.",
            );
        }

        if (user.warehouseId !== resolvedWarehouseId) {
            throw new AppError(
                status.FORBIDDEN,
                "You do not have access to this warehouse.",
            );
        }

        next();
    } catch (error) {
        next(error);
    }
};
