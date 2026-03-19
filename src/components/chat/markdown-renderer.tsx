'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div
      className={cn(
        'text-sm [&_p]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5',
        '[&_strong]:font-semibold [&_a]:text-[#f26522] [&_a]:no-underline hover:[&_a]:underline',
        '[&_pre]:bg-[#f9fafb] [&_pre]:border [&_pre]:border-[#e5e7eb] [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:overflow-x-auto',
        '[&_code]:bg-[#f3f4f6] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs',
        '[&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_h1]:font-bold [&_h2]:font-semibold [&_h3]:font-medium',
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-lg border border-[#e5e7eb]">
              <table className="min-w-full divide-y divide-[#e5e7eb]">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[#f3f4f6]">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-border bg-card">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-[#f9fafb] transition-colors">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left text-xs font-medium text-[#374151] uppercase tracking-wider">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-sm text-[#0a0a0a]">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
