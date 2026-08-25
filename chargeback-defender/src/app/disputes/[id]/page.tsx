import { getDisputeById } from '@/db';
import { notFound } from 'next/navigation';
import DisputeDetailContent from './content';

export const dynamic = 'force-dynamic';

export default async function DisputePage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = await Promise.resolve(params);
  const dispute = await getDisputeById(resolvedParams.id);

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
