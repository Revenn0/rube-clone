import { requireAuth } from '@/lib/auth';
import WorkflowsPageClient from './page-client';

export default async function WorkflowsPage() {
  await requireAuth();
  return <WorkflowsPageClient />;
}
