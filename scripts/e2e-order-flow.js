#!/usr/bin/env node
/**
 * E2E: Register -> Login -> Create order -> (Payment/Order saga runs via events).
 * Requires gateway and all services running (e.g. docker compose up).
 * Usage: GATEWAY_URL=http://localhost:3000 node scripts/e2e-order-flow.js
 */
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3000';

async function run() {
  console.log('E2E: Order flow via', GATEWAY_URL);

  let token;
  const registerRes = await fetch(`${GATEWAY_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'e2e@example.com',
      password: 'password123',
      name: 'E2E User',
    }),
  });
  if (registerRes.ok) {
    const data = await registerRes.json();
    token = data.token;
    console.log('Registered e2e@example.com');
  } else {
    const loginRes = await fetch(`${GATEWAY_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'e2e@example.com', password: 'password123' }),
    });
    if (!loginRes.ok) throw new Error('Login failed');
    token = (await loginRes.json()).token;
    console.log('Logged in e2e@example.com');
  }

  const productRes = await fetch(`${GATEWAY_URL}/api/products`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!productRes.ok) throw new Error('List products failed');
  const { products } = await productRes.json();
  if (!products.length) throw new Error('No products. Run seed first: node scripts/seed.js');
  const productId = products[0]._id;
  const price = products[0].price;
  const qty = 2;
  const totalAmount = Number(price) * qty;

  const orderRes = await fetch(`${GATEWAY_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      items: [{ productId, quantity: qty, price: Number(price) }],
      totalAmount,
    }),
  });
  if (!orderRes.ok) throw new Error('Create order failed: ' + (await orderRes.text()));
  const order = await orderRes.json();
  console.log('Order created:', order.id, 'status:', order.status);

  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const getRes = await fetch(`${GATEWAY_URL}/api/orders/${order.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const o = await getRes.json();
    console.log('Order status:', o.status);
    if (o.status === 'confirmed') {
      console.log('E2E passed: order confirmed after payment completed.');
      return;
    }
    if (o.status === 'cancelled') throw new Error('Order was cancelled');
  }
  console.log('E2E: order still pending after 10s (payment/order saga may be slow or check logs).');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
