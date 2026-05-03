import { FileText } from "lucide-react";
import { Link } from "react-router-dom";

export default function Drafts() {
  return (
    <div className="pt-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-950 dark:text-white">Drafts</h1>
          <p className="mt-2 text-gray-600 dark:text-zinc-400">Review generated posts before approval and publishing.</p>
        </div>
        <Link className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white" to="/new">
          New Draft
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <FileText className="mx-auto mb-4 text-blue-600" size={34} />
        <h2 className="mb-2 text-xl font-bold text-gray-950 dark:text-white">Draft list is ready for API data</h2>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-gray-600 dark:text-zinc-400">
          This route is wired for the server's blog post collection and can be filled with live results next.
        </p>
      </div>
    </div>
  );
}
