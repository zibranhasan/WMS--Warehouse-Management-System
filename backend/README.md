# Warehouse Management System — Backend

The backend service for the Warehouse Management System (WMS) provides the core REST API, business logic execution, authentication, role-based and warehouse-scoped access control, database management, and real-time notification delivery.

---

## Backend Stack

| Layer / Concern | Technology | Description |
| --- | --- | --- |
| **Runtime & Framework** | Node.js, Express 5, TypeScript | HTTP server and REST API framework |
| **Development & Build** | tsx, TypeScript (`tsc`) | TypeScript execution and transpilation |
| **Database & ORM** | PostgreSQL, Prisma ORM | Relational database with multi-file schema architecture and `@prisma/adapter-pg` |
| **Authentication** | Better Auth, jsonwebtoken | Session and cookie-based authentication with JWT token support |
| **Request Validation** | Zod | Runtime validation for route bodies, queries, and parameters |
| **Realtime Communication** | Socket.IO | WebSockets with authenticated user-specific rooms |
| **File Storage** | Cloudinary, Multer | Image upload handling via `multer-storage-cloudinary` |
| **Email & Templating** | Nodemailer, EJS | System email notifications and rendered email templates |
| **Payments** | Stripe SDK | Configured in environment and dependencies, but currently inactive |
| **API Documentation** | OpenAPI 3.1 | `@asteasolutions/zod-to-openapi` schema generation |

---

## Backend Architecture

The backend implements a structured layered architecture that separates concerns across routing, middleware, controllers, business services, and database persistence:

```text
Client Request
      │
      ▼
Express Router (/api/v1/*)
      │
      ▼
Middleware Layer
  ├── checkAuth (Better Auth session verification)
  ├── checkWarehouseAccess (Warehouse-scoped RBAC verification)
  └── validateRequest (Zod schema validation)
      │
      ▼
Controller Layer (Request parameter extraction & sendResponse formatting)
      │
      ▼
Service Layer (Business rules, validations, and prisma.$transaction blocks)
      │
      ▼
Prisma ORM Client
      │
      ▼
PostgreSQL Database
```

- **Routes**: Define endpoint paths, HTTP verbs, and associate relevant middleware chains.
- **Middleware**: Intercepts requests to authenticate users (`checkAuth`), verify warehouse-level authorization (`checkWarehouseAccess`), and validate inputs against schemas (`validateRequest`).
- **Controllers**: Thin handlers wrapped with `catchAsync` that parse incoming request parameters and delegate to services, returning standardized responses via `sendResponse`.
- **Services**: House all domain logic, entity relationships, business validation checks, transactional orchestration (`prisma.$transaction`), and event emissions.
- **Global Error Handler**: Catches all downstream errors, formats Zod/Prisma/AppError instances into standard error responses, and cleans up uncommitted file uploads from Cloudinary.

---

## Project Structure

```text
backend/
├── docs/
│   ├── DATABASE_SCHEMA_REFERENCE.md
│   ├── WMS-API Diagram.png
│   └── openapi.json
├── prisma/
│   ├── migrations/
│   ├── schema/
│   │   ├── auth.prisma
│   │   ├── enums.prisma
│   │   ├── inventory.prisma
│   │   ├── master-data.prisma
│   │   ├── packing.prisma
│   │   ├── physical-structure.prisma
│   │   ├── picking.prisma
│   │   ├── procurement.prisma
│   │   ├── sales.prisma
│   │   ├── schema.prisma
│   │   ├── shipping.prisma
│   │   └── system.prisma
│   └── DATABASE_SCHEMA_REFERENCE.md
├── src/
│   ├── app/
│   │   ├── config/          # Environment configuration, Cloudinary, etc.
│   │   ├── errorHelpers/    # AppError and Prisma/Zod error formatters
│   │   ├── interfaces/      # Shared TypeScript interfaces and types
│   │   ├── lib/             # Shared client singletons (Prisma, Better Auth)
│   │   ├── middleware/      # Auth, RBAC, warehouse access, validation, error handler
│   │   ├── module/          # Domain feature modules
│   │   ├── openapi/         # OpenAPI registry and document builder
│   │   ├── routes/          # Central API v1 router index
│   │   ├── shared/          # Utilities (catchAsync, sendResponse, pick)
│   │   ├── socket/          # Socket.IO initialization, auth middleware, and events
│   │   ├── templates/       # EJS email templates
│   │   └── utils/           # QueryBuilder, tokens, passwords, warehouse helpers
│   ├── app.ts               # Express application initialization and global middleware
│   ├── generate-openapi.ts  # CLI script to generate openapi.json
│   └── server.ts            # HTTP server entrypoint and Socket.IO initialization
├── package.json
└── tsconfig.json
```

---

## Main Backend Modules

The backend organizes domain functionality into modular directories under `src/app/module/`:

