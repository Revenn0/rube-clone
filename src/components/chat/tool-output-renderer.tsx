'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Circle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const CHART_COLORS = ['#f26522', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

function isArrayOfObjects(value: unknown): value is Record<string, unknown>[] {
  return Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null;
}

function isChartData(value: unknown): value is Array<{ name?: string; label?: string; value: number; [k: string]: unknown }> {
  if (!Array.isArray(value) || value.length === 0) return false;
  const first = value[0];
  if (typeof first !== 'object' || first === null) return false;
  const keys = Object.keys(first);
  const hasValue = keys.some((k) => typeof (first as Record<string, unknown>)[k] === 'number');
  const hasLabel = keys.some((k) => ['name', 'label', 'x', 'category'].includes(k));
  return hasValue && (hasLabel || keys.length >= 2);
}

function getColumns(data: Record<string, unknown>[]): string[] {
  const allKeys = new Set<string>();
  data.forEach((row) => Object.keys(row).forEach((k) => allKeys.add(k)));
  return Array.from(allKeys);
}

function formatCellValue(val: unknown): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? '✓' : '✗';
  if (typeof val === 'object') return JSON.stringify(val).slice(0, 50);
  return String(val);
}

interface ToolOutputRendererProps {
  output: unknown;
  toolName?: string;
  className?: string;
}

export function ToolOutputRenderer({ output, toolName, className }: ToolOutputRendererProps) {
  const render = useMemo(() => {
    if (output == null) return null;

    // String output
    if (typeof output === 'string') {
      try {
        const parsed = JSON.parse(output);
        return <ToolOutputRenderer output={parsed} toolName={toolName} />;
      } catch {
        return (
          <pre className="text-xs bg-white rounded-lg p-3 border border-[#e5e7eb] overflow-x-auto max-h-60 overflow-y-auto whitespace-pre-wrap">
            {output}
          </pre>
        );
      }
    }

    // Array of objects -> Table or Chart
    if (isArrayOfObjects(output)) {
      const cols = getColumns(output);

      // Chart: array with numeric values and labels
      if (isChartData(output) && output.length <= 20) {
        const labelKey = cols.find((c) => ['name', 'label', 'x', 'category'].includes(c)) ?? cols[0];
        const valueKey = cols.find((c) => ['value', 'count', 'y', 'amount'].includes(c)) ?? cols.find((c) => typeof output[0][c] === 'number');
        if (valueKey) {
          const chartData = output.map((row) => ({
            name: String((row as Record<string, unknown>)[labelKey] ?? (row as Record<string, unknown>)[cols[0]] ?? ''),
            value: Number((row as Record<string, unknown>)[valueKey]),
          }));

          if (chartData.length <= 6) {
            return (
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            );
          }
          return (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#f26522" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          );
        }
      }

      // Table
      return (
        <div className="overflow-x-auto rounded-lg border border-[#e5e7eb]">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-[#f3f4f6]">
                <th className="px-3 py-2 text-left text-xs font-medium text-[#6b7280] uppercase">#</th>
                {cols.map((col) => (
                  <th key={col} className="px-3 py-2 text-left text-xs font-medium text-[#6b7280] uppercase">
                    {col.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb] bg-white">
              {output.map((row, i) => (
                <tr key={i} className="hover:bg-[#f9fafb]">
                  <td className="px-3 py-2 text-[#6b7280]">{i + 1}</td>
                  {cols.map((col) => {
                    const val = row[col];
                    const isRead = typeof val === 'string' && val.toLowerCase() === 'read';
                    const isUnread = typeof val === 'string' && val.toLowerCase() === 'unread';
                    return (
                      <td key={col} className="px-3 py-2 text-[#0a0a0a]">
                        {isRead || isUnread ? (
                          <span className="flex items-center gap-1.5">
                            {isUnread ? (
                              <Circle className="h-3 w-3 fill-red-500 text-red-500" />
                            ) : (
                              <Check className="h-3 w-3 text-[#6b7280]" />
                            )}
                            {formatCellValue(val)}
                          </span>
                        ) : (
                          formatCellValue(val)
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // Wrapped object (e.g. { data: [...], items: [...], emails: [...] })
    if (typeof output === 'object' && output !== null) {
      const obj = output as Record<string, unknown>;
      const arrayKeys = ['data', 'items', 'emails', 'messages', 'results', 'records', 'list'];
      for (const key of arrayKeys) {
        const arr = obj[key];
        if (Array.isArray(arr) && isArrayOfObjects(arr)) {
          return <ToolOutputRenderer output={arr} toolName={toolName} />;
        }
      }
      const arrayKey = Object.keys(obj).find((k) => Array.isArray(obj[k]));
      if (arrayKey && isArrayOfObjects(obj[arrayKey] as Record<string, unknown>[])) {
        return <ToolOutputRenderer output={obj[arrayKey]} toolName={toolName} />;
      }
    }

    // Fallback: JSON
    return (
      <pre className="text-xs bg-white rounded-lg p-3 border border-[#e5e7eb] overflow-x-auto max-h-60 overflow-y-auto">
        {JSON.stringify(output, null, 2)}
      </pre>
    );
  }, [output, toolName]);

  if (!render) return null;

  return <div className={cn('space-y-2', className)}>{render}</div>;
}
