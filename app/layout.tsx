import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AuditIQ | Smart Inventory Audits",
  description: "Smart Inventory Audits: análisis y conciliación local de facturas e inventarios.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
