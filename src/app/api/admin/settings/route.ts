import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Setting from '@/models/Setting';

export async function GET() {
  try {
    await connectDB();

    const setting = await Setting.findOne({ key: 'paymentRequired' } as any);

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

export async function PUT(request: Request) {
  try {
    await connectDB();
    const { enabled } = await request.json();

    await Setting.findOneAndUpdate(
      { key: 'paymentRequired' } as any,
      { value: enabled, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Settings PUT error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
