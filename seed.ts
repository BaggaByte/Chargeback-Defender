import { db } from './src/db';
import { organizations, users, customers, orders, disputes, evidence, integrations } from './src/db/schema';

async function seed() {
  console.log('Seeding database...');

  // Clear existing data to avoid duplicates during repeated seeds
  await db.delete(evidence);
  await db.delete(disputes);
  await db.delete(orders);
  await db.delete(customers);
  await db.delete(users);
  await db.delete(integrations);
  await db.delete(organizations);

  const [org] = await db.insert(organizations).values({
    name: 'Acme SaaS Corp',
    slug: 'acme-saas',
  }).returning();

  const [admin] = await db.insert(users).values({
    organizationId: org.id,
    email: 'admin@example.com',
    fullName: 'Admin User',
    role: 'ADMIN',
  }).returning();

  const [operator] = await db.insert(users).values({
    organizationId: org.id,
    email: 'operator@acme.com',
    fullName: 'Operator User',
    role: 'OPERATOR',
  }).returning();

  const [customer1] = await db.insert(customers).values({
    organizationId: org.id,
    email: 'customer1@example.com',
    phoneNumber: '+1234567890',
    address: '123 Main St, New York, NY',
  }).returning();

  const [customer2] = await db.insert(customers).values({
    organizationId: org.id,
    email: 'customer2@example.com',
    phoneNumber: '+1987654321',
    address: '456 Oak Ave, Los Angeles, CA',
  }).returning();

  const [order1] = await db.insert(orders).values({
    organizationId: org.id,
    customerId: customer1.id,
    externalOrderId: 'ORD-1001',
    amount: '199.99',
    status: 'completed',
    shippedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    deliveredAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
  }).returning();

  const [order2] = await db.insert(orders).values({
    organizationId: org.id,
    customerId: customer2.id,
    externalOrderId: 'ORD-1002',
    amount: '49.99',
    status: 'completed',
    shippedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    deliveredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  }).returning();

  const [dispute1] = await db.insert(disputes).values({
    organizationId: org.id,
    orderId: order1.id,
    externalDisputeId: 'DSP-2001',
    processor: 'stripe',
    reason: 'Product not received',
    amount: '199.99',
    status: 'PENDING_APPROVAL',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  }).returning();

  const [dispute2] = await db.insert(disputes).values({
    organizationId: org.id,
    orderId: order2.id,
    externalDisputeId: 'DSP-2002',
    processor: 'stripe',
    reason: 'Fraudulent transaction',
    amount: '49.99',
    status: 'OPEN',
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  }).returning();

  const [dispute3] = await db.insert(disputes).values({
    organizationId: org.id,
    orderId: order1.id,
    externalDisputeId: 'DSP-2003',
    processor: 'paypal',
    reason: 'Not as described',
    amount: '199.99',
    status: 'WON',
    deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  }).returning();

  await db.insert(evidence).values([
    {
      disputeId: dispute1.id,
      type: 'SHIPPING_PROOF',
      title: 'FedEx Delivery Confirmation',
      content: 'Package delivered to 123 Main St on 2023-10-01',
      isAutoCollected: true,
    },
    {
      disputeId: dispute1.id,
      type: 'ORDER_DETAILS',
      title: 'Order Summary',
      content: 'Item: Enterprise Subscription - $199.99',
      isAutoCollected: true,
    },
    {
      disputeId: dispute2.id,
      type: 'CUSTOMER_COMMUNICATION',
      title: 'Chat Log',
      content: 'Customer admitted to making the purchase in chat on Oct 2nd',
      isAutoCollected: false,
    },
  ]);

  await db.insert(integrations).values({
    organizationId: org.id,
    processor: 'stripe',
    status: 'active',
  });

  console.log('Seeding complete!');
}

seed().catch(console.error);
