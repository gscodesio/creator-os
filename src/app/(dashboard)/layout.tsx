import { Suspense } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { CreatorOSProvider } from "@/lib/store/creatorStore";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CreatorOSProvider>
      <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
        <Suspense fallback={<aside className="w-64 bg-white border-r border-slate-200 h-screen" />}>
          <Sidebar />
        </Suspense>
        <div className="flex flex-col flex-1 min-w-0">
          <Suspense fallback={<header className="h-16 bg-white border-b border-slate-200" />}>
            <Header />
          </Suspense>
          <main className="flex-1 overflow-y-auto p-8">
            <Suspense fallback={<div className="p-8 text-slate-400">Loading...</div>}>
              {children}
            </Suspense>
          </main>
        </div>
      </div>
    </CreatorOSProvider>
  );
}
