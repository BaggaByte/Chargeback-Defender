import { db } from '@/db';
import { disputes, evidence, orders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import DisputeDetailContent from './content';

export default async function DisputeDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;

  const dispute = (await db.select().from(disputes).where(eq(disputes.id, id)))[0];
  if (!dispute) {
    notFound();
  }

  const order = (await db.select().from(orders).where(eq(orders.id, dispute.orderId)))[0];
  const evidenceList = await db.select().from(evidence).where(eq(evidence.disputeId, id));

  return (
    <DisputeDetailContent 
      dispute={dispute} 
      order={order} 
      evidenceList={evidenceList} 
    />
  );
}
