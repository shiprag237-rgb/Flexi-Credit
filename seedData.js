import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import {
  User,
  Business,
  BusinessMembership,
  Subscription,
  Customer,
  Lead,
  LeadActivity,
  Product,
  Project,
  Task,
  Transaction,
  Invoice,
  Payment,
  InventoryMovement,
  MarketingCampaign,
  Notification,
} from '../models/index.js';
import { ROLES } from '../policies/roleDefinitions.js';
import { calculateInvoiceTotals, applyPaymentToInvoice } from '../services/invoiceService.js';
import { recordInventoryMovement } from '../services/inventoryService.js';

export const seedDatabase = async () => {
  console.log('[Seed] Starting database seed...');
  await connectDB();

  // Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    Business.deleteMany({}),
    BusinessMembership.deleteMany({}),
    Subscription.deleteMany({}),
    Customer.deleteMany({}),
    Lead.deleteMany({}),
    LeadActivity.deleteMany({}),
    Product.deleteMany({}),
    Project.deleteMany({}),
    Task.deleteMany({}),
    Transaction.deleteMany({}),
    Invoice.deleteMany({}),
    Payment.deleteMany({}),
    InventoryMovement.deleteMany({}),
    MarketingCampaign.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  console.log('[Seed] Cleared existing data.');

  // 1. Create Platform Admin
  const adminPasswordHash = await User.hashPassword('AdminPassword123!');
  const platformAdmin = await User.create({
    name: 'Platform SuperAdmin',
    email: 'admin@smartbiz.io',
    passwordHash: adminPasswordHash,
    isPlatformAdmin: true,
    emailVerifiedAt: new Date(),
  });

  // 2. Create Tenant 1: Acme Cloud Solutions
  const alicePasswordHash = await User.hashPassword('Password123!');
  const alice = await User.create({
    name: 'Alice Johnson',
    email: 'alice@acme.com',
    passwordHash: alicePasswordHash,
    emailVerifiedAt: new Date(),
  });

  const bob = await User.create({
    name: 'Bob Miller',
    email: 'bob@acme.com',
    passwordHash: alicePasswordHash,
    emailVerifiedAt: new Date(),
  });

  const charlie = await User.create({
    name: 'Charlie Smith',
    email: 'charlie@acme.com',
    passwordHash: alicePasswordHash,
    emailVerifiedAt: new Date(),
  });

  const diana = await User.create({
    name: 'Diana Accountant',
    email: 'diana@acme.com',
    passwordHash: alicePasswordHash,
    emailVerifiedAt: new Date(),
  });

  const acmeBusiness = await Business.create({
    name: 'Acme Cloud Solutions',
    slug: 'acme-cloud',
    industry: 'technology',
    businessSize: '11-50',
    ownerUserId: alice._id,
    currency: 'USD',
    timezone: 'America/New_York',
    settings: {
      invoicePrefix: 'ACM-',
      nextInvoiceNumber: 1004,
      taxRatePercentage: 8,
      inventoryEnabled: true,
      marketingEnabled: true,
    },
  });

  await BusinessMembership.create([
    { businessId: acmeBusiness._id, userId: alice._id, role: ROLES.OWNER },
    { businessId: acmeBusiness._id, userId: bob._id, role: ROLES.MANAGER },
    { businessId: acmeBusiness._id, userId: charlie._id, role: ROLES.EMPLOYEE },
    { businessId: acmeBusiness._id, userId: diana._id, role: ROLES.ACCOUNTANT },
  ]);

  await Subscription.create({
    businessId: acmeBusiness._id,
    planId: 'growth',
    status: 'active',
  });

  // 3. Create Tenant 2: Summit Retail & Goods (Isolated Second Tenant)
  const sam = await User.create({
    name: 'Sam Summit',
    email: 'sam@summit.com',
    passwordHash: alicePasswordHash,
    emailVerifiedAt: new Date(),
  });

  const summitBusiness = await Business.create({
    name: 'Summit Retail & Goods',
    slug: 'summit-retail',
    industry: 'retail',
    businessSize: '1-10',
    ownerUserId: sam._id,
    currency: 'USD',
    timezone: 'America/Chicago',
    settings: {
      invoicePrefix: 'SUM-',
      nextInvoiceNumber: 2001,
      taxRatePercentage: 5,
    },
  });

  await BusinessMembership.create({
    businessId: summitBusiness._id,
    userId: sam._id,
    role: ROLES.OWNER,
  });

  await Subscription.create({
    businessId: summitBusiness._id,
    planId: 'starter',
    status: 'active',
  });

  // Populate Acme Business Data
  console.log('[Seed] Populating Acme Business entities...');

  // Customers for Acme
  const nexusCust = await Customer.create({
    businessId: acmeBusiness._id,
    name: 'Marcus Vance',
    companyName: 'Nexus Global Tech',
    email: 'marcus@nexusglobal.com',
    phone: '+1 (555) 234-5678',
    customerType: 'business',
    status: 'active',
    billingAddress: { street: '100 Innovation Way', city: 'Boston', state: 'MA', postalCode: '02110', country: 'USA' },
    createdBy: alice._id,
  });

  const horizonCust = await Customer.create({
    businessId: acmeBusiness._id,
    name: 'Elena Rostova',
    companyName: 'Horizon Media Group',
    email: 'elena@horizonmedia.io',
    phone: '+1 (555) 876-5432',
    customerType: 'business',
    status: 'active',
    billingAddress: { street: '450 Sunset Blvd', city: 'Los Angeles', state: 'CA', postalCode: '90028', country: 'USA' },
    createdBy: alice._id,
  });

  const apexCust = await Customer.create({
    businessId: acmeBusiness._id,
    name: 'David Kim',
    companyName: 'Apex Health Systems',
    email: 'dkim@apexhealth.org',
    phone: '+1 (555) 345-6789',
    customerType: 'business',
    status: 'active',
    billingAddress: { street: '78 Medical Center Dr', city: 'Chicago', state: 'IL', postalCode: '60611', country: 'USA' },
    createdBy: alice._id,
  });

  // Customer for Summit (Tenant 2)
  await Customer.create({
    businessId: summitBusiness._id,
    name: 'Summit Private Client',
    companyName: 'Summit Local Store',
    email: 'client@summitstore.com',
    phone: '+1 (555) 999-0000',
    customerType: 'business',
    status: 'active',
    createdBy: sam._id,
  });

  // Products & Services for Acme
  const cloudAudit = await Product.create({
    businessId: acmeBusiness._id,
    name: 'Enterprise Cloud Architecture Audit',
    type: 'service',
    sku: 'SRV-AUDIT-01',
    description: 'Comprehensive AWS/Azure security and cost-optimization audit.',
    priceMinor: 450000, // $4,500.00
    costMinor: 100000,
    category: 'Consulting',
    unit: 'engagement',
    trackInventory: false,
    createdBy: alice._id,
  });

  const devRetainer = await Product.create({
    businessId: acmeBusiness._id,
    name: 'Dedicated DevOps Engineering (Monthly)',
    type: 'service',
    sku: 'SRV-DEVOPS-MO',
    description: '20 hours/month senior DevOps and Kubernetes infrastructure management.',
    priceMinor: 320000, // $3,200.00
    category: 'Engineering',
    unit: 'month',
    trackInventory: false,
    createdBy: alice._id,
  });

  const secureGateway = await Product.create({
    businessId: acmeBusiness._id,
    name: 'SmartBiz Secure Edge Hardware Gateway',
    type: 'product',
    sku: 'HW-SEC-GTW-01',
    description: 'Hardware appliance with onboard VPN encryption and DNS firewall.',
    priceMinor: 125000, // $1,250.00
    costMinor: 65000,
    category: 'Hardware',
    unit: 'unit',
    stockQuantity: 18,
    lowStockThreshold: 5,
    trackInventory: true,
    createdBy: alice._id,
  });

  const sensorNode = await Product.create({
    businessId: acmeBusiness._id,
    name: 'IoT Telemetry Probe Node',
    type: 'product',
    sku: 'HW-IOT-PROBE',
    description: 'Low-power telemetry sensor node with LoRaWAN telemetry.',
    priceMinor: 18500, // $185.00
    costMinor: 8500,
    category: 'Hardware',
    unit: 'piece',
    stockQuantity: 3, // LOW STOCK TRIGGER
    lowStockThreshold: 10,
    trackInventory: true,
    createdBy: alice._id,
  });

  // Marketing Campaign
  const springCampaign = await MarketingCampaign.create({
    businessId: acmeBusiness._id,
    name: 'Q2 Cloud Infrastructure Modernization',
    channel: 'search',
    budgetMinor: 500000, // $5,000.00
    spentMinor: 280000, // $2,800.00
    status: 'active',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    createdBy: alice._id,
  });

  // Leads for Acme
  await Lead.create([
    {
      businessId: acmeBusiness._id,
      name: 'Sarah Connor',
      companyName: 'Cyberdyne Data Corp',
      email: 'sconnor@cyberdyne.io',
      phone: '+1 (555) 111-2233',
      source: 'campaign',
      stage: 'proposal',
      estimatedValueMinor: 1500000, // $15,000.00
      assignedTo: bob._id,
      campaignId: springCampaign._id,
      createdBy: alice._id,
    },
    {
      businessId: acmeBusiness._id,
      name: 'Michael Scott',
      companyName: 'Dunder Paperworks',
      email: 'mscott@dunderpaper.com',
      source: 'website',
      stage: 'qualified',
      estimatedValueMinor: 480000, // $4,800.00
      assignedTo: bob._id,
      createdBy: alice._id,
    },
    {
      businessId: acmeBusiness._id,
      name: 'Jennifer Aniston',
      companyName: 'Central Perk Digital',
      email: 'jen@centralperk.com',
      source: 'referral',
      stage: 'new',
      estimatedValueMinor: 250000,
      assignedTo: charlie._id,
      createdBy: alice._id,
    },
  ]);

  // Projects for Acme
  const nexusProject = await Project.create({
    businessId: acmeBusiness._id,
    name: 'Nexus Cloud Infrastructure Migration',
    description: 'Transition on-premise Kubernetes clusters to multi-region AWS EKS with Terraform.',
    customerId: nexusCust._id,
    managerId: bob._id,
    teamMemberIds: [bob._id, charlie._id],
    status: 'in_progress',
    startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
    budgetMinor: 2400000, // $24,000.00
    progress: 45,
    milestones: [
      { title: 'Architecture Review & IAM Design', completed: true, completedAt: new Date() },
      { title: 'Terraform IaC Staging Cluster', completed: true, completedAt: new Date() },
      { title: 'Database Live Replication', completed: false, dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
      { title: 'Production Cutover & Sign-off', completed: false, dueDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000) },
    ],
    createdBy: alice._id,
  });

  // Tasks for Acme
  await Task.create([
    {
      businessId: acmeBusiness._id,
      projectId: nexusProject._id,
      title: 'Configure AWS Transit Gateway peering',
      description: 'Set up cross-VPC routing and security group ingress rules.',
      assignedTo: charlie._id,
      priority: 'high',
      status: 'in_progress',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      createdBy: bob._id,
    },
    {
      businessId: acmeBusiness._id,
      projectId: nexusProject._id,
      title: 'Run automated SonarQube & vulnerability scans',
      description: 'Perform static container image scanning before production registry push.',
      assignedTo: charlie._id,
      priority: 'urgent',
      status: 'todo',
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      createdBy: bob._id,
    },
    {
      businessId: acmeBusiness._id,
      projectId: nexusProject._id,
      title: 'Setup Prometheus & Grafana alerting dashboards',
      assignedTo: bob._id,
      priority: 'medium',
      status: 'completed',
      completedAt: new Date(),
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      createdBy: bob._id,
    },
  ]);

  // Invoices & Payments for Acme
  const inv1Calculations = calculateInvoiceTotals(
    [
      {
        productId: cloudAudit._id,
        description: 'Enterprise Cloud Architecture Audit - Milestone 1',
        quantity: 1,
        unitPriceMinor: cloudAudit.priceMinor,
        discountMinor: 0,
        taxRate: 8,
      },
    ],
    'USD'
  );

  const inv1 = await Invoice.create({
    businessId: acmeBusiness._id,
    invoiceNumber: 'ACM-1001',
    customerId: nexusCust._id,
    status: 'paid',
    issueDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    currency: 'USD',
    lineItems: inv1Calculations.lineItems,
    subtotalMinor: inv1Calculations.subtotalMinor,
    discountMinor: inv1Calculations.discountMinor,
    taxMinor: inv1Calculations.taxMinor,
    totalMinor: inv1Calculations.totalMinor,
    paidMinor: 0,
    balanceMinor: inv1Calculations.totalMinor,
    createdBy: alice._id,
  });

  // Apply payment to inv1
  await applyPaymentToInvoice({
    businessId: acmeBusiness._id,
    invoiceId: inv1._id,
    amountMinor: inv1.totalMinor,
    method: 'bank_transfer',
    reference: 'WIRE-891238',
    notes: 'Full payment received via Chase Wire',
    userId: diana._id,
    paymentDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  });

  const inv2Calculations = calculateInvoiceTotals(
    [
      {
        productId: devRetainer._id,
        description: 'Dedicated DevOps Engineering - Month 1',
        quantity: 1,
        unitPriceMinor: devRetainer.priceMinor,
        discountMinor: 20000, // $200 discount
        taxRate: 8,
      },
      {
        productId: secureGateway._id,
        description: 'Hardware Gateway Appliance',
        quantity: 2,
        unitPriceMinor: secureGateway.priceMinor,
        discountMinor: 0,
        taxRate: 8,
      },
    ],
    'USD'
  );

  const inv2 = await Invoice.create({
    businessId: acmeBusiness._id,
    invoiceNumber: 'ACM-1002',
    customerId: horizonCust._id,
    status: 'sent',
    issueDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
    currency: 'USD',
    lineItems: inv2Calculations.lineItems,
    subtotalMinor: inv2Calculations.subtotalMinor,
    discountMinor: inv2Calculations.discountMinor,
    taxMinor: inv2Calculations.taxMinor,
    totalMinor: inv2Calculations.totalMinor,
    paidMinor: 0,
    balanceMinor: inv2Calculations.totalMinor,
    createdBy: alice._id,
  });

  // Partial payment on inv2
  await applyPaymentToInvoice({
    businessId: acmeBusiness._id,
    invoiceId: inv2._id,
    amountMinor: 200000, // $2,000 partial payment
    method: 'credit_card',
    reference: 'CC-90123',
    notes: 'Initial deposit paid by card',
    userId: diana._id,
    paymentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  });

  // Overdue Invoice for Apex
  const inv3Calculations = calculateInvoiceTotals(
    [
      {
        productId: cloudAudit._id,
        description: 'Cloud Architecture Pre-Assessment',
        quantity: 1,
        unitPriceMinor: 200000,
        discountMinor: 0,
        taxRate: 8,
      },
    ],
    'USD'
  );

  await Invoice.create({
    businessId: acmeBusiness._id,
    invoiceNumber: 'ACM-1003',
    customerId: apexCust._id,
    status: 'sent',
    issueDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // OVERDUE
    currency: 'USD',
    lineItems: inv3Calculations.lineItems,
    subtotalMinor: inv3Calculations.subtotalMinor,
    discountMinor: inv3Calculations.discountMinor,
    taxMinor: inv3Calculations.taxMinor,
    totalMinor: inv3Calculations.totalMinor,
    paidMinor: 0,
    balanceMinor: inv3Calculations.totalMinor,
    createdBy: alice._id,
  });

  // Additional Operational Expenses for Acme
  await Transaction.create([
    {
      businessId: acmeBusiness._id,
      type: 'expense',
      category: 'software',
      amountMinor: 48000, // $480.00
      currency: 'USD',
      description: 'AWS Cloud Hosting & S3 Storage',
      paymentMethod: 'credit_card',
      reference: 'AWS-INV-2026-04',
      transactionDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      createdBy: diana._id,
    },
    {
      businessId: acmeBusiness._id,
      type: 'expense',
      category: 'salaries',
      amountMinor: 850000, // $8,500.00
      currency: 'USD',
      description: 'Bi-weekly Engineering Payroll',
      paymentMethod: 'bank_transfer',
      reference: 'PAYROLL-04-15',
      transactionDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      createdBy: diana._id,
    },
    {
      businessId: acmeBusiness._id,
      type: 'expense',
      category: 'rent',
      amountMinor: 220000, // $2,200.00
      currency: 'USD',
      description: 'Boston Office Space Lease',
      paymentMethod: 'bank_transfer',
      reference: 'RENT-APR',
      transactionDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      createdBy: diana._id,
    },
  ]);

  // Inventory movement audit
  await recordInventoryMovement({
    businessId: acmeBusiness._id,
    productId: secureGateway._id,
    type: 'stock_in',
    quantity: 20,
    reason: 'Initial hardware shipment received from factory',
    reference: 'PO-2026-01',
    userId: alice._id,
  });

  // Low stock notification
  await Notification.create({
    businessId: acmeBusiness._id,
    recipientUserId: alice._id,
    type: 'low_stock',
    title: 'Low Stock Alert',
    message: `Product "${sensorNode.name}" has reached low stock threshold (3 remaining, threshold 10).`,
    resourceType: 'product',
    resourceId: sensorNode._id,
  });

  console.log('[Seed] Database successfully seeded with 2 distinct tenants and full real data.');
  console.log('================================================================');
  console.log('Demo Credentials:');
  console.log('  Platform Admin: admin@smartbiz.io / AdminPassword123!');
  console.log('  Acme Owner:     alice@acme.com / Password123!');
  console.log('  Acme Manager:   bob@acme.com / Password123!');
  console.log('  Acme Employee:  charlie@acme.com / Password123!');
  console.log('  Acme Accountant:diana@acme.com / Password123!');
  console.log('  Summit Owner:   sam@summit.com / Password123!');
  console.log('================================================================');
};

// Execute if run directly via node
if (process.argv[1]?.endsWith('seedData.js')) {
  seedDatabase()
    .then(() => disconnectDB())
    .catch((err) => {
      console.error('[Seed] Error:', err);
      process.exit(1);
    });
}
