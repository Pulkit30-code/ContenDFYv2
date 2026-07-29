"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";

const INTRO_DURATION_MS = 1_900;

export function WelcomeAnimation({ persistent = false }: { persistent?: boolean }) {
  const shouldReduceMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (shouldReduceMotion || persistent) return;
    const timeout = window.setTimeout(() => setIsVisible(false), INTRO_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [persistent, shouldReduceMotion]);

  const visible = persistent || (isVisible && !shouldReduceMotion);

  return <AnimatePresence>
    {visible && <motion.div aria-hidden="true" className="fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-[#110707]" exit={{ opacity: 0 }} transition={{ duration: shouldReduceMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,30,40,.24),transparent_42%)]" />
      <motion.div className="relative flex flex-col items-center" initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.9, y: 10, filter: "blur(10px)" }} animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: shouldReduceMotion ? 0 : 0.72, ease: [0.22, 1, 0.36, 1] }}>
        <motion.span className="absolute -inset-16 rounded-full bg-red-500/20 blur-3xl" animate={shouldReduceMotion ? undefined : { scale: [0.88, 1.14, 0.88], opacity: [.42, .9, .42] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="relative size-36 sm:size-44" animate={shouldReduceMotion ? undefined : { rotate: 360 }} transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}><Image src="/brand/contentdfy-mark.png" alt="" fill priority sizes="176px" className="object-contain drop-shadow-[0_0_44px_rgba(255,48,55,.62)]" /></motion.div>
        <div className="relative mt-7 flex items-center gap-3 text-[2rem] font-semibold tracking-[-.055em] text-white sm:text-[2.5rem]"><span>ContenDFY</span><span className="rounded-lg border border-red-100/20 bg-red-400/10 px-2 py-1 font-mono text-[10px] font-medium tracking-normal text-red-100/75 sm:text-xs">OS</span></div>
        <div className="mt-8 h-1 w-52 overflow-hidden rounded-full bg-white/[.12] shadow-inner sm:w-64"><motion.span className="block h-full origin-left rounded-full bg-gradient-to-r from-red-300 via-red-500 to-rose-300 shadow-[0_0_18px_rgba(255,64,70,.95)]" initial={{ scaleX: persistent ? .45 : 0 }} animate={persistent ? { scaleX: [.32, .95, .32] } : { scaleX: 1 }} transition={persistent ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" } : { duration: shouldReduceMotion ? 0 : 1.48, delay: shouldReduceMotion ? 0 : 0.16, ease: [0.22, 1, 0.36, 1] }} /></div>
      </motion.div>
    </motion.div>}
  </AnimatePresence>;
}
