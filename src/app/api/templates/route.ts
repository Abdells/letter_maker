import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import LetterTemplate from '@/models/LetterTemplate';
export async function GET(request) {
try {
await connectDB();
const { searchParams } = new URL(request.url);
const category = searchParams.get('category');
const type = searchParams.get('type');
const query = {};
if (category) query.category = category;
if (type) query.type = type;
const templates = await LetterTemplate.find(query).lean();
return NextResponse.json(templates);
} catch (error) {
console.error('Templates API error:', error);
return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
}
}