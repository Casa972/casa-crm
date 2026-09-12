import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileNav } from "./MobileNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-bg">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
