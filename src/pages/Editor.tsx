import { Bold, Code2, Image, Italic, Link as LinkIcon, Send } from "lucide-react";
import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { countWords } from "../lib/format";

const initialMarkdown = `# Introduction

React Hooks introduced in version 16.8 have fundamentally changed how we build components. By allowing functional components to manage state and side effects, they simplified the component lifecycle.

## Key Concepts

- \`useState\`: For local state management.
- \`useEffect\`: For handling side effects like data fetching.
- \`useContext\`: For subscribing to React context without nesting.

## Why it matters

The biggest benefit is not syntax. Hooks make stateful behavior easier to extract, test, and reuse across focused components.
`;

const toolbar = [
  { label: "Bold", icon: Bold },
  { label: "Italic", icon: Italic },
  { label: "Code", icon: Code2 },
  { label: "Image", icon: Image },
  { label: "Link", icon: LinkIcon },
];

export default function Editor() {
  const [title, setTitle] = useState("The Impact of React Hooks on Frontend Architecture");
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const words = useMemo(() => countWords(`${title} ${markdown}`), [markdown, title]);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden bg-white dark:bg-zinc-950">
      <section className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950 sm:px-8">
        <div className="flex items-center gap-1">
          {toolbar.slice(0, 2).map((item) => (
            <button
              className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-blue-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-blue-300"
              key={item.label}
              title={item.label}
              type="button"
            >
              <item.icon size={19} />
            </button>
          ))}
          <div className="mx-2 h-6 w-px bg-gray-200 dark:bg-zinc-800" />
          {toolbar.slice(2).map((item) => (
            <button
              className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-blue-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-blue-300"
              key={item.label}
              title={item.label}
              type="button"
            >
              <item.icon size={19} />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold uppercase text-gray-500 dark:text-zinc-400">{words} Words</span>
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 active:scale-[0.98] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800">
            <Send size={16} />
            Publish
          </button>
        </div>
      </section>

      <section className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex h-full w-full flex-col overflow-y-auto border-r border-gray-100 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 lg:w-1/2 lg:p-8">
          <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6">
            <input
              className="border-0 bg-transparent p-0 text-3xl font-semibold leading-tight text-gray-950 outline-none placeholder:text-gray-300 focus:ring-0 dark:text-white dark:placeholder:text-zinc-700"
              placeholder="Post Title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />

            <div className="flex gap-4">
              <div className="w-1 shrink-0 rounded-full bg-blue-600" />
              <textarea
                className="min-h-[620px] flex-1 resize-none border-0 bg-transparent p-0 font-code text-sm leading-7 text-gray-700 outline-none placeholder:text-gray-300 focus:ring-0 dark:text-zinc-300"
                value={markdown}
                onChange={(event) => setMarkdown(event.target.value)}
              />
            </div>
          </div>
        </div>

        <article className="hidden h-full w-1/2 overflow-y-auto bg-gray-50 p-8 dark:bg-zinc-900 lg:block">
          <div className="markdown-preview mx-auto max-w-[720px]">
            {title.trim() ? <h1>{title}</h1> : null}
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
          </div>
        </article>
      </section>
    </div>
  );
}
