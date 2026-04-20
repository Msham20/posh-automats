import {
  fetchSiteSettings,
  getMissingConfigMessage,
  isSupabaseConfigured,
  supabase,
  upsertSiteSettings
} from "./supabase-client.js";
import { SITE_SETTINGS_DEFAULTS } from "./supabase-config.js";

const seedData = {
  services: [
    {
      title: "PLC and HMI Integration",
      category: "Automation",
      price: "Custom quote",
      description: "Operator-friendly automation controls with reliable process visibility.",
      sort_order: 1,
      is_active: true
    },
    {
      title: "Special Purpose Machines",
      category: "SPM",
      price: "Project based",
      description: "Custom-built machines for machining, assembly, and repeatable industrial operations.",
      sort_order: 2,
      is_active: true
    },
    {
      title: "Vision Inspection Systems",
      category: "Inspection",
      price: "Custom quote",
      description: "Low-cost vision and positioning setups for process verification and quality control.",
      sort_order: 3,
      is_active: true
    }
  ],
  leads: [
    {
      name: "Brakes India",
      source: "Website",
      service_interest: "Automation Solutions",
      email: "ops@brakes.example",
      notes: "Asked for a productivity upgrade discussion.",
      status: "New"
    },
    {
      name: "Whirlpool Plant Team",
      source: "Referral",
      service_interest: "Testing Systems",
      email: "plant@whirlpool.example",
      notes: "Interested in traceability and data logging.",
      status: "Qualified"
    }
  ],
  bookings: [
    {
      client: "Bosch India",
      date: "2026-04-20",
      time: "11:00",
      booking_type: "Demo",
      owner: "Sales Team",
      status: "Scheduled"
    },
    {
      client: "Saint-Gobain",
      date: "2026-04-22",
      time: "15:30",
      booking_type: "Site Visit",
      owner: "Engineering Team",
      status: "Scheduled"
    }
  ],
  gallery: [
    {
      title: "Automation Cell",
      media_type: "image",
      file_url: "assets/logo-posh-automats.jpg",
      caption: "Replace this with a real project image URL after setup.",
      theme_label: "Automation",
      sort_order: 1,
      is_active: true
    },
    {
      title: "SPM Demo Reel",
      media_type: "video",
      file_url: "https://example.com/demo-machine.mp4",
      caption: "Replace this with a real MP4 or WebM URL.",
      theme_label: "Media",
      sort_order: 2,
      is_active: true
    }
  ],
  testimonials: [
    {
      name: "Plant Operations Lead",
      role: "Automotive Supplier",
      quote_text: "The team approached automation practically and helped us reduce manual intervention.",
      sort_order: 1,
      is_active: true
    },
    {
      name: "Production Manager",
      role: "Assembly Unit",
      quote_text: "Clear engineering support, dependable delivery, and better production confidence.",
      sort_order: 2,
      is_active: true
    }
  ]
};

const authShell = document.querySelector("[data-auth-shell]");
const authForm = document.querySelector("[data-auth-form]");
const authMessage = document.querySelector("[data-auth-message]");
const adminApp = document.querySelector("[data-admin-app]");
const adminUser = document.querySelector("[data-admin-user]");
const logoutButton = document.querySelector("[data-logout-button]");
const saveStatus = document.querySelector("[data-save-status]");
const schemaBanner = document.querySelector("[data-schema-banner]");
const overviewMetrics = document.querySelector("[data-overview-metrics]");
const recentLeads = document.querySelector("[data-recent-leads]");
const upcomingBookings = document.querySelector("[data-upcoming-bookings]");
const contentForm = document.querySelector("[data-content-form]");
const contentPreview = document.querySelector("[data-content-preview]");
const serviceForm = document.querySelector("[data-service-form]");
const servicesList = document.querySelector("[data-services-list]");
const serviceCount = document.querySelector("[data-service-count]");
const leadsTable = document.querySelector("[data-leads-table]");
const leadForm = document.querySelector("[data-lead-form]");
const bookingForm = document.querySelector("[data-booking-form]");
const bookingsList = document.querySelector("[data-bookings-list]");
const galleryForm = document.querySelector("[data-gallery-form]");
const galleryList = document.querySelector("[data-gallery-list]");
const testimonialForm = document.querySelector("[data-testimonial-form]");
const testimonialsList = document.querySelector("[data-testimonials-list]");
const statusChart = document.querySelector("[data-status-chart]");
const sourceChart = document.querySelector("[data-source-chart]");
const categoryChart = document.querySelector("[data-category-chart]");
const performanceSummary = document.querySelector("[data-performance-summary]");
const exportButton = document.querySelector("[data-export-dashboard]");
const resetButton = document.querySelector("[data-reset-dashboard]");
const serviceCancelButton = document.querySelector("[data-service-cancel]");
const galleryFileInput = document.querySelector('input[name="fileUpload"]');

