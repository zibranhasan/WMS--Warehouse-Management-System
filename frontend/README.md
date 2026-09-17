# Warehouse Management System — Frontend

The frontend for the Warehouse Management System (WMS) is a modern web application built with Next.js and React. It provides the user interface for managing end-to-end warehouse workflows including inventory tracking, warehouse spatial mapping, procurement, sales orders, picking, packing, shipping, and real-time operational notifications.

---

## Technology Stack

| Category | Technology | Purpose |
| --- | --- | --- |
| **Framework & Core** | Next.js 16 (App Router), React 19, TypeScript | Application framework, routing, and type safety |
| **Styling & UI System** | Tailwind CSS v4, shadcn/ui (`@base-ui/react`, `class-variance-authority`, `tailwind-merge`) | Utility-first styling and accessible UI components |
| **Icons & Animations** | Lucide React, `tw-animate-css` | UI iconography and micro-animations |
| **Server State & Data Fetching** | TanStack Query (`@tanstack/react-query` v5) | Caching, background synchronization, and server state management |
| **Tables & Data Display** | TanStack Table (`@tanstack/react-table` v8) | Headless table data management, sorting, filtering, and pagination |
| **Forms & Validation** | React Hook Form, Zod (`@hookform/resolvers`) | Client-side form management and schema validation |
| **Realtime Client** | Socket.IO Client (`socket.io-client`) | WebSockets connection for live notification delivery |

---

## Frontend Architecture

The frontend follows a modular, feature-first architecture where domain logic is decoupled from general UI presentation:

```text
User Interface / App Pages (app/(dashboard)/*)
         │
         ▼
Feature Components (features/*/components/*)
         │
         ▼
Custom React Query Hooks (features/*/*.hooks.ts)
         │
         ▼
Feature API Handlers (features/*/*.api.ts)
         │
         ▼
Core API Client (lib/api/api-client.ts)
         │
         ▼ HTTP Requests with Session Cookies
Backend REST API (/api/v1/*)
```

- **Data Flow**: Page views render feature-specific components which trigger custom hooks built on TanStack Query.
- **API Client**: The centralized `apiClient` handles base URL resolution, query parameter formatting, cookie forwarding (`credentials: "include"`), and structured `ApiError` throwing.
- **Form Handling**: Forms utilize React Hook Form connected to Zod schemas through `@hookform/resolvers/zod` to validate user inputs before dispatching mutations.
- **Component Organization**: UI code is cleanly separated into primitive components (`components/ui`), application shell and navigation (`components/layout`), reusable data display widgets (`components/shared`), and domain-specific feature modules (`features/*`).

---

## Project Structure

```text
frontend/
├── public/
├── src/
│   ├── app/
│   │   ├── (auth)/             # Public authentication route group
│   │   │   ├── forgot-password/
│   │   │   ├── login/
│   │   │   ├── reset-password/
│   │   │   └── verify-email/
│   │   ├── (dashboard)/        # Protected operational route group
│   │   │   ├── aisles/
│   │   │   ├── bins/
│   │   │   ├── brands/
│   │   │   ├── categories/
│   │   │   ├── change-password/
│   │   │   ├── dashboard/
│   │   │   ├── inventory/
│   │   │   ├── packing/
│   │   │   ├── picking/
│   │   │   ├── products/
│   │   │   ├── profile/
│   │   │   ├── purchase-orders/
│   │   │   ├── sales-orders/
│   │   │   ├── shelves/
│   │   │   ├── shipping/
│   │   │   ├── suppliers/
│   │   │   ├── users/
│   │   │   ├── warehouses/
│   │   │   └── zones/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── layout/             # App shell, sidebar, mobile sidebar, header, user nav
│   │   ├── shared/             # DataTable, pagination, status badges, modals, skeletons
│   │   └── ui/                 # Button, Dialog, Input, and design primitives
│   ├── config/
│   │   └── navigation.config.ts # Sidebar navigation items and role requirements
│   ├── features/               # Feature domain modules (api, hooks, schemas, types, UI)
│   ├── lib/
│   │   ├── api/                # apiClient and ApiError classes
│   │   ├── routes.ts           # Route protection definitions and role authorization
│   │   ├── socket.ts           # Socket.IO client instance singleton
│   │   └── utils.ts            # Class name merge utilities (cn)
│   ├── providers/
│   │   ├── query-provider.tsx  # TanStack QueryClient provider
│   │   └── socket-provider.tsx # Socket.IO context and connection lifecycle provider
│   └── proxy.ts                # Session verification and middleware route routing logic
├── package.json
├── tsconfig.json
├── next.config.ts
└── .env.local
```

