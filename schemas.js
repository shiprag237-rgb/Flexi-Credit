import { z } from 'zod';
import { LEAD_STAGES } from '../models/Lead.js';
import { PROJECT_STATUSES } from '../models/Project.js';
import { TASK_STATUSES, TASK_PRIORITIES } from '../models/Task.js';
import { TRANSACTION_TYPES, TRANSACTION_CATEGORIES } from '../models/Transaction.js';
import { INVENTORY_MOVEMENT_TYPES } from '../models/InventoryMovement.js';
import { CAMPAIGN_CHANNELS, CAMPAIGN_STATUSES } from '../models/MarketingCampaign.js';
import { ROLES } from '../policies/roleDefinitions.js';

// Auth Schemas
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  businessName: z.string().min(2, 'Business name must be at least 2 characters').optional(),
  industry: z.string().optional(),
  businessSize: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

// Business & Membership Schemas
export const createBusinessSchema = z.object({
  name: z.string().min(2, 'Business name must be at least 2 characters').max(120),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens').optional(),
  industry: z.string().optional().transform((val) => {
    if (!val) return 'services';
    const s = val.toLowerCase();
    if (s.includes('tech') || s.includes('soft')) return 'technology';
    if (s.includes('retail') || s.includes('commerce') || s.includes('e-com')) return 'retail';
    if (s.includes('consult')) return 'consulting';
    if (s.includes('health') || s.includes('care')) return 'healthcare';
    if (s.includes('manuf') || s.includes('prod')) return 'manufacturing';
    if (s.includes('agency') || s.includes('market') || s.includes('creat')) return 'agency';
    if (s.includes('whole')) return 'wholesale';
    if (s.includes('serv')) return 'services';
    return 'other';
  }),
  businessSize: z.string().optional().transform((val) => {
    if (!val) return '1-10';
    if (val.includes('201') || val.includes('500') || val === '201+') return '201+';
    if (val.includes('51') || val.includes('200')) return '51-200';
    if (val.includes('11') || val.includes('50')) return '11-50';
    return '1-10';
  }),
  currency: z.string().max(4).default('USD').transform(s => s.toUpperCase()),
  timezone: z.string().default('UTC'),
  settings: z.object({
    invoicePrefix: z.string().optional(),
    defaultPaymentTermsDays: z.number().optional(),
    defaultPaymentTerms: z.string().optional(),
    taxRatePercent: z.number().optional(),
    taxRatePercentage: z.number().optional(),
    inventoryEnabled: z.boolean().optional(),
    marketingEnabled: z.boolean().optional(),
  }).optional(),
});

export const updateBusinessSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  industry: z.string().optional(),
  businessSize: z.string().optional(),
  currency: z.string().length(3).optional(),
  timezone: z.string().optional(),
  logoUrl: z.string().url().or(z.literal('')).optional(),
  settings: z.object({
    invoicePrefix: z.string().optional(),
    defaultPaymentTerms: z.string().optional(),
    taxRatePercentage: z.number().min(0).max(100).optional(),
    inventoryEnabled: z.boolean().optional(),
    marketingEnabled: z.boolean().optional(),
  }).optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email('Valid recipient email required').toLowerCase(),
  role: z.enum([ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE, ROLES.ACCOUNTANT]),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum([ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE, ROLES.ACCOUNTANT]),
});

