import { getSlackEnv } from "@/lib/env";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    getSlackEnv();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid Slack environment variables";
    console.error(`[ContenDFY] Slack integration configuration error: ${message}`);
    throw error;
  }
}
