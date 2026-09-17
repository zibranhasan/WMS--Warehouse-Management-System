# Warehouse Management System (WMS)

A modular Warehouse Management System built to streamline end-to-end inventory operations, supply chain workflows, and order fulfillment. The system provides central management for stock tracking, physical warehouse hierarchy, procurement, sales orders, picking, packing, and shipment dispatching.

---

## Main Features

- **Authentication & User Management**: Session-based authentication powered by Better Auth, supporting user profiles, status tracking (active, blocked, deleted), and password management.
- **Role-Based Access Control (RBAC)**: Fine-grained access control with warehouse-level scoping to ensure staff only access resources within authorized locations.
- **Warehouse Management**: Support for multi-warehouse setups with operational status toggles and location tracking.
- **Physical Warehouse Hierarchy**: Granular spatial modeling structuring storage into Zones, Aisles, Shelves, and Bins with capacity and dimensions.
- **Master Data Management**: Centralized management for product catalogs, categories, brands, and suppliers.
- **Inventory & Stock Operations**: Real-time stock level monitoring across warehouses and bins, location movements (allocate, deallocate, transfer), adjustments, and low-stock alerts.
- **Procurement & Goods Receiving**: Full purchase order lifecycle from draft and approvals to partial or full goods receipt into inventory.
- **Sales Orders & Stock Reservations**: Sales order processing with automatic inventory reservation mechanisms to prevent overselling.
- **Picking Operations**: Task assignments for warehouse staff, tracking pick progress at the item and bin level.
- **Packing & Packages**: Packing workflows with package creation, container item assignments, weight, and dimension tracking.
- **Shipping & Dispatch**: Shipment creation, carrier assignment, tracking number generation, shipping method selection, and delivery status updates.
- **Real-Time Notifications**: Event-driven notification system with user-specific Socket.IO rooms for operational alerts.

---

## Technology Stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, TanStack Query, TanStack Table, React Hook Form, Zod, Lucide React, shadcn/ui |
| **Backend** | Node.js, Express 5, TypeScript, tsx |
| **Database & ORM** | PostgreSQL, Prisma ORM (with multi-file schema architecture & `@prisma/adapter-pg`) |
| **Authentication** | Better Auth, JSON Web Tokens (jsonwebtoken), cookie-parser |
| **Validation & Schemas** | Zod, `@asteasolutions/zod-to-openapi` |
| **Realtime Communication** | Socket.IO (Server & Client) |
| **Media Storage** | Cloudinary via Multer (`multer-storage-cloudinary`) |
| **Email & Templating** | Nodemailer, EJS |
| **Payments** | Stripe (configured but currently inactive) |
| **API Documentation** | OpenAPI 3.1 specification |

---

## Architecture Overview

The system follows a layered architecture separating concerns across routing, business logic, data access, and real-time events:

```text
Client (Next.js / Browser)
   │
   ▼ HTTP / REST
Express Application (app.ts / server.ts)
   │
   ├── Middleware Layer
   │     ├── checkAuth (Better Auth session verification)
   │     ├── checkWarehouseAccess (Warehouse-scoped RBAC enforcement)
   │     ├── validateRequest (Zod schema validation)
   │     └── globalErrorHandler (Centralized error formatting)
   │
   ├── Modular API Routes (/api/v1/*)
   │     └── Controllers ──► Services ──► Prisma ORM Client
   │                                             │
   │                                             ▼
   │                                     PostgreSQL Database
   │
   ├── Supporting Services
   │     ├── Socket.IO Server (Authenticated real-time user channels)
   │     ├── Cloudinary (Image upload handling)
   │     └── Nodemailer (System email delivery)
   │
   └── Documentation Endpoint (/api/v1/docs/openapi.json)
```

1. **Incoming Requests**: HTTP requests pass through CORS and body parsing before reaching the API route router.
2. **Authentication & Authorization**: Handled via `checkAuth` to verify active sessions and roles, followed by `checkWarehouseAccess` which checks warehouse access restrictions for non-admin users.
3. **Validation**: Route payloads are validated against Zod schemas via `validateRequest`.
4. **Business Logic & Data Access**: Controllers delegate business rules to service layers, which interact directly with PostgreSQL via Prisma ORM.
5. **Real-time Updates**: Side effects (such as status updates or notifications) emit events to user-specific Socket.IO rooms.

