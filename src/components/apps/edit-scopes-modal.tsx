'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

interface EditScopesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appId: string;
  appName: string;
  scopes: string[];
  connectedAccountId: string | null;
  onUpdated?: () => void;
}

export default function EditScopesModal({
  open,
  onOpenChange,
  appName,
  scopes,
  onUpdated,
}: EditScopesModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(scopes));
  const [updating, setUpdating] = useState(false);
  const [selectAll, setSelectAll] = useState(true);

  const toggleScope = (scope: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(scope)) next.delete(scope);
      else next.add(scope);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelected(new Set());
      setSelectAll(false);
    } else {
      setSelected(new Set(scopes));
      setSelectAll(true);
    }
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      onUpdated?.();
      onOpenChange(false);
    } catch (err) {
      console.error('Update scopes failed:', err);
    } finally {
      setUpdating(false);
    }
  };

  const canUpdate = false;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md">
        <SheetHeader>
          <SheetTitle>Edit Scopes - {appName}</SheetTitle>
          <SheetDescription>
            Select the permissions for {appName}. Changes may require reconnecting.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={toggleSelectAll}
              disabled={canUpdate}
              className="h-4 w-4 rounded border-[#d1d5db]"
            />
            <span className="text-sm font-medium text-[#0a0a0a]">Select All Scopes</span>
          </label>

          <div className="max-h-60 overflow-y-auto space-y-2 rounded-lg border border-[#e5e7eb] p-3">
            {scopes.length === 0 ? (
              <p className="text-sm text-[#6b7280]">No scopes available.</p>
            ) : (
              scopes.map((scope) => (
                <label
                  key={scope}
                  className={cn(
                    'flex items-center gap-2 cursor-pointer rounded-md px-2 py-1.5',
                    selected.has(scope) && 'bg-green-50'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(scope)}
                    onChange={() => toggleScope(scope)}
                    disabled={canUpdate}
                    className="h-4 w-4 rounded border-[#d1d5db]"
                  />
                  <Check
                    className={cn(
                      'h-4 w-4 shrink-0',
                      selected.has(scope) ? 'text-green-600' : 'text-[#d1d5db]'
                    )}
                  />
                  <code className="text-xs text-[#6b7280] break-all">{scope}</code>
                </label>
              ))
            )}
          </div>

          {!canUpdate && (
            <p className="text-xs text-[#6b7280]">
              Composio does not support changing scopes for existing connections. Disconnect
              and reconnect to modify permissions.
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={updating || !canUpdate}
            className="flex items-center gap-2"
          >
            {updating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Update Scopes'
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
