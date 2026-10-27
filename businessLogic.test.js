import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { calculateInvoiceTotals, applyPaymentToInvoice } from '../src/services/invoiceService.js';
import { recordInventoryMovement } from '../src/services/inventoryService.js';
import { toMinorUnits, toMajorUnits, formatCurrency } from '../src/utils/currency.js';
import { ROLES, hasPermission } from '../src/policies/roleDefinitions.js';
import { createCustomerSchema, createInvoiceSchema, createLeadSchema } from '../src/validators/schemas.js';

import { Business } from '../src/models/Business.js';
import { Customer } from '../src/models/Customer.js';
import { Product } from '../src/models/Product.js';
import { Invoice } from '../src/models/Invoice.js';

let mongod;
let dbConnected = false;

test.before(async () => {
  const uri = process.env.MONGODB_URI;
  if (uri) {
    try {
      await mongoose.connect(uri);
      dbConnected = true;
    } catch (err) {
      console.warn('[Test DB] Could not connect to process.env.MONGODB_URI:', err.message);
    }
  } else if (process.env.TEST_WITH_MMS === 'true') {
    try {
      mongod = await MongoMemoryServer.create();
      await mongoose.connect(mongod.getUri());
      dbConnected = true;
    } catch (err) {
      console.warn('[Test DB] MongoMemoryServer unavailable in local test environment:', err.message);
    }
  } else {
    console.log('[Test DB] Note: Set MONGODB_URI to execute live database integration assertions.');
  }
});

test.after(async () => {
  if (dbConnected) {
    await mongoose.disconnect();
  }
  if (mongod) {
    await mongod.stop();
  }
});

