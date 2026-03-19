import { requireAuth } from '@/lib/auth';
import ProjectsPageClient from './page-client';

export default async function ProjectsPage() {
  await requireAuth();
  return <ProjectsPageClient />;
}
