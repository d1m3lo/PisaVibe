
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin PISA VIBE",
  description: "Painel de administração da PISA VIBE.",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
