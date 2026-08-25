import { NextRequest, NextResponse } from 'next/server';
import { getDisputes, createDispute } from '@/db';
import { auth } from '@/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session.user as any).organizationId;
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'User does not belong to an organization' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const processor = searchParams.get('processor') || undefined;
    const search = searchParams.get('search') || undefined;
    const riskLevel = searchParams.get('riskLevel') || undefined;

    const list = await getDisputes({
      organizationId: orgId, // ENFORCING TENANT ISOLATION
      status,
      processor,
      search,
      riskLevel,
    });

    return NextResponse.json({ success: true, data: list });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 }); // NO RAW ERROR EXPOSURE
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session.user as any).organizationId;
    const userId = session.user.id;
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'User does not belong to an organization' }, { status: 403 });
    }

    const body = await req.json();
    const { customerEmail, customerName, amount, reason, processor, cardBrand, cardLast4 } = body;

    if (!customerEmail || !amount || !reason) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields (customerEmail, amount, reason)' },
        { status: 400 }
      );
    }

    const created = await createDispute({
      organizationId: orgId, // Derive org from session
      userId: userId, // Derive identity for audit
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
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