const GALLERY_STORAGE_BUCKET = "gallery-media";

let state = {
  settings: { ...SITE_SETTINGS_DEFAULTS },
  services: [],
  leads: [],
  bookings: [],
  gallery: [],
  testimonials: []
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function setStatus(message, isError = false) {
  if (!saveStatus) return;
  saveStatus.textContent = message;
  saveStatus.style.color = isError ? "#b91c1c" : "";
}

function setSchemaBanner(message, tone = "neutral") {
  if (!schemaBanner) return;
  schemaBanner.textContent = message;
  schemaBanner.dataset.tone = tone;
}

function setAuthMessage(message, isError = false) {
  if (!authMessage) return;
  authMessage.textContent = message;
  authMessage.style.color = isError ? "#b91c1c" : "";
}

function formatDate(dateString) {
  if (!dateString) return "No date";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
}

function formatDateTime(dateString, timeString) {
  if (!dateString) return "No schedule";
  return `${formatDate(dateString)}${timeString ? ` at ${timeString}` : ""}`;
}

function countBy(items, key) {
  return items.reduce((accumulator, item) => {
    const label = item[key] || "Unknown";
    accumulator[label] = (accumulator[label] || 0) + 1;
    return accumulator;
  }, {});
}

function statusClass(status) {
  return String(status || "neutral").toLowerCase().replaceAll(/[^a-z0-9]+/g, "-");
}

function resetServiceForm() {
  if (!serviceForm) return;
  serviceForm.reset();
  const hiddenId = serviceForm.elements.namedItem("serviceId");
  if (hiddenId) hiddenId.value = "";
}

async function uploadGalleryAsset(file, mediaType) {
  if (!supabase) throw new Error(getMissingConfigMessage());

  const safeName = file.name.replaceAll(/[^a-zA-Z0-9._-]+/g, "-");
  const filePath = `gallery/${Date.now()}-${safeName}`;
  const { error: uploadError } = await supabase.storage
    .from(GALLERY_STORAGE_BUCKET)
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from(GALLERY_STORAGE_BUCKET).getPublicUrl(filePath);
  return data.publicUrl || "";
}

function showAuthenticatedView(session) {
  if (authShell) authShell.hidden = true;
  if (adminApp) adminApp.hidden = false;
  if (adminUser) adminUser.textContent = session?.user?.email || "Signed in";

  window.requestAnimationFrame(() => {
    adminApp?.scrollIntoView({ behavior: "smooth", block: "start" });
    adminApp?.classList.add("is-highlighted");
    window.setTimeout(() => {
      adminApp?.classList.remove("is-highlighted");
    }, 1800);
  });
}

function showLoggedOutView(message = "") {
  if (authShell) authShell.hidden = false;
  if (adminApp) adminApp.hidden = true;
  setAuthMessage(message, Boolean(message));
}

async function fetchTable(table, orderColumn = "created_at") {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .order(orderColumn, { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

async function loadDashboardData() {
  if (!supabase) return;

  setStatus("Loading live data...");

  const [settings, services, leads, bookings, gallery, testimonials] = await Promise.all([
    fetchSiteSettings(),
    fetchTable("services", "sort_order"),
    supabase.from("leads").select("*").order("created_at", { ascending: false }).then(({ data, error }) => {
      if (error) throw error;
      return data || [];
    }),
    fetchTable("bookings", "date"),
    fetchTable("gallery_items", "sort_order"),
    fetchTable("testimonials", "sort_order")
  ]);

  state = { settings, services, leads, bookings, gallery, testimonials };
  renderAll();
  setStatus("Connected to Supabase.");
}

async function checkSchemaAvailability() {
  if (!supabase) return;

  const { error } = await supabase.from("site_settings").select("setting_key").limit(1);

  if (!error) {
    setSchemaBanner("Supabase schema is live and reachable.", "success");
    return;
  }

  if (error.code === "PGRST205") {
    setSchemaBanner("Supabase is reachable, but the schema is not deployed yet.", "warning");
    setStatus("Supabase is reachable, but the schema is not deployed yet.", true);
    return;
  }

  setSchemaBanner("Supabase schema check failed.", "error");
  setStatus(error.message || "Supabase connection check failed.", true);
}

function renderMetricCards() {
  if (!overviewMetrics) return;

  const scheduledBookings = state.bookings.filter((item) => item.status === "Scheduled").length;
  const qualifiedLeads = state.leads.filter((item) => item.status === "Qualified").length;

  const metrics = [
    { label: "Services", value: state.services.length, hint: "Active offerings" },
    { label: "Leads", value: state.leads.length, hint: `${qualifiedLeads} qualified` },
    { label: "Bookings", value: state.bookings.length, hint: `${scheduledBookings} scheduled` },
    { label: "Gallery Items", value: state.gallery.length, hint: `${state.testimonials.length} testimonials` }
  ];

  overviewMetrics.innerHTML = metrics
    .map(
      (item) => `
        <article class="admin-metric-card">
          <strong>${escapeHtml(item.value)}</strong>
          <span>${escapeHtml(item.label)}</span>
          <p>${escapeHtml(item.hint)}</p>
        </article>
      `
    )
    .join("");
}

function renderRecentLeads() {
  if (!recentLeads) return;

  const items = [...state.leads].slice(0, 4);
  if (!items.length) {
    recentLeads.innerHTML = '<p class="admin-empty">No leads yet.</p>';
    return;
  }

  recentLeads.innerHTML = items
    .map(
      (item) => `
        <article class="admin-activity-item">
          <div>
            <strong>${escapeHtml(item.name)}</strong>
            <p>${escapeHtml(item.service_interest || "General enquiry")}</p>
          </div>
          <div class="admin-activity-meta">
            <span class="admin-badge ${statusClass(item.status)}">${escapeHtml(item.status)}</span>
            <small>${escapeHtml(formatDate(item.created_at))}</small>
          </div>
        </article>
      `
    )
    .join("");
}

function renderUpcomingBookings() {
  if (!upcomingBookings) return;

  const items = [...state.bookings]
    .sort((left, right) => `${left.date} ${left.time}`.localeCompare(`${right.date} ${right.time}`))
    .slice(0, 4);

  if (!items.length) {
    upcomingBookings.innerHTML = '<p class="admin-empty">No bookings scheduled.</p>';
    return;
  }

  upcomingBookings.innerHTML = items
    .map(
      (item) => `
        <article class="admin-activity-item">
          <div>
            <strong>${escapeHtml(item.client)}</strong>
            <p>${escapeHtml(item.booking_type)} with ${escapeHtml(item.owner || "Unassigned")}</p>
          </div>
          <div class="admin-activity-meta">
            <span class="admin-badge ${statusClass(item.status)}">${escapeHtml(item.status)}</span>
            <small>${escapeHtml(formatDateTime(item.date, item.time))}</small>
          </div>
        </article>
      `
    )
    .join("");
}

function fillContentForm() {
  if (!contentForm) return;

  Object.entries(state.settings).forEach(([key, value]) => {
    const field = contentForm.elements.namedItem(key);
    if (field) field.value = value;
  });
}

function renderContentPreview() {
  if (!contentPreview) return;

  contentPreview.innerHTML = `
    <article class="admin-preview-card">
      <strong>${escapeHtml(state.settings.companyName)}</strong>
      <p>${escapeHtml(state.settings.contactEmail)}</p>
    </article>
    <article class="admin-preview-card">
      <strong>Homepage hero</strong>
      <p>${escapeHtml(state.settings.heroTitle)}</p>
      <small>${escapeHtml(state.settings.heroLead)}</small>
    </article>
    <article class="admin-preview-card">
      <strong>About snippet</strong>
      <p>${escapeHtml(state.settings.aboutSnippet)}</p>
    </article>
    <article class="admin-preview-card">
      <strong>CTA</strong>
      <p>${escapeHtml(state.settings.ctaTitle)}</p>
      <small>${escapeHtml(state.settings.ctaText)}</small>
    </article>
  `;
}

function renderServices() {
  if (!servicesList || !serviceCount) return;

  serviceCount.textContent = `${state.services.length} items`;

  if (!state.services.length) {
    servicesList.innerHTML = '<p class="admin-empty">No services added yet.</p>';
    return;
  }

  servicesList.innerHTML = state.services
    .map(
      (item) => `
        <article class="admin-list-card">
          <div class="admin-list-content">
            <div class="admin-panel-heading">
              <h4>${escapeHtml(item.title)}</h4>
              <span class="admin-badge neutral">${escapeHtml(item.category)}</span>
            </div>
            <p>${escapeHtml(item.description)}</p>
            <small>${escapeHtml(item.price || "No price set")}</small>
          </div>
          <div class="admin-list-actions">
            <button class="button button-secondary" type="button" data-edit-service="${escapeHtml(item.id)}">Edit</button>
            <button class="button button-secondary" type="button" data-delete-service="${escapeHtml(item.id)}">Delete</button>
          </div>
        </article>
      `
    )
    .join("");
}

function renderLeads() {
  if (!leadsTable) return;

  if (!state.leads.length) {
    leadsTable.innerHTML = '<tr><td colspan="5" class="admin-empty-cell">No leads recorded yet.</td></tr>';
    return;
  }

  leadsTable.innerHTML = state.leads
    .map(
      (item) => `
        <tr>
          <td>
            <strong>${escapeHtml(item.name)}</strong>
            <div class="admin-table-sub">${escapeHtml(item.email || "No email")}</div>
          </td>
          <td>${escapeHtml(item.source)}</td>
          <td>${escapeHtml(item.service_interest || "General enquiry")}</td>
          <td>
            <select data-lead-status="${escapeHtml(item.id)}">
              ${["New", "Qualified", "Follow-up", "Closed"].map((status) => `<option value="${status}" ${item.status === status ? "selected" : ""}>${status}</option>`).join("")}
            </select>
          </td>
          <td>
            <button class="button button-secondary" type="button" data-delete-lead="${escapeHtml(item.id)}">Delete</button>
          </td>
        </tr>
      `
    )
    .join("");
}

function renderBookings() {
  if (!bookingsList) return;

  if (!state.bookings.length) {
    bookingsList.innerHTML = '<p class="admin-empty">No bookings added yet.</p>';
    return;
  }

  bookingsList.innerHTML = state.bookings
    .map(
      (item) => `
        <article class="admin-list-card">
          <div class="admin-list-content">
            <div class="admin-panel-heading">
              <h4>${escapeHtml(item.client)}</h4>
              <span class="admin-badge ${statusClass(item.status)}">${escapeHtml(item.status)}</span>
            </div>
            <p>${escapeHtml(item.booking_type)} on ${escapeHtml(formatDateTime(item.date, item.time))}</p>
            <small>Owner: ${escapeHtml(item.owner || "Unassigned")}</small>
          </div>
          <div class="admin-inline-controls">
            <select data-booking-status="${escapeHtml(item.id)}">
              ${["Scheduled", "Completed", "Rescheduled", "Cancelled"].map((status) => `<option value="${status}" ${item.status === status ? "selected" : ""}>${status}</option>`).join("")}
            </select>
            <button class="button button-secondary" type="button" data-delete-booking="${escapeHtml(item.id)}">Delete</button>
          </div>
        </article>
      `
    )
    .join("");
}

function renderGallery() {
  if (!galleryList) return;

  if (!state.gallery.length) {
    galleryList.innerHTML = '<p class="admin-empty">No gallery items yet.</p>';
    return;
  }

  galleryList.innerHTML = state.gallery
    .map(
      (item) => `
        <article class="admin-list-card">
          <div class="admin-list-content">
            <div class="admin-panel-heading">
              <h4>${escapeHtml(item.title)}</h4>
              <span class="admin-badge neutral">${escapeHtml(item.media_type)}</span>
            </div>
            <p>${escapeHtml(item.caption || "No caption added")}</p>
            <small>${escapeHtml(item.file_url)}</small>
          </div>
          <div class="admin-list-actions">
            <button class="button button-secondary" type="button" data-delete-gallery="${escapeHtml(item.id)}">Delete</button>
          </div>
        </article>
      `
    )
    .join("");
}

function renderTestimonials() {
  if (!testimonialsList) return;

  if (!state.testimonials.length) {
    testimonialsList.innerHTML = '<p class="admin-empty">No testimonials yet.</p>';
    return;
  }

  testimonialsList.innerHTML = state.testimonials
    .map(
      (item) => `
        <article class="admin-list-card">
          <div class="admin-list-content">
            <div class="admin-panel-heading">
              <h4>${escapeHtml(item.name)}</h4>
              <span class="admin-badge neutral">${escapeHtml(item.role || "Client")}</span>
            </div>
            <p>${escapeHtml(item.quote_text)}</p>
          </div>
          <div class="admin-list-actions">
            <button class="button button-secondary" type="button" data-delete-testimonial="${escapeHtml(item.id)}">Delete</button>
          </div>
        </article>
      `
    )
    .join("");
}

function renderBars(target, counts) {
  if (!target) return;
  const entries = Object.entries(counts);

  if (!entries.length) {
    target.innerHTML = '<p class="admin-empty">No data yet.</p>';
    return;
  }

  const max = Math.max(...entries.map(([, value]) => value), 1);

  target.innerHTML = entries
    .map(
      ([label, value]) => `
        <div class="admin-bar-row">
          <div class="admin-bar-label">
            <strong>${escapeHtml(label)}</strong>
            <span>${escapeHtml(value)}</span>
          </div>
          <div class="admin-bar-track">
            <div class="admin-bar-fill" style="width:${(value / max) * 100}%"></div>
          </div>
        </div>
      `
    )
    .join("");
}

function renderAnalytics() {
  renderBars(statusChart, countBy(state.leads, "status"));
  renderBars(sourceChart, countBy(state.leads, "source"));
  renderBars(categoryChart, countBy(state.services, "category"));

  if (!performanceSummary) return;

  const qualified = state.leads.filter((item) => item.status === "Qualified").length;
  const closed = state.leads.filter((item) => item.status === "Closed").length;
  const scheduled = state.bookings.filter((item) => item.status === "Scheduled").length;
  const conversion = state.leads.length ? Math.round((closed / state.leads.length) * 100) : 0;

  performanceSummary.innerHTML = `
    <article class="admin-summary-card">
      <strong>${state.leads.length}</strong>
      <p>Total leads in the dashboard</p>
    </article>
    <article class="admin-summary-card">
      <strong>${qualified}</strong>
      <p>Qualified opportunities</p>
    </article>
    <article class="admin-summary-card">
      <strong>${scheduled}</strong>
      <p>Scheduled bookings</p>
    </article>
    <article class="admin-summary-card">
      <strong>${conversion}%</strong>
      <p>Closed lead conversion</p>
    </article>
  `;
}

function renderAll() {
  fillContentForm();
  renderContentPreview();
  renderMetricCards();
  renderRecentLeads();
  renderUpcomingBookings();
  renderServices();
  renderLeads();
  renderBookings();
  renderGallery();
  renderTestimonials();
  renderAnalytics();
}

async function withErrorHandling(action, successMessage) {
  try {
    await action();
    if (successMessage) setStatus(successMessage);
    await loadDashboardData();
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Something went wrong.", true);
  }
}

if (authForm) {
  authForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!isSupabaseConfigured || !supabase) {
      setAuthMessage(getMissingConfigMessage(), true);
      return;
    }

    const formData = new FormData(authForm);
    setAuthMessage("Signing in...");

    const { error } = await supabase.auth.signInWithPassword({
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || "")
    });

    if (error) {
      setAuthMessage(error.message, true);
      return;
    }

    setAuthMessage("Signed in successfully. Loading dashboard...");
  });
}

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  });
}

