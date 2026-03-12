import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Setting from '@/models/Setting';

// GET current payment status
export async function GET() {
  try {
    await connectDB();
    const setting = await Setting.findOne({ key: 'paymentRequired' });
    const enabled = setting ? setting.value : true; // default ON
    return NextResponse.json({ enabled });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ enabled: true }, { status: 500 });
  }
}

// PUT to toggle payment
export async function PUT(request) {
  try {
    await connectDB();
    const { enabled } = await request.json();

    await Setting.findOneAndUpdate(
      { key: 'paymentRequired' },
      { value: enabled, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}