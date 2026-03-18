import { requireAuth } from '@/lib/auth';

export default async function UseRubePage() {
  await requireAuth();
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold text-[#0a0a0a] mb-4">Use Rube</h1>
      <p className="text-[#6b7280] mb-6">
        Rube is your AI assistant that connects to 500+ apps. Ask Rube to automate tasks across Gmail, Slack, GitHub, Notion, and more.
      </p>
      <div className="space-y-4">
        <div className="rounded-xl border border-[#e5e7eb] p-4">
          <h2 className="text-sm font-medium text-[#0a0a0a] mb-2">Getting Started</h2>
          <p className="text-sm text-[#6b7280]">
            Connect your apps in the Apps page, then start a chat. Rube will use the right tools to complete your tasks.
          </p>
        </div>
        <div className="rounded-xl border border-[#e5e7eb] p-4">
          <h2 className="text-sm font-medium text-[#0a0a0a] mb-2">Recipes</h2>
          <p className="text-sm text-[#6b7280]">
            Create reusable recipes to automate recurring workflows. Use the Recipe button in the chat to build new automations.
          </p>
        </div>
      </div>
    </div>
  );
}
