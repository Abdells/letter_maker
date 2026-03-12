import * as dotenv from 'dotenv';
import * as path from 'path';

console.log('Current working directory (process.cwd()):', process.cwd());

const envPath = path.resolve(process.cwd(), '.env.local');
console.log('Trying to load .env.local from:', envPath);

const result = dotenv.config({ path: envPath });

console.log('dotenv.config() result:');
console.log('  - parsed keys:', result.parsed ? Object.keys(result.parsed) : 'NO');
console.log('  - error:', result.error ? result.error.message : 'NO ERROR');

console.log('\nAfter dotenv:');
console.log('MONGODB_URI exists?', !!process.env.MONGODB_URI);
console.log('MONGODB_URI value (first 30 chars):', process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 30) + '...' : 'MISSING');
console.log('DATABASE_NAME:', process.env.DATABASE_NAME || 'MISSING');