---

## Main Business Workflows

### 1. Procurement Workflow

```text
Purchase Order (Pending)
   │
   ▼
PO Approval / Rejection
   │
   ▼ (Approved)
Goods Receipt (Dock Receiving)
   │
   ▼
Stock Inward & Bin Allocation (Inventory Updated)
```

- **Purchase Order**: Created in `PENDING` state containing supplier details, target warehouse, items, quantities, and expected costs.
- **Approval**: Authorized procurement managers review and approve the purchase order.
- **Goods Receipt**: When items arrive at the warehouse dock, items and received quantities are recorded. The system supports full or partial receipts.
- **Inventory Update**: Confirmed receipts increase available inventory stock and generate stock movement audit records.

### 2. Fulfillment Workflow

```text
Sales Order (Pending)
   │
   ▼
Stock Reservation (Active)
   │
   ▼
Picking (Assigned ──► In Progress ──► Picked)
   │
   ▼
Packing (Packed into Packages)
   │
   ▼
Shipping (Carrier Assigned ──► In Transit ──► Delivered)
```

- **Sales Order & Reservation**: A confirmed sales order creates an active stock reservation against available warehouse inventory to prevent double allocation.
- **Picking**: A picking record is generated with specific warehouse bin locations for floor staff to retrieve items.
- **Packing**: Picked items are verified, grouped into packages, and labeled with package dimensions and weights.
- **Shipping & Delivery**: A shipment record is created with carrier details and tracking identifiers. Once dispatched, status moves from `SHIPPED` through `IN_TRANSIT` to `DELIVERED`, consuming reserved inventory.

---

## User Roles

The system defines six roles with specific access levels:

- **SUPER_ADMIN**: Unrestricted global access to all system entities, administrative settings, user management, and all warehouses. Bypasses warehouse isolation checks.
- **ADMIN**: Broad administrative permissions across all warehouse operations, master data management, and operational reporting. Bypasses warehouse isolation checks.
- **WAREHOUSE_MANAGER**: Operational management restricted to assigned warehouse(s). Manages bin structures, monitors local inventory levels, and oversees picking, packing, and shipment workflows.
- **PROCUREMENT**: Manages supplier relationships, product acquisition, purchase orders, and receiving coordination.
- **STAFF**: Floor operators responsible for executing warehouse tasks including item picking from designated bins, package packing, and physical stock transfers.
- **FINANCE**: View and verify financial aspects of purchasing, order fulfillment costs, and billing states.

---

## Warehouse and Inventory Model

Physical warehouse storage is organized in a hierarchical tree:

```text
Warehouse
 └── Zone (e.g., Cold Storage, Dry Goods, Bulk)
      └── Aisle
           └── Shelf
                └── Bin (Specific physical storage slot)
```

- **Warehouse Isolation**: Staff operations are bounded to their assigned warehouse unless possessing global administrative privileges.
- **Bin Allocation**: Products are stored and tracked at the bin level, allowing accurate routing for stock put-away and picking.
- **Inventory Tracking**: Inventory balances track total stock, reserved stock, and available stock per product and warehouse location.

---

## Project Structure

```text
WMS- Warehouse Management System/
├── backend/
│   ├── docs/
│   │   ├── DATABASE_SCHEMA_REFERENCE.md
│   │   ├── WMS-API Diagram.png
│   │   └── openapi.json
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema/
│   │   │   ├── auth.prisma
│   │   │   ├── enums.prisma
│   │   │   ├── inventory.prisma
│   │   │   ├── master-data.prisma
│   │   │   ├── packing.prisma
│   │   │   ├── physical-structure.prisma
│   │   │   ├── picking.prisma
│   │   │   ├── procurement.prisma
│   │   │   ├── sales.prisma
│   │   │   ├── schema.prisma
│   │   │   ├── shipping.prisma
│   │   │   └── system.prisma
│   │   └── DATABASE_SCHEMA_REFERENCE.md
│   ├── src/
│   │   ├── app/
│   │   │   ├── config/
│   │   │   ├── errorHelpers/
│   │   │   ├── interfaces/
│   │   │   ├── lib/
│   │   │   ├── middleware/
│   │   │   ├── module/
│   │   │   ├── openapi/
│   │   │   ├── routes/
│   │   │   ├── shared/
│   │   │   ├── socket/
│   │   │   ├── templates/
│   │   │   └── utils/
│   │   ├── app.ts
│   │   ├── generate-openapi.ts
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   ├── (dashboard)/
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   ├── config/
│   │   ├── features/
│   │   ├── lib/
│   │   ├── providers/
│   │   └── proxy.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── next.config.ts
├── docker-compose.yml
└── README.md
```

