const menuButton = document.querySelector("[data-menu-button]");
const mobileNav = document.querySelector("[data-mobile-nav]");
const ownerWhatsappNumber = "919786055500";
const ownerWhatsappMessage = encodeURIComponent(
  "Hello Posh Automats, I would like to discuss a manufacturing requirement."
);

function setMenuOpen(isOpen) {
  if (!menuButton || !mobileNav) return;
  mobileNav.classList.toggle("open", isOpen);
  menuButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
  menuButton.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
}

if (menuButton && mobileNav) {
  menuButton.addEventListener("click", () => {
    setMenuOpen(!mobileNav.classList.contains("open"));
  });

  mobileNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenuOpen(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setMenuOpen(false);
    }
  });
}

const contactForm = document.querySelector("[data-contact-form]");
if (contactForm) {
  const submitBtn = contactForm.querySelector('button[type="submit"]');

  contactForm.addEventListener("submit", () => {
    if (!submitBtn || submitBtn.disabled) return;
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";
  });
}

function injectWhatsAppButton() {
  if (document.querySelector("[data-whatsapp-fab]")) return;

  const button = document.createElement("a");
  button.className = "whatsapp-fab";
  button.href = `https://wa.me/${ownerWhatsappNumber}?text=${ownerWhatsappMessage}`;
  button.target = "_blank";
  button.rel = "noreferrer";
  button.setAttribute("aria-label", "Chat with Posh Automats on WhatsApp");
  button.dataset.whatsappFab = "true";
  button.innerHTML = `
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M19.11 17.2c-.29-.14-1.73-.85-2-.94-.27-.1-.47-.14-.67.14-.2.29-.77.94-.95 1.13-.17.2-.35.22-.64.07-.29-.14-1.23-.45-2.33-1.43-.85-.76-1.43-1.69-1.6-1.98-.17-.29-.02-.45.13-.6.13-.13.29-.35.43-.52.14-.17.19-.29.29-.49.1-.2.05-.38-.02-.53-.07-.14-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.58c-.2 0-.53.07-.8.38-.27.29-1.03 1-1.03 2.44s1.05 2.82 1.2 3.01c.14.2 2.09 3.19 5.05 4.47.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.73-.71 1.97-1.4.24-.69.24-1.28.17-1.4-.07-.12-.26-.2-.55-.34z"/>
      <path fill="currentColor" d="M26.79 5.21A13.86 13.86 0 0 0 16.03 0C8.32 0 2.06 6.26 2.06 13.97c0 2.46.64 4.86 1.86 6.98L2 32l11.27-1.87a13.89 13.89 0 0 0 6.66 1.7h.01c7.71 0 13.97-6.26 13.97-13.97 0-3.74-1.46-7.25-4.12-10.15zM19.94 28.03h-.01a11.53 11.53 0 0 1-5.88-1.6l-.42-.25-6.69 1.11 1.13-6.52-.28-.43a11.57 11.57 0 0 1-1.77-6.17c0-6.39 5.2-11.59 11.59-11.59 3.1 0 6.01 1.21 8.2 3.4a11.52 11.52 0 0 1 3.39 8.2c0 6.39-5.2 11.59-11.59 11.59z"/>
    </svg>
    <span>WhatsApp</span>
  `;

  document.body.appendChild(button);
}

injectWhatsAppButton();

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

function observeRevealItems(scope = document) {
  scope.querySelectorAll(".reveal").forEach((item) => {
    if (!item.classList.contains("is-visible")) {
      revealObserver.observe(item);
    }
  });
}

observeRevealItems();
window.CodexSiteRefreshReveal = observeRevealItems;

const galleryModal = document.querySelector("[data-gallery-modal]");
const galleryMedia = document.querySelector("[data-gallery-media]");
const galleryDescription = document.querySelector("[data-gallery-description]");
const galleryTitle = document.querySelector("#gallery-modal-title");
let activeGalleryTrigger = null;

function clearGalleryMedia() {
  if (!galleryMedia) return;
  galleryMedia.innerHTML = "";
}

function createGalleryImage(src, title) {
  const image = document.createElement("img");
  image.src = src;
  image.alt = title;
  image.loading = "eager";
  image.decoding = "async";
  return image;
}

function createGalleryVideo(src, poster, title) {
  if (!src) {
    const fragment = document.createDocumentFragment();

    if (poster) {
      fragment.append(createGalleryImage(poster, title));
    }

    const note = document.createElement("div");
    note.className = "gallery-modal-note";

    const titleLine = document.createElement("p");
    titleLine.textContent = title;

    const messageLine = document.createElement("p");
    messageLine.textContent = "Add a real MP4 or WebM file path to this card to play it here.";

    note.append(titleLine, messageLine);
    fragment.append(note);
    return fragment;
  }

  const video = document.createElement("video");
  video.src = src;
  video.controls = true;
  video.autoplay = true;
  video.playsInline = true;
  if (poster) {
    video.poster = poster;
  }
  return video;
}

function openGalleryItem(item) {
  if (!galleryModal || !galleryMedia || !galleryDescription || !galleryTitle) return;

  const mediaType = item.dataset.mediaType || "image";
  const mediaSrc = item.dataset.mediaSrc || "";
  const mediaPoster = item.dataset.mediaPoster || "";
  const mediaTitle = item.dataset.mediaTitle || "Gallery Preview";
  const mediaText = item.dataset.mediaDescription || "";

  activeGalleryTrigger = item;
  clearGalleryMedia();

  const mediaElement =
    mediaType === "video"
      ? createGalleryVideo(mediaSrc, mediaPoster, mediaTitle)
      : createGalleryImage(mediaSrc, mediaTitle);

  galleryMedia.append(mediaElement);
  galleryTitle.textContent = mediaTitle;
  galleryDescription.textContent = mediaText;
  galleryModal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeGalleryModal() {
  if (!galleryModal || galleryModal.hidden) return;

  const playingVideo = galleryMedia ? galleryMedia.querySelector("video") : null;
  if (playingVideo) {
    playingVideo.pause();
    playingVideo.currentTime = 0;
  }

  galleryModal.hidden = true;
  document.body.style.overflow = "";
  clearGalleryMedia();

  if (activeGalleryTrigger) {
    activeGalleryTrigger.focus();
    activeGalleryTrigger = null;
  }
}

document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-gallery-item]");
  if (trigger instanceof HTMLElement) {
    openGalleryItem(trigger);
    return;
  }

  const closeControl = event.target.closest("[data-gallery-close]");
  if (closeControl instanceof HTMLElement) {
    closeGalleryModal();
  }
});

if (galleryModal) {
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeGalleryModal();
    }
  });
}
