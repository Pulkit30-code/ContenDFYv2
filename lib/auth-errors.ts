export function authErrorMessage(error: unknown, fallback = "Unexpected server error. Please try again.") {
  const message = error && typeof error === "object" && "message" in error && typeof error.message === "string" ? error.message.trim() : "";
  const normalized = message.toLowerCase();

  if (normalized.includes("already registered") || normalized.includes("already exists") || normalized.includes("duplicate")) return "An account already exists for this email. Sign in instead.";
  if (normalized.includes("password") && normalized.includes("8")) return "Password must contain at least 8 characters.";
  if (normalized.includes("email") && (normalized.includes("invalid") || normalized.includes("valid"))) return "Enter a valid email address.";
  if (normalized.includes("provision") || normalized.includes("workspace")) return "Unable to create your workspace. Please try again.";
  if (normalized.includes("profile")) return "Profile creation failed. Please try again.";
  if (normalized.includes("email") && normalized.includes("confirm")) return "Email verification could not be started. Please try again.";
  return message || fallback;
}

export function logAuthError(scope: string, error: unknown) {
  const message = error && typeof error === "object" && "message" in error && typeof error.message === "string" ? error.message.toLowerCase() : "";
  // Invalid credentials are an expected user-input outcome. Rendering them as
  // a development console error triggers Next's error overlay and hides the
  // friendly inline form message.
  if (message.includes("invalid login credentials")) return;
  if (process.env.NODE_ENV !== "production") console.error(`[Auth] ${scope}`, error);
}
