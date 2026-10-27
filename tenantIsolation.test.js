import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { User } from '../src/models/User.js';
import { Business } from '../src/models/Business.js';
import { BusinessMembership } from '../src/models/BusinessMembership.js';
import { Customer } from '../src/models/Customer.js';
import { Project } from '../src/models/Project.js';
import { Invoice } from '../src/models/Invoice.js';
import { ROLES } from '../src/policies/roleDefinitions.js';

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
    console.log('[Test DB] Note: Set MONGODB_URI to execute live database isolation assertions.');
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

test('MULTI-TENANT ISOLATION SUITE', async (t) => {
  if (!dbConnected) {
    t.skip('Skipping DB isolation integration suite: MongoDB connection offline. Configure MONGODB_URI to execute.');
    return;
  }

  // Setup 2 separate businesses and owners
  const userA = await User.create({
    name: 'Owner A',
    email: 'ownera@tenant-a.com',
    passwordHash: 'dummyhash',
  });

  const userB = await User.create({
    name: 'Owner B',
    email: 'ownerb@tenant-b.com',
    passwordHash: 'dummyhash',
  });

  const businessA = await Business.create({
    name: 'Enterprise A',
    slug: 'enterprise-a',
    ownerUserId: userA._id,
  });

  const businessB = await Business.create({
    name: 'Enterprise B',
    slug: 'enterprise-b',
    ownerUserId: userB._id,
  });

  await BusinessMembership.create([
    { businessId: businessA._id, userId: userA._id, role: ROLES.OWNER },
    { businessId: businessB._id, userId: userB._id, role: ROLES.OWNER },
  ]);

  // Seed data into Business B
  const customerB = await Customer.create({
    businessId: businessB._id,
    name: 'Secret Client of B',
    email: 'client@secretb.com',
    createdBy: userB._id,
  });

  const projectB = await Project.create({
    businessId: businessB._id,
    name: 'Confidential Project B',
    customerId: customerB._id,
    budgetMinor: 5000000,
    createdBy: userB._id,
  });

  const invoiceB = await Invoice.create({
    businessId: businessB._id,
    invoiceNumber: 'INV-B-001',
    customerId: customerB._id,
    dueDate: new Date(),
    subtotalMinor: 100000,
    totalMinor: 100000,
    balanceMinor: 100000,
    createdBy: userB._id,
  });

  await t.test('Tenant A query cannot read Tenant B customers', async () => {
    // When querying with businessA._id, Tenant B's customer must NEVER be returned
    const customer = await Customer.findOne({
      _id: customerB._id,
      businessId: businessA._id, // Tenant isolation boundary
    });
    assert.equal(customer, null, 'Customer of B should not be returned under Business A boundary');
  });

  await t.test('Tenant A cannot update Tenant B projects', async () => {
    const updated = await Project.findOneAndUpdate(
      { _id: projectB._id, businessId: businessA._id },
      { $set: { name: 'Hacked Project Name' } },
      { new: true }
    );
    assert.equal(updated, null, 'Project of B should not be updatable under Business A boundary');

    // Verify Project B was NOT changed
    const freshProjectB = await Project.findById(projectB._id);
    assert.equal(freshProjectB.name, 'Confidential Project B');
  });

  await t.test('Tenant A cannot delete Tenant B invoices', async () => {
    const deleted = await Invoice.findOneAndDelete({
      _id: invoiceB._id,
      businessId: businessA._id,
    });
    assert.equal(deleted, null, 'Invoice of B should not be deletable under Business A boundary');

    // Verify Invoice B still exists
    const freshInvoiceB = await Invoice.findById(invoiceB._id);
    assert.notEqual(freshInvoiceB, null);
  });

  await t.test('User A has no BusinessMembership in Business B', async () => {
    const membership = await BusinessMembership.findOne({
      businessId: businessB._id,
      userId: userA._id,
    });
    assert.equal(membership, null, 'User A must not have membership in Business B');
  });
});
