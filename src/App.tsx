import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";

export default function App() {
  const location = useLocation();
  const isEditor = location.pathname === "/editor";
  const isContentPath = location.pathname === "/new";
  const hasSidebar = !isContentPath;

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-zinc-950 dark:text-zinc-50">
      {hasSidebar ? <Sidebar /> : null}
      <TopBar />
      <main className={`min-h-screen pt-16 ${hasSidebar ? "pl-0 lg:pl-64" : ""}`}>
        <div
          className={
            isEditor || isContentPath
              ? "w-full"
              : "mx-auto w-full max-w-[1200px] px-4 pb-12 pt-4 sm:px-6 lg:px-8"
          }
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
}