---

## Feature / Module Structure

Each domain folder under `src/features/` is organized with consistent conventions:

```text
features/<feature-name>/
├── <feature-name>.api.ts      # API call functions using apiClient
├── <feature-name>.hooks.ts    # useQuery and useMutation hooks
├── <feature-name>.schema.ts   # Zod validation schemas
├── <feature-name>.types.ts    # TypeScript interface and type definitions
└── components/                # Feature-specific tables, dialogs, and forms
```

### Implemented Feature Modules

- **`auth`**: Login, password reset request/submission, email verification, and current user (`useCurrentUser`) session querying.
- **`dashboard`**: Operational metrics, high-level inventory totals, order status counts, and summary widgets.
- **`user`**: User table, role assignments, user status changes (active, blocked, deleted), and warehouse assignments.
- **`warehouse`**: Warehouse creation, metadata updating, and active status toggling.
- **`zone`, `aisle`, `shelf`, `bin`**: Management of the physical warehouse hierarchy, storage capacities, and bin assignments.
- **`category`, `brand`, `product`, `supplier`**: Master catalog data, SKU specification management, dimensions/weights, and vendor directories.
- **`inventory`**: Real-time stock levels per warehouse and bin location, manual stock adjustments, and location transfers.
- **`purchaseOrder`**: Purchase order lifecycle management, approval actions, and dock goods receipt workflows.
- **`salesOrder`**: Sales order management, order line items, and inventory reservation tracking.
- **`picking`**: Pick task assignment, item-level pick progress tracking, and bin retrieval routing.
- **`packing`**: Packing task management, package container creation, weight/dimension recording.
- **`shipping`**: Shipment dispatch, carrier assignment, tracking number generation, and delivery status updates.
- **`notification`**: In-app notification popover, unread counter badges, and mark-as-read status updates.

---

## Routing and Pages

The application utilizes Next.js App Router route groups:

### 1. Public Authentication Routes (`app/(auth)`)
- `/login`: User credential login.
- `/forgot-password`: Password reset request form.
- `/reset-password`: Token-based password reset form.
- `/verify-email`: Email confirmation verification screen.

### 2. Protected Dashboard Routes (`app/(dashboard)`)
- `/dashboard`: Main warehouse operations overview.
- `/users`: User administration (restricted to `SUPER_ADMIN` and `ADMIN`).
- `/warehouses`, `/zones`, `/aisles`, `/shelves`, `/bins`: Warehouse layout and location configuration.
- `/categories`, `/brands`, `/products`, `/suppliers`: Master catalog management.
- `/inventory`: Stock levels, location transfers, and movement audit trails.
- `/purchase-orders`: Procurement management and goods receipt.
- `/sales-orders`: Customer sales order fulfillment and reservations.
- `/picking`, `/packing`, `/shipping`: Warehouse fulfillment operations.
- `/profile`: Authenticated user profile information.
- `/change-password`: Password change form (mandatory redirect if `needPasswordChange` is true).

---

## Authentication and Access Control

- **Session Verification**: Session cookies (`better-auth.session_token`) are verified against the backend endpoint `/auth/me`.
- **Protected Routing**: Unauthenticated requests navigating to protected routes are redirected to `/login`.
- **First-Time Password Change**: Users with the `needPasswordChange` flag set are automatically redirected to `/change-password`.
- **Role-Aware Navigation**: The sidebar navigation dynamically filters links using `allowedRoles` defined in `navigation.config.ts`.
- **Security Boundary Notice**: Frontend route gating and UI permission checks provide a smooth user experience. The backend remains the strict authority enforcing authentication, role authorization, and warehouse-scoped access control.

---

## API Integration

Backend API communication is centralized in `src/lib/api/api-client.ts`:

- **Base URL**: Reads `process.env.NEXT_PUBLIC_API_URL` (e.g., `http://localhost:5000/api/v1`).
- **Credentials**: Sends requests with `credentials: "include"` ensuring authentication cookies accompany each request.
- **Parameter Formatting**: Automatically cleans and serializes query parameters into URL search strings.
- **Error Handling**: Non-2xx responses parse the standard backend error payload and throw an instance of `ApiError` containing detailed field-level error sources.
- **API Reference**: The complete REST specification is documented in [OpenAPI Specification](../backend/docs/openapi.json).

