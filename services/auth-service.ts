import { createClient } from "@/supabase/client";
export async function signOut() { return createClient().auth.signOut(); }
export async function getBrowserSession() { return createClient().auth.getSession(); }
