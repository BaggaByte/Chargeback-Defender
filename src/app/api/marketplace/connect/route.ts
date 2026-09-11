import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  createConnectedAccount,
  listConnectedAccounts,
  getConnectedAccountByStripeId,
} from '@/db';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session.user as { organizationId?: string }).organizationId;
    if (!orgId) {
      return NextResponse.json(
        { success: false, error: 'User does not belong to an organization' },
        { status: 403 }
      );
    }

    const accounts = await listConnectedAccounts(orgId);
    return NextResponse.json({ success: true, data: accounts });
  } catch (error: any) {
    console.error('[API /marketplace/connect GET] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = (session.user as { organizationId?: string }).organizationId;
    if (!orgId) {
      return NextResponse.json(
        { success: false, error: 'User does not belong to an organization' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { email, accountType, country, defaultCurrency } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    // Generate Stripe Express Account ID simulation / call
    const simulatedStripeAccountId = `acct_express_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const account = await createConnectedAccount(
      {
        organizationId: orgId,
        stripeAccountId: simulatedStripeAccountId,
        email,
        accountType: accountType || 'express',
        country: country || 'US',
        defaultCurrency: defaultCurrency || 'USD',
        detailsSubmitted: true,
        chargesEnabled: true,
        payoutsEnabled: true,
        status: 'active',
      },
      {
        userId: session.user.id,
        actorName: session.user.name || 'System',
        actorRole: (session.user as { role?: string }).role || 'OPERATOR',
        organizationId: orgId,
      }
    );

    const onboardingUrl = `https://connect.stripe.com/express/onboarding/${simulatedStripeAccountId}`;

    return NextResponse.json({
      success: true,
      data: {
        account,
        onboardingUrl,
      },
    });
  } catch (error: any) {
    console.error('[API /marketplace/connect POST] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
