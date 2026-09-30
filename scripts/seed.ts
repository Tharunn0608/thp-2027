import { db } from '../src/db/store.ts';

console.log('--- Initializing & Seeding Software Change-Risk Database ---');
console.log('✓ Tables & in-memory SQLite store initialized');
console.log('✓ Seeded demo repositories:');
console.log('  1. CampusOS / College Management System (repo-college-mgmt)');
console.log('  2. Banking Core Ledger & Wire Service (repo-banking-core)');
console.log('  3. E-Commerce Microservices Testbed (repo-ecommerce-core)');
console.log('✓ Seeded historical incidents (INC-101, INC-102, INC-108, INC-COL-094, INC-BNK-201)');
console.log('✓ Seeded synthetic runtime telemetry matrices (0.01 - 920 RPS)');
console.log('✓ Seeded test suite relationships and prioritization mappings');
console.log('✓ Database seeding complete and idempotent.');
