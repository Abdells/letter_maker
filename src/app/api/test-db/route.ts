import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({ status: 'MongoDB connected successfully!' });
  } catch (error) {
    console.error('DB connection error:', error);
    return NextResponse.json({ error: 'Connection failed' }, { status: 500 });
  }
}