// Customer Schemas
export const createCustomerSchema = z.object({
  name: z.string().min(2, 'Customer name is required'),
  companyName: z.string().optional(),
  email: z.string().email().or(z.literal('')).optional(),
  phone: z.string().optional(),
  customerType: z.enum(['individual', 'business']).default('business'),
  status: z.enum(['active', 'lead', 'inactive', 'archived']).default('active'),
  source: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  billingAddress: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  shippingAddress: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

// Lead Schemas
export const createLeadSchema = z.object({
  name: z.string().min(2, 'Lead name is required'),
  companyName: z.string().optional(),
  email: z.string().email().or(z.literal('')).optional(),
  phone: z.string().optional(),
  source: z.enum(['website', 'referral', 'campaign', 'cold_outreach', 'event', 'social', 'other']).default('website'),
  stage: z.enum(LEAD_STAGES).default('new'),
  estimatedValueMinor: z.number().min(0).default(0),
  currency: z.string().length(3).default('USD'),
  assignedTo: z.string().optional(),
  campaignId: z.string().optional(),
  nextFollowUpAt: z.string().datetime().optional().nullable(),
  notes: z.string().optional(),
});

export const updateLeadSchema = createLeadSchema.partial();

export const convertLeadSchema = z.object({
  customerName: z.string().optional(),
  companyName: z.string().optional(),
  email: z.string().email().or(z.literal('')).optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

// Product Schemas
export const createProductSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  type: z.enum(['product', 'service']).default('product'),
  sku: z.string().optional(),
  description: z.string().optional(),
  priceMinor: z.number().min(0, 'Price must be non-negative'),
  costMinor: z.number().min(0).default(0),
  currency: z.string().length(3).default('USD'),
  taxRate: z.number().min(0).max(100).default(0),
  category: z.string().default('General'),
  unit: z.string().default('unit'),
  stockQuantity: z.number().int().default(0),
  lowStockThreshold: z.number().int().default(5),
  trackInventory: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial();

// Project Schemas
export const createProjectSchema = z.object({
  name: z.string().min(2, 'Project name is required'),
  description: z.string().optional(),
  customerId: z.string().optional().nullable(),
  managerId: z.string().optional().nullable(),
  teamMemberIds: z.array(z.string()).optional(),
  status: z.enum(PROJECT_STATUSES).default('planning'),
  startDate: z.string().datetime().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  budgetMinor: z.number().min(0).default(0),
  currency: z.string().length(3).default('USD'),
  progress: z.number().min(0).max(100).default(0),
});

export const updateProjectSchema = createProjectSchema.partial();

// Task Schemas
export const createTaskSchema = z.object({
  title: z.string().min(2, 'Task title is required'),
  description: z.string().optional(),
  projectId: z.string().optional().nullable(),
  assignedTo: z.string().optional().nullable(),
  priority: z.enum(TASK_PRIORITIES).default('medium'),
  status: z.enum(TASK_STATUSES).default('todo'),
  dueDate: z.string().datetime().optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial();

// Transaction Schemas
export const createTransactionSchema = z.object({
  type: z.enum(TRANSACTION_TYPES),
  category: z.enum(TRANSACTION_CATEGORIES),
  amountMinor: z.number().int().min(1, 'Amount in minor units must be at least 1'),
  currency: z.string().length(3).default('USD'),
  transactionDate: z.string().datetime().optional(),
  paymentMethod: z.enum(['bank_transfer', 'credit_card', 'cash', 'upi', 'check', 'other']).default('bank_transfer'),
  customerId: z.string().optional().nullable(),
  invoiceId: z.string().optional().nullable(),
  description: z.string().min(2, 'Description is required'),
  reference: z.string().optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

// Invoice Schemas
const invoiceLineItemInputSchema = z.object({
  productId: z.string().optional().nullable(),
  description: z.string().min(1, 'Line item description required'),
  quantity: z.number().min(1).default(1),
  unitPriceMinor: z.number().min(0),
  discountMinor: z.number().min(0).default(0),
  taxRate: z.number().min(0).max(100).default(0),
});

export const createInvoiceSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  dueDate: z.string().datetime({ message: 'Due date must be a valid ISO date' }),
  issueDate: z.string().datetime().optional(),
  paymentTerms: z.string().default('Due on receipt'),
  notes: z.string().optional(),
  lineItems: z.array(invoiceLineItemInputSchema).min(1, 'At least one line item is required'),
});

export const updateInvoiceSchema = z.object({
  dueDate: z.string().datetime().optional(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
  lineItems: z.array(invoiceLineItemInputSchema).optional(),
});

export const recordPaymentSchema = z.object({
  amountMinor: z.number().int().min(1, 'Payment amount must be at least 1 minor unit'),
  paymentDate: z.string().datetime().optional(),
  method: z.enum(['bank_transfer', 'credit_card', 'cash', 'upi', 'check', 'other']).default('bank_transfer'),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

// Inventory Schemas
export const createMovementSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  type: z.enum(INVENTORY_MOVEMENT_TYPES),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  reason: z.string().optional(),
  reference: z.string().optional(),
});

export const createSupplierSchema = z.object({
  name: z.string().min(2, 'Supplier name required'),
  contactPerson: z.string().optional(),
  email: z.string().email().or(z.literal('')).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

// Marketing Schemas
export const createCampaignSchema = z.object({
  name: z.string().min(2, 'Campaign name required'),
  channel: z.enum(CAMPAIGN_CHANNELS),
  budgetMinor: z.number().min(0).default(0),
  spentMinor: z.number().min(0).default(0),
  currency: z.string().length(3).default('USD'),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  status: z.enum(CAMPAIGN_STATUSES).default('draft'),
  description: z.string().optional(),
});

export const updateCampaignSchema = createCampaignSchema.partial();
