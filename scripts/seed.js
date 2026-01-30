#!/usr/bin/env node
/**
 * Seed script: register a test user and create a sample product.
 * Requires gateway and all services running (e.g. docker compose up).
 * Usage: GATEWAY_URL=http://localhost:3000 node scripts/seed.js
 */
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3000';

async function seed() {
  console.log('Seeding via', GATEWAY_URL);

  const registerRes = await fetch(`${GATEWAY_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    }),
  });
  if (!registerRes.ok) {
    const text = await registerRes.text();
    if (registerRes.status === 400 && text.includes('already registered')) {
      console.log('User test@example.com already exists. Login to get token.');
      const loginRes = await fetch(`${GATEWAY_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      });
      if (!loginRes.ok) throw new Error('Login failed: ' + (await loginRes.text()));
      var { token } = await loginRes.json();
    } else throw new Error('Register failed: ' + text);
  } else {
    const data = await registerRes.json();
    const token = data.token;
    console.log('Registered test@example.com');
  }

  const productRes = await fetch(`${GATEWAY_URL}/api/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: 'Sample Product',
      description: 'A sample product for testing',
      price: 29.99,
      inventory: 100,
      category: 'electronics',
    }),
  });
  if (!productRes.ok) {
    if (productRes.status === 400 && (await productRes.text()).includes('already')) {
      console.log('Sample product may already exist.');
    } else throw new Error('Create product failed: ' + (await productRes.text()));
  } else {
    const product = await productRes.json();
    console.log('Created product:', product.name, '(id:', product._id + ')');
  }

  console.log('Seed done. Use email test@example.com / password123 to login.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
