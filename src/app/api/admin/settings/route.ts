import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Setting from '@/models/Setting';

export async function GET() {
  try {
    await connectDB();

    const setting = await Setting.findOne({
      key: 'paymentRequired'
    } as { key: string });

    const enabled = setting ? setting.value : true;

    return NextResponse.json({ enabled });
  } catch (error: unknown) {
    console.error('Settings fetch error:', error);

    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}