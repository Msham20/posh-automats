import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SITE_SETTINGS_DEFAULTS, SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabase-config.js";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    })
  : null;

export function getMissingConfigMessage() {
  return "Add your Supabase project URL and anon key in assets/supabase-config.js before using the live dashboard.";
}

export function mapSettings(rows) {
  const output = { ...SITE_SETTINGS_DEFAULTS };

  rows.forEach((row) => {
    output[row.setting_key] = String(row.setting_value ?? "");
  });

  return output;
}

export async function fetchSiteSettings() {
  if (!supabase) return { ...SITE_SETTINGS_DEFAULTS };

  const { data, error } = await supabase
    .from("site_settings")
    .select("setting_key, setting_value");

  if (error) throw error;
  return mapSettings(data || []);
}

export async function upsertSiteSettings(settings) {
  if (!supabase) throw new Error(getMissingConfigMessage());

  const payload = Object.entries(settings).map(([setting_key, setting_value]) => ({
    setting_key,
    setting_value
  }));

  const { error } = await supabase
    .from("site_settings")
    .upsert(payload, { onConflict: "setting_key" });

  if (error) throw error;
}

export async function fetchPublicServices() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function fetchPublicGalleryItems() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("gallery_items")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function fetchPublicTestimonials() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}
