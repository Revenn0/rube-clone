import { requireAuth } from '@/lib/auth';
import { RecipesPageClient } from './page-client';

export default async function RecipesPage() {
  await requireAuth();
  return <RecipesPageClient />;
}
