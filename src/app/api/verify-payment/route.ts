import { NextResponse } from 'next/server';

export async function POST(request) {
  const { reference } = await request.json();

  const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer sk_test_your_secret_key`,
    },
  });

  const data = await response.json();

  if (data.status && data.data.status === 'success') {
    // Payment verified - unlock for this user (e.g. set cookie or return token)
    return NextResponse.json({ verified: true });
  }

  return NextResponse.json({ verified: false }, { status: 400 });
}