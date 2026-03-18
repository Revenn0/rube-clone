import { requireAuth } from '@/lib/auth';
import SettingsPageClient from './page-client';

export default async function SettingsPage() {
  await requireAuth();
  return <SettingsPageClient />;
}
