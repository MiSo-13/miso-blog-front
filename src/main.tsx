import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import App from "./App";
import AiJobs from "./pages/AiJobs";
import Dashboard from "./pages/Dashboard";
import ContentPath from "./pages/ContentPath";
import Editor from "./pages/Editor";
import Drafts from "./pages/Drafts";
import GeneralDraft from "./pages/GeneralDraft";
import GitRepositories from "./pages/GitRepositories";
import OpenAiOperations from "./pages/OpenAiOperations";
import Projects from "./pages/Projects";
import Settings from "./pages/Settings";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "new", element: <ContentPath /> },
      { path: "general/new", element: <GeneralDraft /> },
      { path: "projects", element: <Projects /> },
      { path: "github-projects", element: <GitRepositories /> },
      { path: "editor", element: <Editor /> },
      { path: "drafts", element: <Drafts /> },
      { path: "drafts/:blogPostId", element: <Editor /> },
      { path: "jobs", element: <AiJobs /> },
      { path: "openai", element: <OpenAiOperations /> },
      { path: "settings", element: <Settings /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
