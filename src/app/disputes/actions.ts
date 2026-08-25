'use server';

import { db } from '@/db';
import { disputes, evidence, auditLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function addEvidence(disputeId: string, data: { title: string; content: string; type: string }) {
  await db.insert(evidence).values({
    disputeId,
    title: data.title,
    content: data.content,
    type: data.type as any,
    isAutoCollected: false,
  });
  
  await db.insert(auditLogs).values({
    organizationId: (await db.select().from(disputes).where(eq(disputes.id, disputeId)))[0].organizationId,
    action: 'ADD_EVIDENCE',
    entityType: 'DISPUTE',
    entityId: disputeId,
    details: `Added evidence: ${data.title}`,
  });

  revalidatePath(`/disputes/${disputeId}`);
}

export async function updateDisputeStatus(disputeId: string, status: string) {
  const dispute = (await db.select().from(disputes).where(eq(disputes.id, disputeId)))[0];
  
  await db.update(disputes)
    .set({ status: status as any, updatedAt: new Date() })
    .where(eq(disputes.id, disputeId));

  await db.insert(auditLogs).values({
    organizationId: dispute.organizationId,
    action: 'UPDATE_STATUS',
    entityType: 'DISPUTE',
    entityId: disputeId,
    details: `Status changed to ${status}`,
  });

  revalidatePath(`/disputes/${disputeId}`);
}

export async function submitDispute(disputeId: string) {
  // Simulate submission to processor
  await updateDisputeStatus(disputeId, 'SUBMITTED');
}
