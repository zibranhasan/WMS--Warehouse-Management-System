# ------------------------------------------------------------------------------
# Stage 1: Base
# ------------------------------------------------------------------------------
FROM node:22-alpine AS base

WORKDIR /app

# Install openssl for Prisma runtime support and su-exec for privilege dropping
RUN apk add --no-cache openssl su-exec

# ------------------------------------------------------------------------------
# Stage 2: Dependencies & Prisma Generation
# ------------------------------------------------------------------------------
FROM base AS dependencies

COPY package.json package-lock.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

RUN npm ci --legacy-peer-deps

# Generate Prisma Client for Linux Alpine (dummy DATABASE_URL satisfies Prisma 7 config validation at build time)
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

# ------------------------------------------------------------------------------
# Stage 3: Builder
# ------------------------------------------------------------------------------
FROM base AS builder

COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/src/generated ./src/generated
COPY package.json package-lock.json tsconfig.json prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src

RUN npm run build

# Prisma 7.9.1 generates both .ts and .js files under src/generated/prisma/.
# tsc only compiles .ts -> .js in dist/, so the CJS runtime files (index.js,
# runtime/client.js, query_compiler_fast_bg.js, etc.) must be copied manually.
#
# These CJS files cannot live alongside the tsc-compiled ESM files because the
# project uses "type":"module". We place them under dist/generated/prisma/cjs/
# with its own package.json {"type":"commonjs"} and create an ESM index.js
# wrapper that re-exports everything via createRequire.
RUN mkdir -p dist/generated/prisma/cjs/runtime && \
    cp src/generated/prisma/index.js dist/generated/prisma/cjs/index.js && \
    cp src/generated/prisma/runtime/client.js dist/generated/prisma/cjs/runtime/client.js && \
    cp src/generated/prisma/query_compiler_fast_bg.js dist/generated/prisma/cjs/ && \
    cp src/generated/prisma/query_compiler_fast_bg.wasm-base64.js dist/generated/prisma/cjs/ && \
    echo '{"type":"commonjs"}' > dist/generated/prisma/cjs/package.json && \
    printf 'import{createRequire as _cr}from"node:module";const require=_cr(import.meta.url);const m=require("./cjs/index.js");export const PrismaClient=m.PrismaClient;export const Prisma=m.Prisma;export const $Enums=m.$Enums;export const Role=m.Role;export const UserStatus=m.UserStatus;export const WarehouseStatus=m.WarehouseStatus;export const LocationStatus=m.LocationStatus;export const CategoryStatus=m.CategoryStatus;export const BrandStatus=m.BrandStatus;export const ProductStatus=m.ProductStatus;export const StockMovementType=m.StockMovementType;export const LocationMovementType=m.LocationMovementType;export const SupplierStatus=m.SupplierStatus;export const PurchaseOrderStatus=m.PurchaseOrderStatus;export const SalesOrderStatus=m.SalesOrderStatus;export const ReservationStatus=m.ReservationStatus;export const PickingStatus=m.PickingStatus;export const PickingItemStatus=m.PickingItemStatus;export const PackingStatus=m.PackingStatus;export const PackingItemStatus=m.PackingItemStatus;export const PackageStatus=m.PackageStatus;export const ShipmentStatus=m.ShipmentStatus;export const ShippingMethod=m.ShippingMethod;export const NotificationType=m.NotificationType;export default m;\n' > dist/generated/prisma/index.js

# ------------------------------------------------------------------------------
# Stage 4: Production Runtime
# ------------------------------------------------------------------------------
FROM base AS runner

ENV NODE_ENV=production
ENV PORT=5000

WORKDIR /app

# Copy dependencies and build artifacts
COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/src/app/templates ./src/app/templates
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=node:node /app/package.json ./package.json

# Copy entrypoint and ensure it is executable
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