if (contentForm) {
  contentForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(contentForm);

    const nextSettings = {
      companyName: String(formData.get("companyName") || ""),
      contactEmail: String(formData.get("contactEmail") || ""),
      heroTitle: String(formData.get("heroTitle") || ""),
      heroLead: String(formData.get("heroLead") || ""),
      aboutSnippet: String(formData.get("aboutSnippet") || ""),
      ctaTitle: String(formData.get("ctaTitle") || ""),
      ctaText: String(formData.get("ctaText") || "")
    };

    await withErrorHandling(async () => {
      await upsertSiteSettings(nextSettings);
    }, "Website content saved.");
  });
}

if (serviceForm) {
  serviceForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(serviceForm);
    const serviceId = String(formData.get("serviceId") || "");
    const payload = {
      title: String(formData.get("title") || "").trim(),
      category: String(formData.get("category") || "").trim(),
      price: String(formData.get("price") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      sort_order: Number(formData.get("sortOrder") || state.services.length + 1),
      is_active: true
    };

    await withErrorHandling(async () => {
      if (serviceId) {
        const { error } = await supabase.from("services").update(payload).eq("id", serviceId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("services").insert(payload);
        if (error) throw error;
      }
      resetServiceForm();
    }, serviceId ? "Service updated." : "Service added.");
  });
}