- **Auth (`auth`)**: Better Auth endpoints, session management, credential registration/login, password change, and token refreshing.
- **User (`user`)**: User profile management, status updating (ACTIVE, BLOCKED, DELETED), role management, and warehouse assignment.
- **Warehouse (`warehouse`)**: Warehouse facility registration, metadata, code management, and active status tracking.
- **Physical Structure (`zone`, `aisle`, `shelf`, `bin`)**: Warehouse spatial hierarchy management defining zones, aisles, shelves, and bins with capacity and dimensions.
- **Catalog Master Data (`category`, `brand`, `product`, `supplier`)**: Product catalog management including categories, brands, product specs, SKUs, barcode tracking, and supplier contacts.
- **Inventory (`inventory`)**: Stock level tracking across warehouses, stock adjustments, inventory movements (IN, OUT, ADJUSTMENT), and bin location allocations/transfers.
- **Purchase Orders (`purchaseOrder`)**: Procurement lifecycles from creation through manager approval to goods receiving at the warehouse dock.
- **Sales Orders (`salesOrder`)**: Sales order processing with inventory reservation creation and management.
- **Picking (`picking`)**: Warehouse picking task creation, item-level pick progress tracking, and source bin resolution.
- **Packing (`packing`)**: Packing task lifecycle, package creation, container packing, package weights, and dimension recording.
- **Shipping (`shipping`)**: Shipment creation, carrier assignment, tracking number generation, shipping method selection, and delivery tracking.
- **Notifications (`notification`)**: In-app notification creation, user querying, unread count tracking, and read state updates.

---

## Authentication and Authorization

### Authentication

Authentication is handled through Better Auth mounted at `/api/auth`. Sessions and authentication tokens are passed via cookies or HTTP headers.

The `checkAuth(...allowedRoles)` middleware:
1. Validates the active session using Better Auth.
2. Checks whether the user is in an active state (`ACTIVE`). Blocked or deleted users are rejected.
3. Enforces role restrictions if specific roles are required for the route.
4. Attaches user context (`userId`, `role`, `email`, `warehouseId`) to `req.user`.

### Roles & Access Scopes

The system defines six roles:

| Role | Scope | Description |
| --- | --- | --- |
| `SUPER_ADMIN` | Global | Full administrative access across all system entities and warehouses |
| `ADMIN` | Global | General system and operational administration across all warehouses |
| `WAREHOUSE_MANAGER` | Warehouse Scoped | Manages operations, physical bins, inventory, and fulfillment within assigned warehouse |
| `PROCUREMENT` | Operations Scoped | Handles supplier management, purchase orders, and receiving |
| `STAFF` | Warehouse Scoped | Executes floor tasks (picking, packing, inventory movements) within assigned warehouse |
| `FINANCE` | Operations Scoped | Oversight of purchase costs, fulfillment financials, and order billing |

### Warehouse-Scoped Authorization

The `checkWarehouseAccess` middleware checks `warehouseId` passed via URL parameters, request body, or query strings:
- `SUPER_ADMIN` and `ADMIN` users have global access and bypass warehouse isolation checks.
- Warehouse-scoped users (`WAREHOUSE_MANAGER`, `STAFF`, etc.) must have an assigned `warehouseId` matching the target resource's warehouse.

---

## Validation and Error Handling

### Request Validation

Request payloads are validated against Zod schemas using `validateRequest(schema)`:
- Validates `req.body`, `req.query`, `req.params`, and `req.cookies`.
- Strips invalid inputs and passes typed data to the controller.

### Error Handling

The application uses a centralized error-handling pipeline:
- **`AppError`**: Custom error class containing an HTTP status code and error message.
- **Prisma Error Handlers**: Converts Prisma database exceptions (e.g., unique constraint violations `P2002`, foreign key failures `P2003`, record not found `P2025`) into readable client error messages.
- **Zod Error Handler**: Formats validation issue arrays into structured error sources.
- **Upload Cleanup**: `globalErrorHandler` triggers automatic removal of uploaded files from Cloudinary if the request fails downstream.
- **Standard Error Response Format**:
  ```json
  {
    "success": false,
    "message": "Error description",
    "errorSources": [
      {
        "path": "field_name",
        "message": "Validation or constraint message"
      }
    ],
    "stack": "..." // Only present in development mode
  }
  ```

---

## Database

- **Engine**: PostgreSQL
- **ORM**: Prisma ORM with multi-file schema support enabled under `prisma/schema/`.
- **Physical Layout Hierarchy**:
  ```text
  Warehouse ──► Zone ──► Aisle ──► Shelf ──► Bin
  ```
- **Schema Reference**: Full entity documentation, relation graphs, and enum definitions are documented in [Database Schema Reference](docs/DATABASE_SCHEMA_REFERENCE.md).

---

## API Documentation

