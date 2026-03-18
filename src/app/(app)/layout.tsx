import { Sidebar } from '@/components/layout/sidebar';
import { ToastProvider } from '@/lib/toast';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden bg-white">
        <Sidebar />
        <main className="flex-1 overflow-hidden pt-14 lg:pt-0">{children}</main>
      </div>
    </ToastProvider>
  );
}
