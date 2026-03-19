import { AppSidebar } from '@/components/layout/sidebar';
import { ToastProvider } from '@/lib/toast';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden bg-background relative selection:bg-brand selection:text-white">
        {/* Subtle radial glow background layer */}
        <div className="pointer-events-none fixed inset-0 z-0 flex justify-center">
          <div className="absolute top-[-10%] w-[100%] max-w-[1200px] h-[600px] rounded-full bg-brand/5 blur-[120px] dark:bg-brand/[0.03] dark:blur-[150px] mix-blend-screen" />
        </div>
        
        <div className="relative z-10 flex h-full w-full">
          <AppSidebar />
          <main className="flex-1 min-h-0 flex flex-col overflow-hidden pt-12 lg:pt-0 animate-slide-up relative bg-card/50 backdrop-blur-3xl border-l border-border/50 shadow-[-10px_0_30px_rgba(0,0,0,0.02)] dark:shadow-[-10px_0_30px_rgba(0,0,0,0.2)]">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
