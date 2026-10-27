# SmartBiz SaaS Platform — REST API Reference

Base URL: `/api/v1`

All responses follow a predictable JSON contract:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human-readable confirmation message",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 142,
    "totalPages": 8
  }
}
```
Errors return:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT | RATE_LIMITED | SERVER_ERROR",
    "message": "Descriptive message",
    "details": [ ... ]
  }
}
```

---

## 1. Authentication (`/api/v1/auth`)
- `POST /register` — Register new user account. Returns user info and auth token / HTTP-only cookie.
- `POST /login` — Authenticate with email/password. Returns user info, active memberships.
- `POST /logout` — Invalidate session and clear HTTP-only auth cookies.
- `GET /me` — Get current authenticated user profile, preferences, and workspaces.
- `POST /forgot-password` — Request password reset email with token.
- `POST /reset-password` — Submit new password with reset token.

## 2. Business Workspaces (`/api/v1/businesses`)
- `POST /` — Create a new business workspace (creator becomes `'owner'`). Initializes default subscription and settings.
- `GET /` — List businesses the authenticated user belongs to.
- `GET /:businessId` — Retrieve workspace details, settings, and subscription tier.
- `PATCH /:businessId` — Update workspace settings, logo, branding, currency, timezone.
- `GET /:businessId/members` — List all members in the business with roles.
- `POST /:businessId/invitations` — Send team invitation email with secure token and assigned role.
- `PATCH /:businessId/members/:memberId` — Update member role or status.
- `DELETE /:businessId/members/:memberId` — Remove member from business.

## 3. Executive Dashboard (`/api/v1/businesses/:businessId/dashboard`)
- `GET /summary` — Retrieve high-level operational and financial KPIs (revenue, expenses, net profit, outstanding payments, customer count, active leads, open projects, pending tasks, low stock count). Supports `?timeframe=today|7d|30d|this_month|previous_month|quarter|year|custom&startDate=...&endDate=...`.
- `GET /revenue` — Time-series revenue chart data.
- `GET /expenses` — Expense breakdown by category.
- `GET /leads` — Sales pipeline stage breakdown and conversion funnel.
- `GET /projects` — Project status distribution and progress.

## 4. CRM & Customer Management (`/api/v1/businesses/:businessId/customers`)
- `GET /` — Paginated customer list with search, filter by status, tag, and sort.
- `POST /` — Create a new customer profile.
- `GET /:customerId` — Retrieve customer details with related projects, invoices, and transaction history.
- `PATCH /:customerId` — Update customer details.
- `DELETE /:customerId` — Archive or delete customer.

## 5. Sales Pipeline & Leads (`/api/v1/businesses/:businessId/leads`)
- `GET /` — List leads (supports both table and Kanban stage grouping).
- `POST /` — Create lead opportunity.
- `GET /:leadId` — Retrieve lead with notes and history.
- `PATCH /:leadId` — Update lead (e.g. advance stage, update deal value, change assignee).
- `POST /:leadId/convert` — Convert lead into a paying customer with automatic customer deduplication.

## 6. Products & Services (`/api/v1/businesses/:businessId/products`)
- `GET /` — List products/services with SKU, stock status, and prices.
- `POST /` — Create product or service listing.
- `GET /:productId` — Retrieve product details.
- `PATCH /:productId` — Update product details.
- `DELETE /:productId` — Deactivate product.

## 7. Projects & Tasks
- `GET /api/v1/businesses/:businessId/projects` — List projects with status, budget, manager, and completion.
- `POST /api/v1/businesses/:businessId/projects` — Create project.
- `GET /api/v1/businesses/:businessId/projects/:projectId` — Project overview, task list, timeline, and budget.
- `PATCH /api/v1/businesses/:businessId/projects/:projectId` — Update project.
- `DELETE /api/v1/businesses/:businessId/projects/:projectId` — Delete/archive project.
- `GET /api/v1/businesses/:businessId/tasks` — List tasks with filters (`?projectId=...&assignedTo=...&status=...&priority=...`).
- `POST /api/v1/businesses/:businessId/tasks` — Create task.
- `PATCH /api/v1/businesses/:businessId/tasks/:taskId` — Update task status or priority.
- `DELETE /api/v1/businesses/:businessId/tasks/:taskId` — Delete task.

## 8. Finance & Expenses (`/api/v1/businesses/:businessId/finance`)
- `GET /summary` — Financial summary (cash in, cash out, net cash flow, categorical breakdown).
- `GET /transactions` — Paginated ledger of income and expense transactions.
- `POST /transactions` — Record new transaction.
- `GET /transactions/:transactionId` — Get transaction details.
- `PATCH /transactions/:transactionId` — Update transaction.
- `DELETE /transactions/:transactionId` — Delete transaction (audited).

## 9. Invoices & Billing (`/api/v1/businesses/:businessId/invoices`)
- `GET /` — List invoices with status, customer, totals, and balances.
- `POST /` — Create invoice draft (subtotals, discounts, taxes, and totals strictly computed on server).
- `GET /:invoiceId` — Get full invoice details.
- `PATCH /:invoiceId` — Update invoice draft.
- `POST /:invoiceId/issue` — Issue invoice (locks line items, generates official invoice number).
- `POST /:invoiceId/payments` — Record manual or gateway payment (updates balanceMinor, auto-transitions to partially_paid or paid).
- `GET /:invoiceId/pdf` — Retrieve printable/PDF invoice view format.

## 10. Inventory Management (`/api/v1/businesses/:businessId/inventory`)
- `GET /` — Inventory stock status with low-stock warnings.
- `POST /movements` — Record stock movement (`stock_in`, `stock_out`, `adjustment`, `return`).
- `GET /movements` — Audit trail of all stock movements.
- `GET /low-stock` — List items currently below threshold.

## 11. Marketing Campaigns (`/api/v1/businesses/:businessId/campaigns`)
- `GET /` — List campaigns with budget, spend, lead count, and attributed revenue.
- `POST /` — Create marketing campaign.
- `GET /:campaignId` — Campaign performance details.
- `PATCH /:campaignId` — Update campaign details and spend.
- `DELETE /:campaignId` — Archive campaign.

## 12. Reports & Analytics (`/api/v1/businesses/:businessId/reports`)
- `GET /revenue` — Revenue report with date filtering and CSV export option.
- `GET /expenses` — Categorical expense report.
- `GET /profit` — Net profit and margins analysis.
- `GET /leads` — Lead conversion efficiency and funnel analytics.
- `GET /inventory` — Stock valuation and turnover analysis.

## 13. Notifications (`/api/v1/businesses/:businessId/notifications`)
- `GET /` — User notifications list with unread counter.
- `PATCH /:notificationId/read` — Mark single notification as read.
- `POST /read-all` — Mark all user notifications as read.

## 14. Subscriptions & SaaS Plans (`/api/v1/businesses/:businessId/subscription`)
- `GET /` — Current plan, status, feature entitlements, and quota usage.
- `GET /plans` — Available subscription tiers (Free, Starter, Growth, Business) with pricing and feature matrix.
- `POST /checkout` — Create checkout session or simulate tier change in dev sandbox.
- `POST /cancel` — Request plan cancellation at period end.
- `POST /api/v1/webhooks/billing` — Stripe / Payment provider webhook receiver.
