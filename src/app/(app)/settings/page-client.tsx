'use client';

export default function SettingsPageClient() {
  return (
    <div className="min-h-full px-4 sm:px-6 py-5 sm:py-6">
      <div className="mx-auto max-w-xl space-y-6 sm:space-y-8">
        {/* Model */}
        <div>
          <h3 className="text-sm font-medium text-[#0a0a0a] mb-3 sm:mb-4">Model</h3>
          <select className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2.5 text-sm text-[#0a0a0a] focus:outline-none focus:ring-2 focus:ring-[#f26522]/20 focus:border-[#f26522]">
            <option value="nvidia/nemotron-3-super-120b-a12b:free">Nemotron 120B (Free)</option>
            <option value="meta-llama/llama-3.1-70b-instruct:free">Llama 3.1 70B (Free)</option>
            <option value="google/gemini-2.0-flash-exp:free">Gemini 2.0 Flash (Free)</option>
            <option value="anthropic/claude-sonnet-4">Claude Sonnet 4</option>
            <option value="openai/gpt-4o">GPT-4o</option>
          </select>
          <p className="text-xs text-[#9ca3af] mt-2">
            Select the AI model for chat responses
          </p>
        </div>

        {/* Connected Apps */}
        <div>
          <h3 className="text-sm font-medium text-[#0a0a0a] mb-3 sm:mb-4">Connected Apps</h3>
          <div className="rounded-xl border border-[#e5e7eb] bg-[#fafafa] p-4">
            <p className="text-sm text-[#6b7280]">
              No apps connected yet. Go to <a href="/apps" className="text-[#f26522] font-medium">Apps</a> to connect.
            </p>
          </div>
        </div>

        {/* About */}
        <div>
          <h3 className="text-sm font-medium text-[#0a0a0a] mb-3 sm:mb-4">About</h3>
          <div className="rounded-xl border border-[#e5e7eb] bg-[#fafafa] p-4">
            <p className="text-sm text-[#6b7280]">
              <span className="font-medium text-[#0a0a0a]">Rube</span> — Connect anything to anything
            </p>
            <p className="text-xs text-[#9ca3af] mt-1">Powered by OpenRouter & Composio</p>
          </div>
        </div>
      </div>
    </div>
  );
}
