import { AppSidebar } from '@/components/layout/sidebar';
import { ToastProvider } from '@/lib/toast';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden bg-white">
        <AppSidebar />
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden pt-12 lg:pt-0">{children}</main>
      </div>
    </ToastProvider>
  );
}
