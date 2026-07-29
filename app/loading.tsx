import { WelcomeAnimation } from "@/components/common/welcome-animation";

// The route fallback must be self-clearing: navigation can wait on auth or a
// server component, and a persistent overlay would otherwise cover the target
// page indefinitely. WelcomeAnimation already preserves the existing intro
// animation and dismisses itself after its bounded timeout.
export default function Loading() { return <WelcomeAnimation />; }
