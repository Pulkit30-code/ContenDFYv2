const REMEMBER_COOKIE = "contendfy-remember";

export function setRememberMe(remember: boolean) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${REMEMBER_COOKIE}=${remember ? "true; Max-Age=31536000" : "false"}; Path=/; SameSite=Lax${secure}`;
}
