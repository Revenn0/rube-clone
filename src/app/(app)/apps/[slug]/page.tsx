import AppDetailClient from './page-client';

export default async function AppDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <AppDetailClient slug={slug} />;
}
