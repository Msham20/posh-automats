import { supabase } from "./supabase-client.js";

const schemaNode = document.querySelector("[data-health-schema]");
const notesNode = document.querySelector("[data-health-notes]");

function setStatus(message) {
  if (schemaNode) schemaNode.textContent = message;
}

function setNotes(message) {
  if (notesNode) notesNode.textContent = message;
}

async function runHealthCheck() {
  if (!supabase) {
    setStatus("Supabase is not configured.");
    setNotes("Check assets/supabase-config.js first.");
    return;
  }

  const { error } = await supabase.from("site_settings").select("setting_key").limit(1);

  if (!error) {
    setStatus("Live: schema is reachable.");
    setNotes("The table site_settings responded successfully.");
    return;
  }

  if (error.code === "PGRST205") {
    setStatus("Not live yet: schema missing.");
    setNotes("Run supabase-deploy.sql in the Supabase SQL Editor.");
    return;
  }

  setStatus(`Health check failed: ${error.message || "unknown error"}`);
  setNotes("Check network access and Supabase project settings.");
}

runHealthCheck().catch((error) => {
  setStatus("Health check failed.");
  setNotes(error?.message || "Unexpected error.");
});
