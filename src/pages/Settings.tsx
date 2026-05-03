import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Github, Globe2, PlusCircle } from "lucide-react";
import { api } from "../lib/api";
import { formatDateTime } from "../lib/format";
import type { PublishTarget } from "../types/api";

const channelIcon = {
  GITHUB_PAGES: Github,
  VELOG: Globe2,
};

function targetDescription(target: PublishTarget) {
  if (target.channel === "GITHUB_PAGES") {
    return [target.repositoryFullName, target.branchName, target.contentRootPath].filter(Boolean).join(" · ");
  }
  return target.baseUrl || target.customDomain || "Velog export target";
}

export default function Settings() {
  const queryClient = useQueryClient();
  const targetsQuery = useQuery({
    queryKey: ["publish-targets"],
    queryFn: api.publishTargets,
    retry: false,
  });
  const strategyQuery = useQuery({
    queryKey: ["publish-strategy"],
    queryFn: api.publishStrategy,
    retry: false,
  });
  const createDefaultsMutation = useMutation({
    mutationFn: api.createDefaultPublishTargets,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publish-targets"] });
      queryClient.invalidateQueries({ queryKey: ["publish-strategy"] });
    },
  });
  const targets = targetsQuery.isSuccess ? targetsQuery.data : [];

  return (
    <div className="pt-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-gray-950 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-zinc-400">Publishing targets and workspace preferences.</p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={createDefaultsMutation.isPending}
          type="button"
          onClick={() => createDefaultsMutation.mutate()}
        >
          <PlusCircle size={17} />
          {createDefaultsMutation.isPending ? "Creating" : "Create defaults"}
        </button>
      </div>

      {strategyQuery.isSuccess ? (
        <section className="mb-6 rounded-lg border border-gray-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 text-lg font-bold text-gray-950 dark:text-white">Publishing Strategy</h2>
          <div className="grid gap-3 text-sm text-gray-600 dark:text-zinc-400 md:grid-cols-3">
            <p>
              <span className="block text-xs font-bold uppercase text-gray-500 dark:text-zinc-500">Primary</span>
              {strategyQuery.data.primaryChannel}
            </p>
            <p>
              <span className="block text-xs font-bold uppercase text-gray-500 dark:text-zinc-500">Exposure</span>
              {strategyQuery.data.exposureChannel}
            </p>
            <p>
              <span className="block text-xs font-bold uppercase text-gray-500 dark:text-zinc-500">Markdown</span>
              {strategyQuery.data.markdownPolicy}
            </p>
          </div>
        </section>
      ) : null}

      {targets.length === 0 ? (
        <section className="rounded-lg border border-gray-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <Globe2 className="mx-auto mb-4 text-blue-600" size={34} />
          <h2 className="mb-2 text-xl font-bold text-gray-950 dark:text-white">No publish targets</h2>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-gray-600 dark:text-zinc-400">
            Create default targets when the server is available, then configure GitHub Pages and Velog details on the server.
          </p>
        </section>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {targets.map((target) => {
            const Icon = channelIcon[target.channel];

            return (
              <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900" key={target.id}>
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                    <Icon size={24} />
                  </div>
                  <span className={target.active ? "text-xs font-bold uppercase text-emerald-600" : "text-xs font-bold uppercase text-gray-400"}>
                    {target.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <h2 className="mb-2 text-xl font-bold text-gray-950 dark:text-white">{target.name}</h2>
                <p className="mb-5 min-h-10 text-sm leading-relaxed text-gray-600 dark:text-zinc-400">
                  {targetDescription(target)}
                </p>
                <div className="grid gap-2 border-t border-gray-100 pt-4 text-xs text-gray-500 dark:border-zinc-800 dark:text-zinc-500">
                  <p>
                    <span className="font-bold text-gray-700 dark:text-zinc-300">Channel:</span> {target.channel}
                  </p>
                  <p>
                    <span className="font-bold text-gray-700 dark:text-zinc-300">Role:</span> {target.role}
                  </p>
                  <p>
                    <span className="font-bold text-gray-700 dark:text-zinc-300">Updated:</span> {formatDateTime(target.updatedAt)}
                  </p>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
