'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

interface ImportConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appName: string;
}

export default function ImportConfigModal({
  open,
  onOpenChange,
  appName,
}: ImportConfigModalProps) {
  const [selectedTeam, setSelectedTeam] = useState('');
  const [understood, setUnderstood] = useState(false);
  const [importing, setImporting] = useState(false);

  const teams = ['Team Alpha', 'Team Beta', 'Team Gamma'];

  const handleImport = async () => {
    if (!understood || !selectedTeam) return;
    setImporting(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      onOpenChange(false);
    } catch (err) {
      console.error('Import failed:', err);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md">
        <SheetHeader>
          <SheetTitle>Import Configuration</SheetTitle>
          <SheetDescription>
            Import {appName} configuration from another team.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#0a0a0a] mb-1">
              Select Team
            </label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#0a0a0a]"
            >
              <option value="">Choose a team...</option>
              {teams.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={understood}
              onChange={(e) => setUnderstood(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-[#d1d5db]"
            />
            <span className="text-sm text-[#6b7280]">
              I understand this will replace the current {appName} configuration for this
              workspace.
            </span>
          </label>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs text-amber-800">
              <strong>Coming soon.</strong> Team configuration import is not yet available.
              This feature will allow you to copy app settings from other organizations.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={importing || !understood || !selectedTeam}
            className="flex items-center gap-2"
          >
            {importing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Import'
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
