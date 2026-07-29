"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, FileQuestion, Home, LockKeyhole, RefreshCw, RotateCcw, ServerCrash, ShieldAlert } from "lucide-react";

type ErrorKind = "not-found" | "server" | "unauthorized" | "forbidden";

const content: Record<ErrorKind, { code: string; title: string; description: string; Icon: typeof FileQuestion }> = {
  "not-found": { code: "404", title: "Page Not Found", description: "The page you’re looking for doesn’t exist or may have been moved.", Icon: FileQuestion },
  server: { code: "500", title: "Something Went Wrong", description: "An unexpected error occurred. Please try again.", Icon: ServerCrash },
  unauthorized: { code: "401", title: "Session Required", description: "Your session has expired or you need to sign in to view this page.", Icon: LockKeyhole },
  forbidden: { code: "403", title: "Access Denied", description: "You don’t have permission to view this page.", Icon: ShieldAlert },
};

export function ErrorLayout({ kind, reset, errorId, autoLogin = false }: { kind: ErrorKind; reset?: () => void; errorId?: string; autoLogin?: boolean }) {
  const { code, title, description, Icon } = content[kind];
  const developmentErrorId = process.env.NODE_ENV !== "production" ? errorId : undefined;

  useEffect(() => {
    if (!autoLogin) return;
    const destination = `${window.location.pathname}${window.location.search}`;
    const timer = window.setTimeout(() => { window.location.assign(`/login?next=${encodeURIComponent(destination)}&reason=session-expired`); }, 4_000);
    return () => window.clearTimeout(timer);
  }, [autoLogin]);

  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else window.location.assign(kind === "unauthorized" ? "/login" : "/workspace");
  };
  const login = () => {
    const destination = `${window.location.pathname}${window.location.search}`;
    window.location.assign(`/login?next=${encodeURIComponent(destination)}${autoLogin ? "&reason=session-expired" : ""}`);
  };
  const refresh = () => window.location.reload();

  return <main className="cfy-error-page" aria-labelledby="error-title">
    <div className="cfy-error-orb cfy-error-orb-one" aria-hidden="true" />
    <div className="cfy-error-orb cfy-error-orb-two" aria-hidden="true" />
    <section className="cfy-error-card">
      <Link href={kind === "unauthorized" ? "/login" : "/workspace"} className="cfy-error-brand" aria-label="ContenDFY home"><span>c</span><strong>ContenDFY</strong></Link>
      <div className="cfy-error-content">
        <div className="cfy-error-illustration" aria-hidden="true"><Icon /><span className="cfy-error-spark cfy-error-spark-one" /><span className="cfy-error-spark cfy-error-spark-two" /></div>
        <p className="cfy-error-code">{code}</p>
        <h1 id="error-title">{title}</h1>
        <p className="cfy-error-description">{description}</p>
        {autoLogin && <p className="cfy-error-timer" role="status">Redirecting to sign in in a few seconds…</p>}
        {developmentErrorId && <p className="cfy-error-id">Error reference: <code>{developmentErrorId}</code></p>}
        <div className="cfy-error-actions">
          {kind === "server" && reset && <button type="button" className="cfy-error-primary" onClick={reset}><RotateCcw />Try again</button>}
          {kind === "server" && <button type="button" className="cfy-error-secondary" onClick={refresh}><RefreshCw />Refresh page</button>}
          {kind === "unauthorized" && <button type="button" className="cfy-error-primary" onClick={login}><LockKeyhole />Sign in again</button>}
          {kind !== "unauthorized" && kind !== "server" && <Link className="cfy-error-primary" href="/workspace"><Home />Go to dashboard</Link>}
          {kind === "server" && <Link className="cfy-error-secondary" href="/workspace"><Home />Dashboard</Link>}
          {kind === "unauthorized" && <button type="button" className="cfy-error-secondary" onClick={goBack}><ArrowLeft />Go back</button>}
          {kind === "not-found" && <Link className="cfy-error-secondary" href="/workspace/projects"><ArrowRight />Search projects</Link>}
          {kind === "forbidden" && <button type="button" className="cfy-error-secondary" onClick={goBack}><ArrowLeft />Go back</button>}
        </div>
      </div>
      <nav className="cfy-error-links" aria-label="Helpful links"><Link href="/workspace">Dashboard</Link><Link href="/workspace/projects">Projects</Link><Link href="/workspace/files">Files</Link></nav>
    </section>
  </main>;
}
