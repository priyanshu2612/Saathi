import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sukoon Admin",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-root min-h-screen bg-linen-50">{children}</div>;
}
