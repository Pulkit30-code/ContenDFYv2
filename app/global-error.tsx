"use client";

import "./globals.css";
import { useEffect } from "react";
import { ErrorLayout } from "@/components/errors/error-layout";

export default function GlobalError({ error, reset }: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  useEffect(() => { console.error(error); }, [error]);
  return <html lang="en" className="dark" style={{ colorScheme: "dark" }}><head><title>Something went wrong | ContenDFY</title></head><body><ErrorLayout kind="server" reset={reset} errorId={error.digest} /></body></html>;
}
