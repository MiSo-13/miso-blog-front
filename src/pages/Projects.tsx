import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderOpen, PlusCircle } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { api } from "../lib/api";
import { formatDateTime } from "../lib/format";
import type { CreateLocalRepositoryPayload } from "../types/api";

const emptyForm = {
  name: "",
  localPath: "",
  defaultBranch: "main",
  description: "",
  active: true,
};

export default function Projects() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const repositoriesQuery = useQuery({
    queryKey: ["local-repositories"],
    queryFn: api.localRepositories,
    retry: false,
  });
  const createRepositoryMutation = useMutation({
    mutationFn: (payload: CreateLocalRepositoryPayload) => api.createLocalRepository(payload),
    onSuccess: () => {
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ["local-repositories"] });
    },
  });
  const repositories = repositoriesQuery.isSuccess ? repositoriesQuery.data : [];
  const canCreate = form.name.trim().length > 0 && form.localPath.trim().length > 0;

  const updateField = (field: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canCreate) {
      return;
    }

    createRepositoryMutation.mutate({
      name: form.name.trim(),
      localPath: form.localPath.trim(),
      defaultBranch: form.defaultBranch.trim() || null,
      description: form.description.trim() || null,
      active: form.active,
    });
  };

  return (
    <div className="pt-8">
      <section className="mb-8">
        <p className="mb-2 text-sm font-semibold text-blue-600 dark:text-blue-400">Local Git repositories</p>
        <h1 className="mb-2 text-3xl font-bold text-gray-950 dark:text-white">Projects</h1>
        <p className="max-w-2xl text-gray-600 dark:text-zinc-400">
          Register local repositories so the server can analyze commit history and implementation context.
        </p>
      </section>

      <section className="mb-8 rounded-lg border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-5 flex items-center gap-3">
          <PlusCircle className="text-blue-600" size={22} />
          <h2 className="text-xl font-bold text-gray-950 dark:text-white">Register repository</h2>
        </div>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Name</span>
              <input
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Default branch</span>
              <input
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
                value={form.defaultBranch}
                onChange={(event) => updateField("defaultBranch", event.target.value)}
              />
            </label>
          </div>
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Local path</span>
            <input
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
              value={form.localPath}
              onChange={(event) => updateField("localPath", event.target.value)}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Description</span>
            <textarea
              className="min-h-20 w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-500/15"
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
            />
          </label>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
              <input checked={form.active} type="checkbox" onChange={(event) => updateField("active", event.target.checked)} />
              Active repository
            </label>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canCreate || createRepositoryMutation.isPending}
              type="submit"
            >
              <PlusCircle size={17} />
              {createRepositoryMutation.isPending ? "Registering" : "Register"}
            </button>
          </div>
        </form>
      </section>

      {repositories.length === 0 ? (
        <section className="rounded-lg border border-gray-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <FolderOpen className="mx-auto mb-4 text-blue-600" size={34} />
          <h2 className="mb-2 text-xl font-bold text-gray-950 dark:text-white">No registered repositories</h2>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-gray-600 dark:text-zinc-400">
            Registered local repositories will appear here when the server is available.
          </p>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {repositories.map((repository) => (
            <article className="rounded-lg border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900" key={repository.id}>
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                  <FolderOpen size={22} />
                </div>
                <span className={repository.active ? "text-xs font-bold uppercase text-emerald-600" : "text-xs font-bold uppercase text-gray-400"}>
                  {repository.active ? "Active" : "Inactive"}
                </span>
              </div>
              <h2 className="mb-2 text-xl font-bold text-gray-950 dark:text-white">{repository.name}</h2>
              <p className="mb-4 break-all text-sm leading-relaxed text-gray-600 dark:text-zinc-400">{repository.localPath}</p>
              {repository.description ? (
                <p className="mb-4 text-sm leading-relaxed text-gray-600 dark:text-zinc-400">{repository.description}</p>
              ) : null}
              <div className="grid gap-2 border-t border-gray-100 pt-4 text-xs text-gray-500 dark:border-zinc-800 dark:text-zinc-500">
                <p>
                  <span className="font-bold text-gray-700 dark:text-zinc-300">Branch:</span> {repository.defaultBranch || "-"}
                </p>
                <p>
                  <span className="font-bold text-gray-700 dark:text-zinc-300">Updated:</span> {formatDateTime(repository.updatedAt)}
                </p>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
