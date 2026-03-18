import { requireAuth } from '@/lib/auth';
import SchedulePageClient from './page-client';

export default async function SchedulePage() {
  await requireAuth();
  return <SchedulePageClient />;
}
