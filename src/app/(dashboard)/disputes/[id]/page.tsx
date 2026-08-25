import { getDisputeById } from '@/db';
import { notFound, redirect } from 'next/navigation';
import DisputeDetailContent from './content';

export const dynamic = 'force-dynamic';

import { auth } from '@/auth';

export default async function DisputeDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  const orgId = (session.user as any).organizationId;
  const resolvedParams = await Promise.resolve(params);
  const dispute = await getDisputeById(resolvedParams.id, orgId);

  if (!dispute) {
    notFound();
  }

  return (
    <DisputeDetailContent
      dispute={dispute}
      order={dispute.order}
      evidenceList={dispute.evidenceList || []}
    />
  );
}