test('BUSINESS LOGIC & DOMAIN CALCULATIONS', async (t) => {
  // 1. Currency Unit Calculations
  await t.test('Currency calculations convert accurately between minor and major units', () => {
    assert.equal(toMinorUnits(19.99), 1999);
    assert.equal(toMinorUnits(0.05), 5);
    assert.equal(toMinorUnits(100), 10000);
    assert.equal(toMinorUnits(null), 0);

    assert.equal(toMajorUnits(1999), 19.99);
    assert.equal(toMajorUnits(500), 5.0);
    assert.equal(toMajorUnits(0), 0);

    const formatted = formatCurrency(25000, 'USD', 'en-US');
    assert.match(formatted, /\$250/);
  });

  // 2. Invoice Totals Calculation
  await t.test('calculateInvoiceTotals calculates line item taxes, discounts, and minor totals accurately', () => {
    const lineItems = [
      {
        description: 'Web development retainer',
        quantity: 2,
        unitPriceMinor: 10000, // $100.00 each -> $200.00
        discountMinor: 2000, // $20.00 discount -> $180.00 taxable
        taxRate: 10, // 10% tax on $180 = $18.00 (1800 minor)
      },
      {
        description: 'Server license',
        quantity: 1,
        unitPriceMinor: 5000, // $50.00
        discountMinor: 0,
        taxRate: 0,
      },
    ];

    const result = calculateInvoiceTotals(lineItems, 'USD');

    // Subtotal: 2*10000 + 1*5000 = 25000 minor ($250.00)
    assert.equal(result.subtotalMinor, 25000);
    // Discount: 2000 minor ($20.00)
    assert.equal(result.discountMinor, 2000);
    // Tax: 1800 minor ($18.00)
    assert.equal(result.taxMinor, 1800);
    // Net total: 25000 - 2000 + 1800 = 24800 minor ($248.00)
    assert.equal(result.totalMinor, 24800);
    assert.equal(result.lineItems[0].totalMinor, 19800);
    assert.equal(result.lineItems[1].totalMinor, 5000);
  });

  // 3. RBAC & Granular Permission Checks
  await t.test('Role permission matrix enforces role boundaries accurately', () => {
    // Owner has unrestricted access
    assert.equal(hasPermission(ROLES.OWNER, 'finance:read'), true);
    assert.equal(hasPermission(ROLES.OWNER, 'finance:create'), true);
    assert.equal(hasPermission(ROLES.OWNER, 'billing:update'), true);

    // Admin has operational management but NOT billing update
    assert.equal(hasPermission(ROLES.ADMIN, 'customers:create'), true);
    assert.equal(hasPermission(ROLES.ADMIN, 'billing:update'), false);

    // Manager can manage projects/tasks, but not finance create
    assert.equal(hasPermission(ROLES.MANAGER, 'projects:create'), true);
    assert.equal(hasPermission(ROLES.MANAGER, 'tasks:create'), true);
    assert.equal(hasPermission(ROLES.MANAGER, 'finance:create'), false);

    // Accountant can manage finance/invoices, but not team memberships
    assert.equal(hasPermission(ROLES.ACCOUNTANT, 'invoices:create'), true);
    assert.equal(hasPermission(ROLES.ACCOUNTANT, 'invoices:pay'), true);
    assert.equal(hasPermission(ROLES.ACCOUNTANT, 'team:invite'), false);

    // Employee cannot access finance or invite team members
    assert.equal(hasPermission(ROLES.EMPLOYEE, 'tasks:update'), true);
    assert.equal(hasPermission(ROLES.EMPLOYEE, 'finance:read'), false);
    assert.equal(hasPermission(ROLES.EMPLOYEE, 'invoices:create'), false);
    assert.equal(hasPermission(ROLES.EMPLOYEE, 'team:invite'), false);
  });

  // 4. Zod Input Validation
  await t.test('Zod schemas validate incoming client payload structures', () => {
    // Customer validation
    const validCust = createCustomerSchema.safeParse({
      name: 'Valid Customer Inc',
      email: 'contact@valid.com',
      phone: '+1 555-0100',
    });
    assert.equal(validCust.success, true);

    const invalidCust = createCustomerSchema.safeParse({
      name: '', // Empty name should fail
    });
    assert.equal(invalidCust.success, false);

    // Lead validation
    const validLead = createLeadSchema.safeParse({
      name: 'Tech Lead Alpha',
      companyName: 'Alpha Corp',
      stage: 'qualified',
      estimatedValueMinor: 500000,
    });
    assert.equal(validLead.success, true);
  });

  // 5. Database Payment & Inventory Integration Tests (Active when DB connected)
  await t.test('applyPaymentToInvoice prevents overpayment exceeding balance', async (st) => {
    if (!dbConnected) {
      st.skip('Skipping DB integration test: MongoDB connection offline in test environment.');
      return;
    }

    const business = await Business.create({
      name: 'Invoice Test Biz',
      slug: 'inv-test-biz',
      ownerUserId: new mongoose.Types.ObjectId(),
    });

    const customer = await Customer.create({
      businessId: business._id,
      name: 'Test Customer',
    });

    const invoice = await Invoice.create({
      businessId: business._id,
      invoiceNumber: 'INV-TEST-01',
      customerId: customer._id,
      dueDate: new Date(),
      subtotalMinor: 10000,
      totalMinor: 10000, // $100.00
      paidMinor: 0,
      balanceMinor: 10000,
    });

    // Attempting to pay 15000 on a 10000 balance must reject
    await assert.rejects(
      async () => {
        await applyPaymentToInvoice({
          businessId: business._id,
          invoiceId: invoice._id,
          amountMinor: 15000,
          userId: new mongoose.Types.ObjectId(),
        });
      },
      {
        message: /exceeds remaining balance/,
      }
    );

    // Paying valid partial amount of 4000
    const partialResult = await applyPaymentToInvoice({
      businessId: business._id,
      invoiceId: invoice._id,
      amountMinor: 4000,
      userId: new mongoose.Types.ObjectId(),
    });

    assert.equal(partialResult.invoice.paidMinor, 4000);
    assert.equal(partialResult.invoice.balanceMinor, 6000);
    assert.equal(partialResult.invoice.status, 'partially_paid');
  });

  await t.test('recordInventoryMovement maintains strict stock consistency', async (st) => {
    if (!dbConnected) {
      st.skip('Skipping DB integration test: MongoDB connection offline in test environment.');
      return;
    }

    const business = await Business.create({
      name: 'Inventory Test Biz',
      slug: 'inv-stock-biz',
      ownerUserId: new mongoose.Types.ObjectId(),
    });

    const product = await Product.create({
      businessId: business._id,
      name: 'Widget X',
      priceMinor: 2500,
      stockQuantity: 10,
      trackInventory: true,
    });

    // Stock in 5
    const stockIn = await recordInventoryMovement({
      businessId: business._id,
      productId: product._id,
      type: 'stock_in',
      quantity: 5,
      userId: new mongoose.Types.ObjectId(),
    });
    assert.equal(stockIn.product.stockQuantity, 15);
    assert.equal(stockIn.movement.previousStock, 10);
    assert.equal(stockIn.movement.newStock, 15);

    // Stock out 20 when stock is 15 must fail
    await assert.rejects(
      async () => {
        await recordInventoryMovement({
          businessId: business._id,
          productId: product._id,
          type: 'stock_out',
          quantity: 20,
          userId: new mongoose.Types.ObjectId(),
        });
      },
      {
        message: /Insufficient stock/,
      }
    );
  });
});
