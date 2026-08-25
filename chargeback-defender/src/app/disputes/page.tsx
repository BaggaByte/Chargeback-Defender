import { getDisputes } from '@/db';
import DisputesClient from './disputes-client';

export const dynamic = 'force-dynamic';

export default async function DisputesPage() {
  const allDisputes = await getDisputes();

  return <DisputesClient initialDisputes={allDisputes} />;
}
