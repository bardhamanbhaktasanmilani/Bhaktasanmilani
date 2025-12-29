import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import AdminMenuShell from "../AdminMenuShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return <AdminMenuShell>{children}</AdminMenuShell>;
}
