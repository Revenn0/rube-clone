'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

export function ChatBubble() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const goToNewChat = () => {
    setOpen(false);
    router.push('/chat');
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#f26522] text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#f26522]/50"
        aria-label="Open chat"
      >
        <MessageSquare className="h-6 w-6" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-[40vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="text-lg font-semibold">Quick Chat</SheetTitle>
          </SheetHeader>
          <div className="mt-6 flex flex-col gap-4">
            <p className="text-sm text-[#6b7280]">
              Start a conversation with Jungor or continue an existing chat.
            </p>
            <div className="flex flex-col gap-2">
              <Button
                onClick={goToNewChat}
                className="w-full justify-center bg-[#f26522] hover:bg-[#e55a1a]"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                New Chat
              </Button>
              <Link href="/chat" onClick={() => setOpen(false)}>
                <Button variant="outline" className="w-full justify-center">
                  Open Chat
                </Button>
              </Link>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
