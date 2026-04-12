"use client";

import { Loader2 } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/components/auth/AuthProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, session } = useAuth();

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d1117]">
        <Loader2 className="h-6 w-6 animate-spin text-[#f97316]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-64 flex-1 p-6">{children}</main>
    </div>
  );
}
