import { Github, Globe2 } from "lucide-react";

export default function Settings() {
  return (
    <div className="pt-8">
      <h1 className="mb-2 text-3xl font-bold text-gray-950 dark:text-white">Settings</h1>
      <p className="mb-8 text-gray-600 dark:text-zinc-400">Publishing targets and workspace preferences.</p>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <Github className="mb-5 text-blue-600" size={28} />
          <h2 className="mb-2 text-xl font-bold text-gray-950 dark:text-white">GitHub Pages</h2>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-zinc-400">
            Primary publishing channel for approved Markdown posts.
          </p>
        </section>
        <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <Globe2 className="mb-5 text-blue-600" size={28} />
          <h2 className="mb-2 text-xl font-bold text-gray-950 dark:text-white">Velog Export</h2>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-zinc-400">
            Copy-ready Markdown export for secondary content distribution.
          </p>
        </section>
      </div>
    </div>
  );
}