---

## Database Documentation

The system uses PostgreSQL managed through Prisma ORM with a modular multi-file schema setup under `backend/prisma/schema/`.

Detailed schema documentation, including model fields, constraints, enums, and entity relationships, is documented in:

- [Database Schema Reference](backend/docs/DATABASE_SCHEMA_REFERENCE.md)

---

## API Documentation

The backend exposes a REST API structured under `/api/v1`. OpenAPI 3.1 specifications are generated from Zod route schemas and maintained in:

- [OpenAPI Specification](backend/docs/openapi.json)

When running the backend server, the raw specification can also be accessed via the `/api/v1/docs/openapi.json` route.

---

## Getting Started

### Prerequisites

- Node.js (v20+ recommended)
- PostgreSQL database instance
- Cloudinary account (for image upload features)
- SMTP server credentials (for email notifications)

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `backend/` directory and configure the required environment variables:
   ```env
   NODE_ENV=development
   PORT=5000
   DATABASE_URL=postgresql://user:password@localhost:5432/wms_db?schema=public

   BETTER_AUTH_SECRET=your_better_auth_secret
   BETTER_AUTH_URL=http://localhost:5000

   ACCESS_TOKEN_SECRET=your_jwt_access_secret
   REFRESH_TOKEN_SECRET=your_jwt_refresh_secret
   ACCESS_TOKEN_EXPIRES_IN=1d
   REFRESH_TOKEN_EXPIRES_IN=7d

   EMAIL_SENDER_SMTP_USER=your_smtp_user
   EMAIL_SENDER_SMTP_PASS=your_smtp_password
   EMAIL_SENDER_SMTP_HOST=smtp.example.com
   EMAIL_SENDER_SMTP_PORT=587
   EMAIL_SENDER_SMTP_FROM=no-reply@wms.example.com

   FRONTEND_URL=http://localhost:3000

   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

   SUPER_ADMIN_EMAIL=admin@example.com
   SUPER_ADMIN_PASSWORD=your_secure_password
   ```

4. Apply database migrations and generate the Prisma client:
   ```bash
   npm run migrate
   npm run generate
   ```

5. Start the backend development server:
   ```bash
   npm run dev
   ```

The backend server starts on `http://localhost:5000`.

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `frontend/.env.local` if needed (e.g. backend API URL).

4. Start the frontend development server:
   ```bash
   npm run dev
   ```

The frontend application runs on `http://localhost:3000`.

---

## Development Commands

### Backend Commands

Run these inside the `backend/` directory:

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the development server using `tsx watch` |
| `npm run build` | Compiles TypeScript files to JavaScript in `dist/` |
| `npm start` | Runs the compiled server from `dist/server.js` |
| `npm run lint` | Runs ESLint on files in `src/` |
| `npm run generate:openapi` | Generates the OpenAPI 3.1 JSON specification file |
| `npm run generate` | Generates the Prisma Client |
| `npm run migrate` | Runs database migrations in development mode |
| `npm run studio` | Opens Prisma Studio web GUI for inspecting database records |
| `npm run push` | Pushes the Prisma schema state directly to the database without migrations |
| `npm run pull` | Introspects an existing database and updates the Prisma schema |

### Frontend Commands

Run these inside the `frontend/` directory:

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the Next.js development server |
| `npm run build` | Builds the production Next.js application |
| `npm start` | Starts the Next.js production server |
| `npm run lint` | Runs ESLint on frontend code |

---

## Project Status

- **Backend Architecture & API**: Complete backend module structure implemented, covering all core domains (authentication, warehouse physical hierarchy, inventory, procurement, sales orders, picking, packing, shipping, and real-time socket events).
- **Database Schema**: Multi-file Prisma schema with relational models and PostgreSQL migrations configured.
- **Frontend**: Next.js App Router application setup with dashboard shell and components under active development.
- **Testing & CI/CD**: Automated testing suites and CI/CD deployment pipelines are not yet configured in the repository.
