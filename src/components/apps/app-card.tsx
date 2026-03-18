'use client';

import { App } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { Check, Plus } from 'lucide-react';

interface AppCardProps {
  app: App;
}

export function AppCard({ app }: AppCardProps) {
  const { connectedApps, connectApp, disconnectApp } = useAppStore();
  const isConnected = connectedApps.includes(app.id);

  return (
    <Card className="app-card group cursor-pointer hover:border-[#333]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1a1a1a] text-2xl">
              {app.icon}
            </div>
            <div>
              <h3 className="font-semibold text-white">{app.name}</h3>
              <p className="text-sm text-[#737373] mt-0.5">{app.description}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-1.5 flex-wrap">
            {app.actions.slice(0, 3).map((action) => (
              <Badge key={action.id} variant="default">
                {action.name}
              </Badge>
            ))}
          </div>
        </div>

        <div className="mt-4">
          {isConnected ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-emerald-400 border-emerald-400/20"
              >
                <Check className="h-4 w-4 mr-1" /> Connected
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => disconnectApp(app.id)}
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button
              variant="accent"
              size="sm"
              className="w-full"
              onClick={() => connectApp(app.id)}
            >
              <Plus className="h-4 w-4 mr-1" /> Connect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
