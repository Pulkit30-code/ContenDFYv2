"use client";

import { useEffect } from "react";
import { ErrorLayout } from "@/components/errors/error-layout";

export default function SegmentError({ error, reset }: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  useEffect(() => { console.error(error); }, [error]);
  return <ErrorLayout kind="server" reset={reset} errorId={error.digest} />;
}