if (serviceCancelButton) {
  serviceCancelButton.addEventListener("click", () => {
    resetServiceForm();
    setStatus("Service edit cancelled.");
  });
}

if (servicesList) {
  servicesList.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const editId = target.getAttribute("data-edit-service");
    const deleteId = target.getAttribute("data-delete-service");

    if (editId && serviceForm) {
      const item = state.services.find((service) => service.id === editId);
      if (!item) return;

      serviceForm.elements.namedItem("serviceId").value = item.id;
      serviceForm.elements.namedItem("title").value = item.title;
      serviceForm.elements.namedItem("category").value = item.category;
      serviceForm.elements.namedItem("price").value = item.price || "";
      serviceForm.elements.namedItem("description").value = item.description;
      serviceForm.elements.namedItem("sortOrder").value = item.sort_order || "";
      serviceForm.scrollIntoView({ behavior: "smooth", block: "start" });
      setStatus(`Editing ${item.title}`);
    }

    if (deleteId) {
      await withErrorHandling(async () => {
        const { error } = await supabase.from("services").delete().eq("id", deleteId);
        if (error) throw error;
        resetServiceForm();
      }, "Service deleted.");
    }
  });
}

if (leadForm) {
  leadForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(leadForm);

    await withErrorHandling(async () => {
      const { error } = await supabase.from("leads").insert({
        name: String(formData.get("name") || "").trim(),
        source: String(formData.get("source") || "Website"),
        service_interest: String(formData.get("serviceInterest") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        notes: String(formData.get("notes") || "").trim(),
        status: "New"
      });

      if (error) throw error;
      leadForm.reset();
    }, "Lead added.");
  });
}