The REST API is versioned under `/api/v1`.

- **OpenAPI 3.1 Specification**: Generated from route-level Zod schemas and saved to [OpenAPI Specification](docs/openapi.json).
- **Live OpenAPI Endpoint**: Accessible when running the backend at `/api/v1/docs/openapi.json`.
- **Generation Command**: Run `npm run generate:openapi` to rebuild `docs/openapi.json`.

---

## Transactions and Business Logic

Multi-step business processes that require atomic consistency use `prisma.$transaction`. Key examples confirmed in the service layer include:

- **Inventory Adjustments & Transfers**: Updating stock balances, creating location movements, and creating audit logs atomically.
- **Purchase Order Receiving**: Transitioning PO status, recording received items, and updating warehouse inventory balances.
- **Sales Order Reservations**: Creating sales orders and allocating inventory reservations within a single transaction.
- **Picking & Packing Lifecycles**: Updating item pick states, assigning container packages, and updating task progress.
- **Shipping Dispatch**: Generating shipments and consuming reserved inventory balances.

---

## Realtime Notifications

Real-time updates are powered by Socket.IO:

```text
Business Event Triggered (e.g., Order Created / PO Approved)
   │
   ▼
Notification Service (notification.service.ts)
   │
   ├── 1. Persist notification in PostgreSQL (prisma.notification.create)
   │
   └── 2. Emit Socket.IO event to private room (user:<userId>)
         │
         ▼
Frontend Client updates notification badge & toast in real time
```

- Socket connections authenticate during handshake via auth token headers.
- Authenticated sockets automatically join a dedicated private room: `user:<userId>`.

---

## Environment Variables

The backend requires the following environment variables configured in `backend/.env`:

```env
# Application
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/wms_db?schema=public

# Better Auth & JWT
BETTER_AUTH_SECRET=your_better_auth_secret_key
BETTER_AUTH_URL=http://localhost:5000
ACCESS_TOKEN_SECRET=your_jwt_access_secret_key
REFRESH_TOKEN_SECRET=your_jwt_refresh_secret_key
ACCESS_TOKEN_EXPIRES_IN=1d
REFRESH_TOKEN_EXPIRES_IN=7d

# Email / SMTP
EMAIL_SENDER_SMTP_USER=your_smtp_username
EMAIL_SENDER_SMTP_PASS=your_smtp_password
EMAIL_SENDER_SMTP_HOST=smtp.example.com
EMAIL_SENDER_SMTP_PORT=587
EMAIL_SENDER_SMTP_FROM=no-reply@wms.example.com

# Media Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Payments (Configured but inactive)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Initial Super Admin Seed
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=your_secure_password
```

---

## Local Development

All commands must be executed from inside the `backend/` directory:

| Command | Description |
| --- | --- |
| `npm install` | Installs backend dependencies |
| `npm run dev` | Runs development server with auto-reloading via `tsx watch` |
| `npm run build` | Compiles TypeScript files to JavaScript into `dist/` |
| `npm start` | Runs the compiled server from `dist/server.js` |
| `npm run lint` | Runs ESLint on files in `src/` |
| `npm run generate:openapi` | Generates the OpenAPI 3.1 `docs/openapi.json` file |
| `npm run generate` | Generates the Prisma Client code |
| `npm run migrate` | Executes Prisma migrations against the configured database |
| `npm run studio` | Launches the Prisma Studio web interface for browsing database records |
| `npm run push` | Directly pushes schema changes to database without migrations |
| `npm run pull` | Introspects the database and updates Prisma schema files |

---

## API & Database Documentation Links

- **OpenAPI 3.1 Specification**: [docs/openapi.json](docs/openapi.json) — Complete REST endpoint schemas, request parameters, and response bodies.
- **Database Schema Reference**: [docs/DATABASE_SCHEMA_REFERENCE.md](docs/DATABASE_SCHEMA_REFERENCE.md) — Comprehensive model attributes, relation graphs, indexes, and enum listings.

---

## Backend Development Notes

When contributing to backend modules, follow these established project conventions:

1. **Validation Before Logic**: Always define a Zod schema for new route inputs and attach `validateRequest(schema)` before the controller handler.
2. **Thin Controllers, Rich Services**: Controllers must only extract parameters, call the service layer, and invoke `sendResponse`. All validation and business logic belongs in `*.service.ts`.
3. **Authorization Layering**: Secure endpoints using `checkAuth(...)` for role permissions and `checkWarehouseAccess` whenever an operation accesses warehouse-specific resources.
4. **Use Transactions for Multi-Step Mutations**: Wrap multi-entity updates in `prisma.$transaction(async (tx) => { ... })` to maintain atomic database state.
5. **Standardized Error Throwing**: Throw `AppError(status.<CODE>, "message")` for expected business failures so the global error handler produces structured responses.
