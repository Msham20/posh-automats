import {
  fetchPublicGalleryItems,
  fetchPublicServices,
  fetchPublicTestimonials,
  fetchSiteSettings,
  isSupabaseConfigured,
  supabase
} from "./supabase-client.js";

function setText(selector, value) {
  document.querySelectorAll(selector).forEach((node) => {
    node.textContent = value;
  });
}

function setHtml(selector, value) {
  document.querySelectorAll(selector).forEach((node) => {
    node.innerHTML = value;
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function createGalleryBackground(url) {
  return `linear-gradient(180deg, rgba(10, 18, 32, 0.14) 0%, rgba(10, 18, 32, 0.8) 100%), url('${String(url).replaceAll("'", "\\'")}') center/cover no-repeat`;
}

async function hydrateHomePage() {
  const servicesGrid = document.querySelector("[data-services-grid]");
  if (!servicesGrid) return;

  try {
    const [settings, services] = await Promise.all([
      fetchSiteSettings(),
      fetchPublicServices()
    ]);

    setText("[data-company-name]", settings.companyName);
    setText("[data-contact-email]", settings.contactEmail);
    setText("[data-hero-title]", settings.heroTitle);
    setText("[data-about-snippet]", settings.aboutSnippet);
    setText("[data-cta-title]", settings.ctaTitle);

    setHtml("[data-hero-lead]", escapeHtml(settings.heroLead));
    setHtml("[data-cta-text]", escapeHtml(settings.ctaText));

    if (services.length) {
      servicesGrid.innerHTML = services
        .map(
          (service) => `
            <article class="card reveal">
              <div class="icon-chip">${escapeHtml((service.category || "S").slice(0, 1).toUpperCase())}</div>
              <h3>${escapeHtml(service.title)}</h3>
              <p>${escapeHtml(service.description)}</p>
              <div class="tag-row">
                <span class="tag">${escapeHtml(service.category || "Service")}</span>
                <span class="tag">${escapeHtml(service.price || "Custom quote")}</span>
              </div>
            </article>
          `
        )
        .join("");

      window.CodexSiteRefreshReveal?.(servicesGrid);
    }
  } catch (error) {
    console.error(error);
  }
}

async function hydrateGalleryPage() {
  const galleryGrid = document.querySelector("[data-gallery-grid]");
  if (!galleryGrid) return;

  try {
    const items = await fetchPublicGalleryItems();
    if (!items.length) return;

    galleryGrid.innerHTML = items
      .map(
        (item) => `
          <button
            class="gallery-card reveal"
            type="button"
            data-gallery-item
            data-media-type="${escapeHtml(item.media_type)}"
            data-media-src="${escapeHtml(item.file_url)}"
            data-media-poster=""
            data-media-title="${escapeHtml(item.title)}"
            data-media-description="${escapeHtml(item.caption || "")}"
            style="--gallery-image:${createGalleryBackground(item.file_url)};"
          >
            <span class="gallery-card-content">
              <span class="gallery-chip">${escapeHtml(item.theme_label || "Media")}</span>
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.caption || "Click to preview this media item.")}</p>
            </span>
          </button>
        `
      )
      .join("");

    window.CodexSiteRefreshReveal?.(galleryGrid);
  } catch (error) {
    console.error(error);
  }
}

async function hydrateTestimonials() {
  const testimonialsGrid = document.querySelector("[data-testimonials-grid]");
  if (!testimonialsGrid) return;

  try {
    const testimonials = await fetchPublicTestimonials();
    if (!testimonials.length) return;

    testimonialsGrid.innerHTML = testimonials
      .map(
        (item) => `
          <article class="quote-card reveal">
            <h3>${escapeHtml(item.name)}</h3>
            <p>${escapeHtml(item.quote_text)}</p>
            <div class="tag-row">
              <span class="tag">${escapeHtml(item.role || "Client")}</span>
            </div>
          </article>
        `
      )
      .join("");

    window.CodexSiteRefreshReveal?.(testimonialsGrid);
  } catch (error) {
    console.error(error);
  }
}

async function wireContactForm() {
  const form = document.querySelector("[data-contact-form]");
  const status = document.querySelector("[data-contact-status]");
  if (!form || !isSupabaseConfigured || !supabase) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);

    if (status) {
      status.textContent = "Sending enquiry...";
      status.style.color = "";
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
    }

    const { error } = await supabase.from("leads").insert({
      name: String(formData.get("Name") || "").trim(),
      email: String(formData.get("Email") || "").trim(),
      service_interest: String(formData.get("Subject") || "").trim(),
      notes: String(formData.get("Message") || "").trim(),
      source: "Website",
      status: "New"
    });

    if (error) {
      console.error(error);
      if (status) {
        status.textContent = error.message || "Failed to submit enquiry.";
        status.style.color = "#b91c1c";
      }
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Send Message";
      }
      return;
    }

    form.reset();
    if (status) {
      status.textContent = "Enquiry submitted successfully.";
      status.style.color = "#15803d";
    }
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Send Message";
    }
  });
}

if (isSupabaseConfigured) {
  hydrateHomePage();
  hydrateGalleryPage();
  hydrateTestimonials();
  wireContactForm();
}
