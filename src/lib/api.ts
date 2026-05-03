import axios from "axios";
import type {
  AiJob,
  ApiResponse,
  BlogPost,
  HealthResponse,
  LocalRepository,
  PublishTarget,
} from "../types/api";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010";

export const http = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

async function unwrap<T>(request: Promise<{ data: ApiResponse<T> | T }>): Promise<T> {
  const response = await request;
  const payload = response.data;

  if (payload && typeof payload === "object" && "success" in payload) {
    if (payload.success) {
      return payload.data;
    }
    throw new Error(payload.message || "Request failed");
  }

  return payload as T;
}

export const api = {
  health: () => unwrap<HealthResponse>(http.get("/api/system/health")),
  blogPosts: () => unwrap<BlogPost[]>(http.get("/api/blog-posts")),
  blogPost: (blogPostId: number) => unwrap<BlogPost>(http.get(`/api/blog-posts/${blogPostId}`)),
  jobs: () => unwrap<AiJob[]>(http.get("/api/ai-jobs")),
  job: (jobId: number) => unwrap<AiJob>(http.get(`/api/ai-jobs/${jobId}`)),
  localRepositories: () => unwrap<LocalRepository[]>(http.get("/api/local-repositories")),
  publishTargets: () => unwrap<PublishTarget[]>(http.get("/api/publish-targets")),
};
