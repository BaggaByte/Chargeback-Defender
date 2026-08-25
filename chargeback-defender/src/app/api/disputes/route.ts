import { NextRequest, NextResponse } from 'next/server';
import { getDisputes, createDispute } from '@/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const processor = searchParams.get('processor') || undefined;
    const search = searchParams.get('search') || undefined;
    const riskLevel = searchParams.get('riskLevel') || undefined;

    const list = await getDisputes({
      status,
      processor,
      search,
      riskLevel,
    });

    return NextResponse.json({ success: true, data: list });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerEmail, customerName, amount, reason, processor, cardBrand, cardLast4 } = body;

    if (!customerEmail || !amount || !reason) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields (customerEmail, amount, reason)' },
        { status: 400 }
      );
    }

    const created = await createDispute({
      organizationId: 'org-1',
      customerEmail,
      customerName: customerName || 'New Customer',
      amount: Number(amount),
      reason,
      processor: processor || 'stripe',
      cardBrand: cardBrand || 'visa',
      cardLast4: cardLast4 || '4242',
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