if (leadsTable) {
  leadsTable.addEventListener("change", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;

    const leadId = target.getAttribute("data-lead-status");
    if (!leadId) return;

    await withErrorHandling(async () => {
      const { error } = await supabase
        .from("leads")
        .update({ status: target.value })
        .eq("id", leadId);

      if (error) throw error;
    }, "Lead status updated.");
  });

  leadsTable.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const deleteId = target.getAttribute("data-delete-lead");
    if (!deleteId) return;

    await withErrorHandling(async () => {
      const { error } = await supabase.from("leads").delete().eq("id", deleteId);
      if (error) throw error;
    }, "Lead deleted.");
  });
}

if (bookingForm) {
  bookingForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(bookingForm);

    await withErrorHandling(async () => {
      const { error } = await supabase.from("bookings").insert({
        client: String(formData.get("client") || "").trim(),
        date: String(formData.get("date") || ""),
        time: String(formData.get("time") || ""),
        booking_type: String(formData.get("bookingType") || "Call"),
        owner: String(formData.get("owner") || "").trim(),
        status: "Scheduled"
      });

      if (error) throw error;
      bookingForm.reset();
    }, "Booking added.");
  });
}

if (bookingsList) {
  bookingsList.addEventListener("change", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;

    const bookingId = target.getAttribute("data-booking-status");
    if (!bookingId) return;

    await withErrorHandling(async () => {
      const { error } = await supabase
        .from("bookings")
        .update({ status: target.value })
        .eq("id", bookingId);

      if (error) throw error;
    }, "Booking status updated.");
  });

  bookingsList.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const deleteId = target.getAttribute("data-delete-booking");
    if (!deleteId) return;

    await withErrorHandling(async () => {
      const { error } = await supabase.from("bookings").delete().eq("id", deleteId);
      if (error) throw error;
    }, "Booking deleted.");
  });
}

