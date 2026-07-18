import { ReactNode } from "react";
import Sidebar from "./Sidebar";

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({
  children,
}: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-zinc-100">
      <Sidebar />

      <main className="flex-1 overflow-auto p-10">
        {children}
      </main>
    </div>
  );
}