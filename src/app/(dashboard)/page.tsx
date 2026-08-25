import { getDisputes } from '@/db';
import DashboardClient from './dashboard-client';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const disputes = await getDisputes();

  return <DashboardClient disputes={disputes} />;
}
