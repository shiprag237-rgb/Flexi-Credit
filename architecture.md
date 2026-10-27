# SmartBiz SaaS Platform — System Architecture

## 1. Executive Overview
**SmartBiz** is an enterprise-grade, multi-tenant Business Management SaaS platform engineered to unify operations for small-to-medium enterprises (SMEs), agencies, retailers, consultants, and service providers. It consolidates CRM, sales pipelines, inventory, projects, tasks, invoicing, finance, marketing campaigns, team management, and executive analytics into a single pane of glass.

## 2. Multi-Tenant Architecture & Data Isolation Model

### 2.1 Logical Isolation with Scoped Identifier (`businessId`)
SmartBiz adopts a pooled, shared-database, shared-schema multi-tenant model with strict logical tenant partitioning:
- Every tenant represents a distinct `Business` entity with a unique `_id` and URL `slug`.
- Every tenant-owned data model (`Customer`, `Lead`, `Product`, `Project`, `Task`, `Invoice`, `Transaction`, `InventoryMovement`, `MarketingCampaign`, `Notification`, `AuditLog`) enforces a compulsory, indexed `businessId: { type: ObjectId, ref: 'Business', required: true, index: true }`.
- Compound unique indexes are used where business-local uniqueness is required (e.g. `{ businessId: 1, invoiceNumber: 1 }` and `{ businessId: 1, userId: 1 }` for memberships).

### 2.2 Request-Level Tenant Resolution & Security Pipeline
Every business-scoped request undergoes a mandatory 5-stage middleware pipeline:

```
[Incoming Request: /api/v1/businesses/:businessId/*]
                     │
                     ▼
  1. [authenticate] ──► Validates JWT/Session Cookie, verifies User existence & active status
                     │
                     ▼
  2. [tenantContext] ──► Validates :businessId, confirms Business exists and is not suspended
                     │
                     ▼
  3. [membership] ──► Validates user's BusinessMembership in that specific businessId
                     │
                     ▼
  4. [authorizeRole] ──► Checks user's role & granular permissions for target module:action
                     │
                     ▼
  5. [scopedHandler] ──► Injects req.businessId into all Mongoose queries and mutations
```

**Security Invariants:**
- `req.businessId` is derived exclusively from verified session authentication and membership checks.
- Direct object ID tampering across tenants returns `404 Not Found` or `403 Forbidden`.
- Super Admin platform-level access is partitioned from tenant business operations and audited.

## 3. Technology Stack

### 3.1 Backend
- **Runtime**: Node.js (v18+) with native ES Modules (`import/export`)
- **Web Framework**: Express.js with modular routers
- **Database & ODM**: MongoDB with Mongoose ODM (strict schemas, validation, middleware, aggregations)
- **Validation**: Zod schema validators for request payloads, query parameters, and route parameters
- **Security & Utilities**: `bcryptjs` / Argon2 password hashing, `jsonwebtoken`, `helmet`, `cors`, `express-rate-limit`, `cookie-parser`

### 3.2 Frontend
- **Framework & Tooling**: React 18+ with Vite
- **Language**: Modern JavaScript (ES2023)
- **Routing**: React Router v6 (Nested layout routes, authenticated guards, onboarding gates, role gates)
- **State Management**: TanStack Query (React Query v5) for server state caching & mutations; React Context for Auth, Workspace, and UI state
- **UI & Styling**: Tailwind CSS, Lucide React icons, accessible Radix-like primitives
- **Data Visualization**: Recharts for responsive, accessible financial and operational analytics
- **Forms & Validation**: React Hook Form with Zod resolver

## 4. Role-Based Access Control (RBAC) Matrix

| Module | Super Admin | Business Owner | Business Admin | Manager | Employee | Accountant |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Platform Management** | Full | None | None | None | None | None |
| **Workspace Settings & Billing** | Audit/Manage | Full | Read-Only | None | None | None |
| **Team & Roles** | Audit | Full | Full (No Owner Edit)| View Members | View Directory | None |
| **Customers & CRM** | None | Full | Full | Full | Assigned Only | Read-Only |
| **Leads & Pipeline** | None | Full | Full | Full | Assigned Only | None |
| **Products & Services** | None | Full | Full | Full | View Only | View Only |
| **Projects & Tasks** | None | Full | Full | Full | Assigned Only | View Budgets |
| **Finance & Transactions** | None | Full | With Permission | View Budgets | None | Full |
| **Invoicing & Payments** | None | Full | Full | View Only | None | Full |
| **Inventory & Stock** | None | Full | Full | Full | View/Move | View Valuation |
| **Marketing Campaigns** | None | Full | Full | Full | None | None |
| **Executive Reports** | Aggregated Platform | Full | Operational | Operational | Personal | Financial Only |

## 5. Monetary Calculation Architecture
To guarantee accounting accuracy and avoid floating point inaccuracies:
- All monetary amounts are persisted as integer minor units (`amountMinor`, `budgetMinor`, `subtotalMinor`, `taxMinor`, `totalMinor`, `paidMinor`, `balanceMinor`).
- Example: `$124.50 USD` is persisted as `12450` cents; `₹5,000.00 INR` is persisted as `500000` paise.
- Every financial entity specifies its ISO 4217 `currency` code (e.g. `USD`, `INR`, `EUR`, `GBP`).
- Invoices calculate subtotals, line item discounts, tax calculations, and net totals on the server side inside `invoiceService.js`. Client-supplied totals are rejected.
