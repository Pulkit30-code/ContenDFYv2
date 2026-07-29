import type { Metadata } from "next";
import { connection } from "next/server";
import { AppProviders } from "@/components/shared/app-providers";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "ContenDFY v2", template: "%s | ContenDFY v2" },
  description: "A modern content operations workspace.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The proxy creates a unique CSP nonce for every request. Rendering the
  // document dynamically lets Next attach that nonce to its bootstrap scripts;
  // a prerendered document has no request nonce and cannot hydrate under the
  // strict CSP.
  await connection();
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
