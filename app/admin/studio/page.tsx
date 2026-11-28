import type { Metadata } from "next";
import AdminStudio from "@/components/admin-studio";

export const metadata: Metadata = {
  title: "Admin Studio | Watchora",
  robots: { index: false, follow: false },
};

export default function AdminStudioPage() {
  return <AdminStudio />;
}