if (galleryForm) {
  galleryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(galleryForm);
    const uploadedFile = formData.get("fileUpload");
    let fileUrl = String(formData.get("fileUrl") || "").trim();

    if (uploadedFile instanceof File && uploadedFile.size > 0) {
      fileUrl = await uploadGalleryAsset(uploadedFile, String(formData.get("mediaType") || "image"));
    }

    await withErrorHandling(async () => {
      const { error } = await supabase.from("gallery_items").insert({
        title: String(formData.get("title") || "").trim(),
        media_type: String(formData.get("mediaType") || "image"),
        file_url: fileUrl,
        caption: String(formData.get("caption") || "").trim(),
        theme_label: String(formData.get("themeLabel") || "").trim() || "Media",
        sort_order: state.gallery.length + 1,
        is_active: true
      });

      if (error) throw error;
      galleryForm.reset();
      if (galleryFileInput instanceof HTMLInputElement) {
        galleryFileInput.value = "";
      }
    }, "Gallery item added.");
  });
}

if (galleryList) {
  galleryList.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const deleteId = target.getAttribute("data-delete-gallery");
    if (!deleteId) return;

    await withErrorHandling(async () => {
      const { error } = await supabase.from("gallery_items").delete().eq("id", deleteId);
      if (error) throw error;
    }, "Gallery item deleted.");
  });
}

