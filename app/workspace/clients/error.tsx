"use client";

export default function ClientsError({ reset }: { error: Error; reset: () => void }) {
  return <div className="cfy-shell flex min-h-svh items-center justify-center p-6"><section className="cfy-card max-w-md p-7 text-center"><p className="text-lg font-semibold text-white">Clients couldn’t be loaded</p><p className="mt-2 text-sm text-zinc-500">Please check your connection and try again.</p><button onClick={reset} className="cfy-primary-button mx-auto mt-5 h-10">Try again</button></section></div>;
}
