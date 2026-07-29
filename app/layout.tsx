import type { Metadata } from "next";
import { AppProviders } from "@/components/shared/app-providers";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "ContenDFY v2", template: "%s | ContenDFY v2" },
  description: "A modern content operations workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="dark h-full antialiased"
      style={{ colorScheme: "dark" }}
    >
      <body className="min-h-full flex flex-col"><AppProviders>{children}</AppProviders></body>
    </html>
  );
}
