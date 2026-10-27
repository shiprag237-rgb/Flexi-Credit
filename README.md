# SmartBiz — All-In-One Business Management SaaS Platform

![SmartBiz SaaS Architecture](https://img.shields.io/badge/Architecture-Multi--Tenant-indigo.svg)
![Frontend](https://img.shields.io/badge/Frontend-React%20%7C%20Vite%20%7C%20TailwindCSS-blue.svg)
![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express%20ESM-green.svg)
![Database](https://img.shields.io/badge/Database-MongoDB%20%7C%20Mongoose%20ODM-emerald.svg)
![Security](https://img.shields.io/badge/Security-RBAC%20%7C%20JWT%20Cookies%20%7C%20IDOR%20Protection-red.svg)

**SmartBiz** is an enterprise-grade, multi-tenant SaaS business management web application built from first principles. It provides modern small-to-medium enterprises, agencies, retailers, consultants, wholesalers, and startups with a unified operational operating system.

---

## 🌟 Executive Summary & Key Highlights

- **True Multi-Tenant SaaS Architecture**: Shared database with strict logical tenant partitioning. Every business-owned record enforces a mandatory, indexed `businessId`. Cross-tenant queries are rejected at the database query level, preventing IDOR attacks.
- **Mandatory MongoDB Persistence**: Powered by MongoDB with 20 distinct Mongoose models. No localStorage mock persistence or hardcoded arrays.
- **Financial Precision (Minor Currency Units)**: Eliminates floating-point rounding errors by calculating and storing all monetary values in integer minor units (paise/cents, e.g. `$19.99` is stored as `1999`) with ISO currency codes.
- **Granular Role-Based Access Control (RBAC)**: Centralized authorization matrix covering 5 distinct workspace roles (**Owner**, **Admin**, **Manager**, **Accountant**, **Employee**) plus a dedicated **Platform Super Administrator** portal.
- **Real-Time Data Analytics**: Executive dashboard and reports aggregated directly from persisted MongoDB collections, distinguishing invoiced revenue, collected payments, expenses, and cash flow.
- **Built-in Billing Sandbox**: Complete subscription lifecycle management with Free, Starter, Growth, and Business tiers, plan limits enforcement, and instantaneous test-mode tier switching.

---

## 📁 Repository Structure

```
smartbiz/
├── client/                     # React 18 + Vite Frontend Application
│   ├── src/
│   │   ├── components/         # Shared UI: AppLayout, Sidebar, TopNav, Modal, DataTable, StatCard
│   │   ├── context/            # AuthContext, WorkspaceContext, NotificationContext
│   │   ├── pages/
│   │   │   ├── public/         # Landing, Features, Pricing, About, Contact, Privacy, Terms
│   │   │   ├── auth/           # Login (with 1-click demo buttons), Register, ForgotPassword
│   │   │   ├── onboarding/     # Multi-step business setup wizard
│   │   │   ├── dashboard/      # Executive KPIs, Recharts charts, cash flow, activity feed
│   │   │   ├── customers/      # CRM, contact directory, and customer detail view
│   │   │   ├── leads/          # 7-stage visual Kanban pipeline & customer conversion
│   │   │   ├── products/       # Products & service listings with SKU & pricing
│   │   │   ├── projects/       # Projects, milestones, and project detail workspace
│   │   │   ├── tasks/          # Urgency/priority task board with assignments
│   │   │   ├── team/           # Member directory, roles assignment, invitation modal
│   │   │   ├── finance/        # Income/expense transactions ledger & cash flow summary
│   │   │   ├── invoices/       # Sequential numbering, tax/discount calculation, payment modal, printable view
│   │   │   ├── inventory/      # Stock-in/stock-out movements, low-stock threshold alerts
│   │   │   ├── marketing/      # Campaign tracking, lead attribution & ROI
│   │   │   ├── reports/        # Management reporting suite with CSV export
│   │   │   ├── notifications/  # Notification center with mark-all-as-read
│   │   │   ├── settings/       # Workspace branding, invoicing tax rules, billing sandbox, roles matrix
│   │   │   └── platform/       # SuperAdmin portal: cross-tenant analytics, status toggle & audit logs
│   │   ├── services/           # Axios-like unified fetch API client with credentials
│   │   ├── utils/              # Currency formatting, date/time helpers, badge styling
│   │   ├── App.jsx             # React Router v6 route hierarchy with layout guards
│   │   └── main.jsx            # React root entry point
│   ├── package.json
│   └── vite.config.js          # Vite with dev server proxy to http://localhost:5000
│
├── server/                     # Node.js + Express REST API Backend
│   ├── src/
│   │   ├── config/             # MongoDB connection, plan definitions & quotas
│   │   ├── models/             # 20 Mongoose schemas (User, Business, Invoice, etc.)
│   │   ├── routes/             # RESTful API route definitions under /api/v1
│   │   ├── controllers/        # Request handling and HTTP orchestration
│   │   ├── services/           # Invoice calculations, inventory consistency, analytics aggregations
│   │   ├── middleware/         # Auth, Tenant context, RBAC check, Zod validation, error handler
│   │   ├── policies/           # roleDefinitions.js (Permissions matrix & hasPermission helper)
│   │   ├── validators/         # Zod validation schemas for all incoming payloads
│   │   ├── utils/              # Token generation, currency conversion, seed data
│   │   ├── app.js              # Express app setup with Helmet, CORS, Rate-limiting, Cookie-parser
│   │   └── server.js           # Server bootstrap & graceful shutdown handler
│   ├── tests/                  # Node.js native test runner test suite
│   │   ├── businessLogic.test.js    # Currency math, server invoice totals, stock constraints, RBAC checks
│   │   └── tenantIsolation.test.js  # IDOR protection, cross-tenant leak prevention
│   └── package.json
│
├── docs/                       # Technical Specifications & Documentation
│   ├── architecture.md         # Full system architecture & multi-tenant isolation model
│   ├── database-schema.md      # Detailed schema definitions for all 20 Mongoose entities
│   ├── api-reference.md        # Comprehensive REST API endpoint reference
│   ├── security.md             # Threat model, token invariants, and IDOR prevention
│   └── deployment.md           # Deployment runbook, production hardening checklist
│
├── package.json                # Root orchestration scripts
└── README.md                   # Complete platform documentation
```

---

## 🛠️ Mandatory Technology Stack

| Layer | Technologies | Rationale |
|---|---|---|
| **Frontend** | React 18, Vite, React Router v6 | Single-Page Application with rapid HMR and sub-second builds. |
| **Styling** | Tailwind CSS | Utility-first, sleek enterprise dashboard styling with tailored palettes. |
| **Data Viz** | Recharts | Composable SVG charts for revenue trends, expense breakdowns, and funnels. |
| **Icons** | Lucide React | Consistent, lightweight vector icon system. |
| **Validation** | Zod | Schema validation for forms and payloads. |
| **Backend** | Node.js (v18+), Express.js (ESM) | High-performance non-blocking asynchronous REST API. |
| **Database** | MongoDB with Mongoose ODM | Compulsory document store with schema enforcement, indexes, and aggregation pipelines. |
| **Security** | JWT in `HttpOnly` Cookies, Bcrypt | Defense-in-depth against XSS and CSRF. |
| **Testing** | Node.js Native Test Runner (`node:test`) | Fast, zero-dependency unit and integration testing. |

---

## 🚀 Quickstart & Installation

### Prerequisites
- **Node.js** v18.0.0 or higher
- **npm** v9.0.0 or higher
- **MongoDB** running locally (e.g. `mongodb://127.0.0.1:27017/smartbiz`) OR a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster URI.

### 1. Clone & Install Dependencies
From the repository root:
```bash
# Install root, backend, and frontend dependencies in one command
npm run install:all
```
*(Or install separately with `cd server && npm install` and `cd client && npm install`)*

### 2. Configure Environment Variables
Copy the example environment files:
```bash
# Backend configuration
cp server/.env.example server/.env

# Frontend configuration
cp client/.env.example client/.env
```

Ensure `server/.env` contains your MongoDB connection string:
```ini
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/smartbiz
# Or your MongoDB Atlas connection string:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/smartbiz?retryWrites=true&w=majority
JWT_SECRET=smartbiz_super_secret_jwt_key_2026_dev_environment_only_change_in_prod
CLIENT_ORIGIN=http://localhost:5173
```

### 3. Seed Initial Demo Data (Optional)
To populate the database with demonstration tenants, users, invoices, leads, inventory, and transactions:
```bash
npm run seed
```

### 4. Run the Application
Start both the Express API and Vite React server concurrently:
```bash
npm run dev
```

- **Frontend Client**: Open [http://localhost:5173](http://localhost:5173) in your browser.
- **Backend API**: Running at [http://localhost:5000/api/v1](http://localhost:5000/api/v1).
- **Health Check**: [http://localhost:5000/health](http://localhost:5000/health).

---

## 🔑 Pre-Configured Demo Accounts

For instant evaluation, the login screen (`/login`) features **1-Click Quick Demo Sign-In buttons**:

| Account | Email | Password | Role | Workspace | Description |
|---|---|---|---|---|---|
| **Alice Owner** | `alice@acme.com` | `Password123!` | Business Owner | Acme Cloud Solutions | Complete workspace ownership, billing, team invites, financial control. |
| **Diana Accountant** | `diana@acme.com` | `Password123!` | Accountant | Acme Cloud Solutions | Full financial ledger, invoices, payments. Restricted from team management. |
| **Sam Summit** | `sam@summit.com` | `Password123!` | Business Owner | Summit Retail Group | Completely separate tenant workspace demonstrating multi-tenant isolation. |
| **Super Administrator** | `admin@smartbiz.io` | `AdminPassword123!` | Platform SuperAdmin | Platform Admin Area | Global cross-tenant analytics, workspace suspension, security audit log. |

---

## 📦 Application Modules Overview

| Module | Route | Key Features & Implementation Details |
|---|---|---|
| **Dashboard** | `/dashboard` | Executive KPI cards (Revenue, Expenses, Net Margin, Receivables), Recharts area & donut charts, date range selector, recent transactions and activities feed. |
| **Customers CRM** | `/customers` | Full customer lifecycle, contact cards, billing/shipping addresses, interaction notes, linked projects, and transaction history. |
| **Sales Leads** | `/leads` | Visual 7-stage Kanban board (*New, Contacted, Qualified, Proposal, Negotiation, Won, Lost*), deal values, and 1-click duplicate-safe conversion to Customer. |
| **Products & Services** | `/products` | Catalog for physical goods and consulting services, SKUs, flexible tax rates, and optional inventory tracking toggle. |
| **Projects & Milestones** | `/projects` | Project manager assignment, customer linking, milestone schedules, budget tracking, and status progression (*Planning, In Progress, On Hold, Completed*). |
| **Tasks & Team** | `/tasks`, `/team` | Workload distribution, priority matrix (*Low, Medium, High, Urgent*), due date reminders, and secure invitation links with expiring tokens. |
| **Finance & Ledger** | `/finance` | Double-entry income and expense transactions, payment method classification, linked customers/invoices, and net cash flow summary. |
| **Invoicing & Payments** | `/invoices` | Scoped sequential invoice numbers (`INV-0001`), server-side line item arithmetic, tax/discount computation, partial payment recording, and printable invoice layout. |
| **Inventory Management** | `/inventory` | Atomic stock movements (*Stock-In, Stock-Out, Adjustment*), reorder threshold alerts, supplier directory, and inventory consistency enforcement. |
| **Marketing Campaigns** | `/marketing` | Campaign budgets, channels (*Social, Email, Paid Ads, Referral, Offline*), manual ROI calculation, and lead attribution tracking. |
| **Reports & Insights** | `/reports` | Audited management reports (Revenue vs. Expenses, Project Budgets, Lead Conversion Rate, Stock Valuation) with instant CSV data exports. |
| **Notifications** | `/notifications` | Real-time event notifications for task assignments, approaching invoice due dates, low-stock warnings, and deal closures. |
| **Workspace Settings** | `/settings` | Organization profile, currency settings, timezone, default invoice terms, role permissions matrix, and billing sandbox. |
| **Platform SuperAdmin** | `/platform` | SaaS platform control: aggregate registrations, active paid subscriptions, workspace suspension/reactivation, and security audit log. |

---

## 🔒 Security Architecture & Multi-Tenant Isolation

### 1. Zero Trust Scoped Identifier
SmartBiz strictly rejects frontend claims of authority:
```javascript
// Example: Safe tenant-isolated query enforced across all controllers
const customer = await Customer.findOne({
  _id: req.params.customerId,
  businessId: req.businessId // Verified from auth membership, NEVER from client body
});
if (!customer) throw new NotFoundError('Customer not found in active workspace');
```

### 2. Defense-in-Depth Pipeline
1. **Authentication**: Signed JWT verified from `HttpOnly`, `SameSite=Lax` cookies.
2. **Tenant Membership**: Database verification that `req.user._id` possesses an active `BusinessMembership` inside the target `:businessId`.
3. **Role Authorization**: Role-based action validation (`hasPermission(role, 'module:action')`) before controller execution.
4. **Input Sanitization**: Strict Zod validation schemas stripping unauthorized fields.
5. **Rate Limiting**: IP-based rate limiting on sensitive authentication and billing endpoints.

---

## 🧪 Automated Test Suite

SmartBiz includes automated tests covering domain calculations, currency math, RBAC permissions, and multi-tenant isolation:

```bash
# Run backend test suite
cd server
npm test
```

### Test Coverage Highlights
- **Unit Calculations**: Verifies `calculateInvoiceTotals` correctly computes line-item taxes, per-item discounts, and minor unit totals.
- **Currency Safety**: Verifies `toMinorUnits` and `toMajorUnits` precision.
- **RBAC Matrix**: Verifies Owner, Admin, Manager, Accountant, and Employee permission boundaries.
- **Zod Schemas**: Verifies validation rules reject invalid email formats and empty names.
- **Multi-Tenant Isolation**: Verifies Tenant A queries and mutations cannot inspect or alter Tenant B customers, projects, or invoices.

---

## 💳 Subscription Plans & Billing Sandbox

SmartBiz includes a configured subscription system with 4 tiers:

| Tier | Price | Quotas & Feature Entitlements |
|---|---|---|
| **Free** | $0/mo | 1 workspace, 3 team members, 50 customers, 20 invoices/mo, 5 projects. |
| **Starter** | $29/mo | 1 workspace, 10 team members, 250 customers, 100 invoices/mo, 25 projects, financial ledger. |
| **Growth** | $79/mo | 1 workspace, 30 team members, 1,000 customers, unlimited invoices & projects, physical inventory tracking, marketing campaigns, CSV reports. |
| **Business** | $199/mo | Unlimited workspaces, 100+ team members, unlimited customers & transactions, full API access, priority support. |

*In the development environment, the billing sandbox in `/settings` allows switching between plans with instant entitlement updates.*

---

## 📄 License & Commercial Distribution

SmartBiz is designed as a standalone, commercial multi-tenant SaaS application. All rights reserved.