---

## Data Fetching and State Management

Server state is managed using **TanStack Query** (`@tanstack/react-query`):

- **Query Hooks**: Custom hooks (e.g., `useProducts`, `useInventory`, `usePurchaseOrders`) handle caching, pagination, and background refetching.
- **Mutation Hooks**: Mutation operations (e.g., `useCreateProduct`, `useReceiveGoods`) trigger optimistic updates or invalidate relevant query keys (`queryClient.invalidateQueries`) to keep data consistent.
- **State States**: Loading skeletons (`TableLoadingSkeleton`) and error banners (`PageErrorAlert`) provide feedback during async transitions.

---

## Forms and Validation

- **Form State**: Managed via `react-hook-form`.
- **Validation**: Defined using **Zod** schemas in feature `*.schema.ts` files and connected via `@hookform/resolvers/zod`.
- **Pre-submission Checks**: Form inputs are validated on the client before network requests are dispatched, reducing roundtrips for basic validation failures.

---

## UI Components

The UI system is composed of:

- **Primitive Components (`src/components/ui/`)**: Built on accessible headless primitives with Tailwind CSS styling (`button.tsx`, `dialog.tsx`, `input.tsx`).
- **Layout Components (`src/components/layout/`)**: Application shell (`app-shell.tsx`), desktop sidebar (`sidebar.tsx`), responsive mobile navigation (`mobile-sidebar.tsx`), top navigation header (`header.tsx`), and user menu (`user-nav.tsx`).
- **Shared Data Widgets (`src/components/shared/`)**:
  - `data-table.tsx` & `data-table-pagination.tsx`: Reusable TanStack Table wrapper with pagination.
  - `status-badge.tsx`: Consistent badge styling for entity states (e.g., `PENDING`, `APPROVED`, `PICKED`).
  - `status-tab-filter.tsx` & `search-input.tsx`: Standardized table search and tab filters.
  - `confirm-dialog.tsx` & `modal.tsx`: Reusable action confirmation dialogs.
  - `image-upload.tsx`: Image picker widget for products and media.
  - `table-loading-skeleton.tsx` & `table-empty-state.tsx`: Loading and empty state indicators.

---

## Realtime Notifications

Real-time notifications are powered by Socket.IO:

```text
Backend Event Emitted
        │
        ▼
SocketProvider (providers/socket-provider.tsx)
        │
        ├── Listens to "notification:created"
        │
        ▼
Notification Header / Badge UI updates in real time
```

- When an authenticated user opens the application, `SocketProvider` establishes a WebSocket connection to the backend server.
- The socket automatically receives notifications targeted to the authenticated user's private channel.

---

## Development Setup

All commands must be executed from inside the `frontend/` directory:

```bash
# 1. Install dependencies
npm install

# 2. Start the local development server (runs on http://localhost:3000)
npm run dev

# 3. Create a production build
npm run build

# 4. Start the production server
npm start

# 5. Run ESLint checks
npm run lint
```

---

## Environment Variables

Configure environment variables in `frontend/.env.local`:

```env
# URL to the backend REST API (including version prefix)
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

---

## Backend Dependency

The frontend application is dependent on the WMS Backend service:
- The backend server must be running and reachable at the URL specified by `NEXT_PUBLIC_API_URL`.
- Authentication cookies set by the backend must be accessible by the browser (ensure appropriate CORS credentials and cookie domains are configured).

---

## Development Notes

When developing frontend features:
1. **Feature Encapsulation**: Keep feature-specific logic, queries, and schemas inside `src/features/<feature>/`.
2. **Use Custom Query Hooks**: Do not call `apiClient` directly inside UI components; wrap requests inside custom TanStack Query hooks.
3. **Zod Validation**: Always define and share Zod schemas for forms to mirror backend validation requirements.
4. **Reusable UI First**: Utilize components from `components/shared` (`DataTable`, `ConfirmDialog`, `StatusBadge`) to maintain consistent UI behavior across modules.

---

## Related Documentation

- [Root Project Documentation](../README.md)
- [Backend Documentation](../backend/README.md)
- [OpenAPI Specification](../backend/docs/openapi.json)
- [Database Schema Reference](../backend/docs/DATABASE_SCHEMA_REFERENCE.md)