if (testimonialForm) {
  testimonialForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(testimonialForm);

    await withErrorHandling(async () => {
      const { error } = await supabase.from("testimonials").insert({
        name: String(formData.get("name") || "").trim(),
        role: String(formData.get("role") || "").trim(),
        quote_text: String(formData.get("quote") || "").trim(),
        sort_order: state.testimonials.length + 1,
        is_active: true
      });

      if (error) throw error;
      testimonialForm.reset();
    }, "Testimonial added.");
  });
}

if (testimonialsList) {
  testimonialsList.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const deleteId = target.getAttribute("data-delete-testimonial");
    if (!deleteId) return;

    await withErrorHandling(async () => {
      const { error } = await supabase.from("testimonials").delete().eq("id", deleteId);
      if (error) throw error;
    }, "Testimonial deleted.");
  });
}

if (exportButton) {
  exportButton.addEventListener("click", () => {
    const snapshot = {
      exportedAt: new Date().toISOString(),
      ...state
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "posh-supabase-dashboard-export.json";
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Dashboard snapshot exported.");
  });
}

if (resetButton) {
  resetButton.addEventListener("click", async () => {
    await withErrorHandling(async () => {
      await upsertSiteSettings(SITE_SETTINGS_DEFAULTS);

      const deletions = await Promise.all([
        supabase.from("services").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
        supabase.from("leads").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
        supabase.from("bookings").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
        supabase.from("gallery_items").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
        supabase.from("testimonials").delete().neq("id", "00000000-0000-0000-0000-000000000000")
      ]);

      const deletionError = deletions.find((result) => result.error)?.error;
      if (deletionError) throw deletionError;

      const inserts = await Promise.all([
        supabase.from("services").insert(seedData.services),
        supabase.from("leads").insert(seedData.leads),
        supabase.from("bookings").insert(seedData.bookings),
        supabase.from("gallery_items").insert(seedData.gallery),
        supabase.from("testimonials").insert(seedData.testimonials)
      ]);

      const insertError = inserts.find((result) => result.error)?.error;
      if (insertError) throw insertError;

      resetServiceForm();
      if (leadForm) leadForm.reset();
      if (bookingForm) bookingForm.reset();
      if (galleryForm) galleryForm.reset();
      if (testimonialForm) testimonialForm.reset();
    }, "Seed data restored.");
  });
}

async function initializeAdmin() {
  if (!isSupabaseConfigured || !supabase) {
    showLoggedOutView(getMissingConfigMessage());
    return;
  }

  await checkSchemaAvailability();

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    showLoggedOutView(error.message);
    return;
  }

  if (data.session) {
    showAuthenticatedView(data.session);
    setAuthMessage("Signed in successfully. Loading dashboard...");
    await loadDashboardData();
  } else {
    showLoggedOutView("");
  }

  supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session) {
      showAuthenticatedView(session);
      setAuthMessage("");
      await loadDashboardData();
    } else {
      showLoggedOutView("");
    }
  });
}

initializeAdmin();
