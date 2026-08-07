import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TB Aviation — Gestão de Frota",
  description: "Tarefas, vencimentos e manutenção da frota TB Aviation",
  icons: {
    icon: "/tb-icon.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
