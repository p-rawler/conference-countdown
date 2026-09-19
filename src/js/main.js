(function () {
  "use strict";

  const template = window.EVENT_TEMPLATE || {};
  const events = template.events || {};
  const defaultEventSlug = template.defaultEventSlug;
  const app = document.getElementById("app");

  const SECOND = 1000;
  const MINUTE = 60 * SECOND;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;

  let clockOffset = 0;
  let lastA11yMinute = null;
  let lastPhase = null;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    const slug = resolveEventSlug();
    const event = events[slug] || events[defaultEventSlug];

    if (!event) {
      app.innerHTML = renderMissingEvent();
      return;
    }

    applyTheme(event);
    updateDocumentMetadata(event);
    app.innerHTML = renderEventPage(event);
    injectStructuredData(event);
    bindInteractions(event);
    syncClock().finally(() => startCountdown(event));
  }

  function resolveEventSlug() {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("event");

    if (fromQuery) return normalizeSlug(fromQuery);

    const hashMatch = window.location.hash.match(/events\/([^/?#]+)/);
    if (hashMatch) return normalizeSlug(hashMatch[1]);

    const pathParts = window.location.pathname.split("/").filter(Boolean);
    const eventIndex = pathParts.indexOf("events");

    if (eventIndex >= 0 && pathParts[eventIndex + 1]) {
      return normalizeSlug(pathParts[eventIndex + 1]);
    }

    return defaultEventSlug;
  }

  function normalizeSlug(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-|-$/g, "");
  }

  function applyTheme(event) {
    const root = document.documentElement;
    const themePairs = {
      "--color-primary": event.primaryColor,
      "--color-secondary": event.secondaryColor,
      "--color-accent": event.accentColor,
      "--color-background": event.backgroundColor,
      "--color-text": event.textColor,
      "--font-heading": event.headingFont,
      "--font-body": event.bodyFont,
      "--font-accent": event.accentFont
    };

    Object.entries(themePairs).forEach(([key, value]) => {
      if (value) root.style.setProperty(key, value);
    });
  }

  function updateDocumentMetadata(event) {
    const title = event.seo?.pageTitle || event.eventName;
    const description = event.seo?.metaDescription || event.description || "";
    const image = absoluteUrl(event.seo?.openGraphImage || event.heroImage?.src);
    const canonical = event.canonicalUrl || canonicalFromLocation(event.slug);

    document.title = title;
    setMeta("name", "description", description);
    setMeta("name", "theme-color", event.primaryColor || "#9b0f7f");
    setLink("canonical", canonical);

    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:image", image);
    setMeta("property", "og:url", canonical);
    setMeta("property", "og:site_name", event.eventName);

    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", image);
  }

  function setMeta(attribute, key, content) {
    if (!content && attribute !== "name") return;

    let element = document.head.querySelector(`meta[${attribute}="${cssEscape(key)}"]`);

    if (!element) {
      element = document.createElement("meta");
      element.setAttribute(attribute, key);
      document.head.appendChild(element);
    }

    element.setAttribute("content", content || "");
  }

  function setLink(rel, href) {
    if (!href) return;

    let element = document.head.querySelector(`link[rel="${cssEscape(rel)}"]`);

    if (!element) {
      element = document.createElement("link");
      element.setAttribute("rel", rel);
      document.head.appendChild(element);
    }

    element.setAttribute("href", href);
  }

  function renderEventPage(event) {
    return `
      <main id="event-main" class="event-page">
        ${renderHero(event)}
        ${renderDetailsSection(event)}
        ${renderAboutSection(event)}
        ${renderPeopleSection(event)}
        ${renderScheduleSection(event)}
        ${renderLocationSection(event)}
        ${renderFaqSection(event)}
        ${renderFooter(event)}
      </main>
    `;
  }

  function renderHero(event) {
    const theme = event.theme?.title || event.eventSubtitle;
    const reference = event.theme?.reference;
    const hasImage = event.features?.showFlyer !== false && event.heroImage?.src;
    const logo = event.features?.showLogo !== false && event.logo?.src;
    const hasPrimaryAction = event.registrationUrl || event.ticketUrl;

    return `
      <section class="hero" aria-labelledby="event-title">
        <div class="hero__brand-bar">
          ${logo ? `<img class="hero__logo" src="${attr(event.logo.src)}" alt="${attr(event.logo.alt || event.eventName)}">` : ""}
          <span class="hero__kicker">${text(eventSubtitleLabel(event))}</span>
        </div>
        <div class="hero__shell">
          <div class="hero__content">
            <p class="theme-pill">${text(themeLabel(event))}</p>
            <h1 id="event-title">${text(event.eventName)}</h1>
            ${theme ? `<p class="hero__theme">${text(theme)}${reference ? ` <span>${text(reference)}</span>` : ""}</p>` : ""}
            ${renderCountdown(event)}
            <div class="hero__actions" aria-label="Event actions">
              ${
                hasPrimaryAction
                  ? `<a class="button button--primary" href="${attr(event.registrationUrl || event.ticketUrl)}">
                      <span class="button__icon" aria-hidden="true">+</span>
                      <span>${text(event.ticketUrl ? "Get Tickets" : "Register")}</span>
                    </a>`
                  : ""
              }
              ${
                event.features?.showCalendar !== false && canUseCalendar(event)
                  ? `<button class="button button--secondary" type="button" data-action="download-ics">
                      <span class="button__icon" aria-hidden="true">+</span>
                      <span>Add to Calendar</span>
                    </button>`
                  : ""
              }
              ${
                event.features?.showShare !== false
                  ? `<button class="button button--ghost" type="button" data-action="share-event">
                      <span class="button__icon" aria-hidden="true">↗</span>
                      <span>Share</span>
                    </button>`
                  : ""
              }
            </div>
          </div>
          ${
            hasImage
              ? `<figure class="hero__art">
                  <img src="${attr(event.heroImage.src)}" alt="${attr(event.heroImage.alt || event.eventName)}">
                  <figcaption>Official event artwork</figcaption>
                </figure>`
              : ""
          }
        </div>
      </section>
    `;
  }

  function renderCountdown(event) {
    return `
      <section class="countdown" aria-label="Event countdown">
        <div class="countdown__header">
          <p>Countdown</p>
          <strong id="countdown-status">Loading</strong>
        </div>
        <div class="countdown__grid" role="timer" aria-describedby="countdown-a11y">
          ${["days", "hours", "minutes", "seconds"]
            .map(
              (unit) => `
                <div class="countdown__unit">
                  <strong id="countdown-${unit}">--</strong>
                  <span>${text(unit)}</span>
                </div>
              `
            )
            .join("")}
        </div>
        <p id="countdown-a11y" class="sr-only" aria-live="polite">Countdown loading.</p>
      </section>
    `;
  }

  function renderDetailsSection(event) {
    const details = [
      {
        label: "Date",
        value: event.date?.display,
        icon: "D"
      },
      {
        label: "Time",
        value: formatTimeRange(event),
        icon: "T"
      },
      {
        label: "Venue",
        value: event.venue,
        icon: "V"
      },
      {
        label: "Location",
        value: event.address || event.locationLabel,
        icon: "L"
      }
    ].filter((item) => item.value);

    if (!details.length) return "";

    return `
      <section class="section section--light details-section" aria-labelledby="details-title">
        <div class="section__inner">
          <div class="section__heading">
            <p class="eyebrow">Event Details</p>
            <h2 id="details-title">Everything attendees need at a glance</h2>
          </div>
          <div class="details-grid">
            ${details
              .map(
                (detail) => `
                  <article class="detail-card">
                    <span class="detail-card__icon" aria-hidden="true">${text(detail.icon)}</span>
                    <div>
                      <h3>${text(detail.label)}</h3>
                      <p>${text(detail.value)}</p>
                    </div>
                  </article>
                `
              )
              .join("")}
          </div>
        </div>
      </section>
    `;
  }

  function renderAboutSection(event) {
    if (!event.description) return "";

    return `
      <section class="section about-section" aria-labelledby="about-title">
        <div class="section__inner about-layout">
          <div class="section__heading">
            <p class="eyebrow">About The Event</p>
            <h2 id="about-title">${text(event.theme?.title || event.eventSubtitle || event.eventName)}</h2>
          </div>
          <div class="about-copy">
            <p>${text(event.description)}</p>
            ${event.theme?.reference ? `<p class="scripture">${text(event.theme.reference)}</p>` : ""}
          </div>
        </div>
      </section>
    `;
  }

  function renderPeopleSection(event) {
    if (event.features?.showGuests === false) return "";

    const groups = [
      {
        title: "Hosts",
        people: event.hosts || []
      },
      {
        title: "Speakers",
        people: event.speakers || []
      },
      {
        title: "Guests",
        people: event.guests || []
      }
    ].filter((group) => group.people.length);

    if (!groups.length) return "";

    return `
      <section class="section section--light people-section" aria-labelledby="people-title">
        <div class="section__inner">
          <div class="section__heading">
            <p class="eyebrow">Featured People</p>
            <h2 id="people-title">Hosts, speakers and guests</h2>
          </div>
          ${groups.map(renderPeopleGroup).join("")}
        </div>
      </section>
    `;
  }

  function renderPeopleGroup(group) {
    return `
      <div class="people-group">
        <h3>${text(group.title)}</h3>
        <div class="people-grid" data-count="${group.people.length}">
          ${group.people.map(renderPersonCard).join("")}
        </div>
      </div>
    `;
  }

  function renderPersonCard(person) {
    const meta = [person.title, person.capacity, person.organization].filter(Boolean).join(", ");

    return `
      <article class="person-card">
        ${
          person.image
            ? `<img class="person-card__image" src="${attr(person.image)}" alt="${attr(person.name)}">`
            : `<div class="person-card__placeholder" aria-hidden="true">${text(initials(person.name))}</div>`
        }
        <div class="person-card__body">
          <h4>${text(person.name)}</h4>
          ${person.role ? `<p class="person-card__role">${text(person.role)}</p>` : ""}
          ${meta ? `<p>${text(meta)}</p>` : ""}
        </div>
      </article>
    `;
  }

  function renderScheduleSection(event) {
    if (event.features?.showSchedule === false || !event.schedule?.length) return "";

    return `
      <section class="section schedule-section" aria-labelledby="schedule-title">
        <div class="section__inner">
          <div class="section__heading">
            <p class="eyebrow">Schedule</p>
            <h2 id="schedule-title">Event Flow</h2>
          </div>
          <ol class="timeline">
            ${event.schedule
              .map(
                (item) => `
                  <li class="timeline__item">
                    ${item.time ? `<time>${text(item.time)}</time>` : ""}
                    <div>
                      <h3>${text(item.title)}</h3>
                      ${item.description ? `<p>${text(item.description)}</p>` : ""}
                      ${item.speaker ? `<p class="timeline__speaker">${text(item.speaker)}</p>` : ""}
                    </div>
                  </li>
                `
              )
              .join("")}
          </ol>
        </div>
      </section>
    `;
  }

  function renderLocationSection(event) {
    const canShowMap = event.features?.showMap !== false && (event.mapQuery || event.address || event.venue);
    const contactLinks = buildContactLinks(event);
    const shouldShow = canShowMap || contactLinks.length || event.website;

    if (!shouldShow) return "";

    return `
      <section class="section section--deep location-section" aria-labelledby="location-title">
        <div class="section__inner location-layout">
          <div class="section__heading">
            <p class="eyebrow">Attend</p>
            <h2 id="location-title">${text(event.venue || "Event Location")}</h2>
            ${event.address || event.locationLabel ? `<p>${text(event.address || event.locationLabel)}</p>` : ""}
          </div>
          <div class="action-cluster">
            ${
              canShowMap
                ? `<a class="button button--light" href="${attr(mapUrl(event))}" target="_blank" rel="noopener">
                    <span class="button__icon" aria-hidden="true">↗</span>
                    <span>Open Map</span>
                  </a>`
                : ""
            }
            ${
              event.website
                ? `<a class="button button--light" href="${attr(event.website)}" target="_blank" rel="noopener">
                    <span class="button__icon" aria-hidden="true">↗</span>
                    <span>Website</span>
                  </a>`
                : ""
            }
            ${contactLinks
              .map(
                (link) => `
                  <a class="button button--light" href="${attr(link.href)}" ${link.external ? 'target="_blank" rel="noopener"' : ""}>
                    <span class="button__icon" aria-hidden="true">${text(link.icon)}</span>
                    <span>${text(link.label)}</span>
                  </a>
                `
              )
              .join("")}
          </div>
        </div>
      </section>
    `;
  }

  function renderFaqSection(event) {
    if (event.features?.showFaq === false || !event.faqs?.length) return "";

    return `
      <section class="section faq-section" aria-labelledby="faq-title">
        <div class="section__inner">
          <div class="section__heading">
            <p class="eyebrow">FAQ</p>
            <h2 id="faq-title">Common Questions</h2>
          </div>
          <div class="faq-list">
            ${event.faqs
              .map(
                (faq) => `
                  <details>
                    <summary>${text(faq.question)}</summary>
                    <p>${text(faq.answer)}</p>
                  </details>
                `
              )
              .join("")}
          </div>
        </div>
      </section>
    `;
  }

  function renderFooter(event) {
    const socials = event.features?.showSocialLinks === false ? [] : event.socialLinks || [];

    return `
      <footer class="footer">
        <div class="footer__inner">
          <div>
            <strong>${text(event.eventName)}</strong>
            ${event.organizer ? `<p>${text(event.organizer)}</p>` : ""}
          </div>
          ${
            socials.length
              ? `<nav class="social-links" aria-label="Social links">
                  ${socials
                    .map(
                      (social) => `
                        <a href="${attr(social.url)}" target="_blank" rel="noopener">${text(social.label)}</a>
                      `
                    )
                    .join("")}
                </nav>`
              : ""
          }
        </div>
      </footer>
    `;
  }

  function renderMissingEvent() {
    return `
      <main class="missing-event">
        <h1>Event not found</h1>
        <p>Add this event slug to <code>src/data/events.js</code> or use an existing configured event.</p>
      </main>
    `;
  }

  function startCountdown(event) {
    const units = {
      days: document.getElementById("countdown-days"),
      hours: document.getElementById("countdown-hours"),
      minutes: document.getElementById("countdown-minutes"),
      seconds: document.getElementById("countdown-seconds")
    };
    const status = document.getElementById("countdown-status");
    const a11y = document.getElementById("countdown-a11y");

    if (!status || !a11y) return;

    const update = () => {
      const state = getCountdownState(event);
      updateCountdownDom(units, status, a11y, state, event);
    };

    update();
    window.setInterval(update, SECOND);
  }

  function getCountdownState(event) {
    const start = parseDate(event.date?.startDateTime);
    const end = parseDate(event.date?.endDateTime);
    const now = new Date(Date.now() + clockOffset);

    if (!start) {
      return {
        phase: "pending",
        status: "DATE TO BE CONFIRMED",
        remaining: null
      };
    }

    if (now < start) {
      return {
        phase: "counting",
        status: "STARTS SOON",
        remaining: Math.max(0, start.getTime() - now.getTime())
      };
    }

    if (end && now > end) {
      return {
        phase: "finished",
        status: event.finishedLabel || "EVENT COMPLETED",
        remaining: 0
      };
    }

    return {
      phase: "live",
      status: event.postCountdownLabel || "THE EVENT HAS STARTED",
      remaining: 0
    };
  }

  function updateCountdownDom(units, status, a11y, state, event) {
    const values = state.remaining === null ? null : splitDuration(state.remaining);
    const display = values || {
      days: "--",
      hours: "--",
      minutes: "--",
      seconds: "--"
    };

    Object.entries(display).forEach(([unit, value]) => {
      if (units[unit]) units[unit].textContent = String(value).padStart(2, "0");
    });

    status.textContent = state.status;
    status.dataset.phase = state.phase;

    const currentMinute = values ? `${values.days}-${values.hours}-${values.minutes}` : state.phase;
    const shouldUpdateA11y = currentMinute !== lastA11yMinute || state.phase !== lastPhase;

    if (shouldUpdateA11y) {
      a11y.textContent = countdownSummary(state, values, event);
      lastA11yMinute = currentMinute;
      lastPhase = state.phase;
    }
  }

  function splitDuration(ms) {
    const days = Math.floor(ms / DAY);
    const hours = Math.floor((ms % DAY) / HOUR);
    const minutes = Math.floor((ms % HOUR) / MINUTE);
    const seconds = Math.floor((ms % MINUTE) / SECOND);

    return { days, hours, minutes, seconds };
  }

  function countdownSummary(state, values, event) {
    if (state.phase === "pending") {
      return "The event year has not been configured yet.";
    }

    if (state.phase === "live") {
      return event.postCountdownLabel || "The event has started.";
    }

    if (state.phase === "finished") {
      return event.finishedLabel || "Event completed.";
    }

    return `${values.days} days, ${values.hours} hours and ${values.minutes} minutes until ${event.eventName}.`;
  }

  async function syncClock() {
    if (!/^https?:$/.test(window.location.protocol)) return;

    try {
      const response = await fetch(window.location.href, {
        method: "HEAD",
        cache: "no-store"
      });
      const serverDate = response.headers.get("Date");

      if (serverDate) {
        clockOffset = new Date(serverDate).getTime() - Date.now();
      }
    } catch (error) {
      clockOffset = 0;
    }
  }

  function bindInteractions(event) {
    const shareButton = document.querySelector('[data-action="share-event"]');
    const calendarButton = document.querySelector('[data-action="download-ics"]');

    if (shareButton) {
      shareButton.addEventListener("click", () => shareEvent(event, shareButton));
    }

    if (calendarButton) {
      calendarButton.addEventListener("click", () => downloadIcs(event));
    }
  }

  async function shareEvent(event, button) {
    const shareData = {
      title: event.seo?.pageTitle || event.eventName,
      text: event.seo?.metaDescription || event.description || event.eventName,
      url: canonicalFromLocation(event.slug)
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareData.url);
      temporarilySetButtonLabel(button, "Copied");
    } catch (error) {
      temporarilySetButtonLabel(button, "Copy failed");
    }
  }

  function temporarilySetButtonLabel(button, label) {
    const textNode = button.querySelector("span:last-child");
    if (!textNode) return;

    const original = textNode.textContent;
    textNode.textContent = label;
    window.setTimeout(() => {
      textNode.textContent = original;
    }, 1800);
  }

  function downloadIcs(event) {
    const start = parseDate(event.date?.startDateTime);
    const end = parseDate(event.date?.endDateTime) || start;

    if (!start) return;

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Conference Countdown Template//EN",
      "BEGIN:VEVENT",
      `UID:${event.slug}@conference-countdown-template`,
      `DTSTAMP:${toIcsDate(new Date())}`,
      `DTSTART:${toIcsDate(start)}`,
      `DTEND:${toIcsDate(end)}`,
      `SUMMARY:${escapeIcs(event.eventName)}`,
      event.description ? `DESCRIPTION:${escapeIcs(event.description)}` : "",
      event.venue ? `LOCATION:${escapeIcs(event.venue)}` : "",
      `URL:${escapeIcs(canonicalFromLocation(event.slug))}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ]
      .filter(Boolean)
      .join("\r\n");

    const blob = new Blob([ics], {
      type: "text/calendar;charset=utf-8"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${event.slug}.ics`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function injectStructuredData(event) {
    const script = document.getElementById("event-schema");
    const start = event.date?.startDateTime;
    const end = event.date?.endDateTime;

    if (!script || !start) return;

    const schema = {
      "@context": "https://schema.org",
      "@type": "Event",
      name: event.eventName,
      description: event.description || event.seo?.metaDescription,
      startDate: start,
      endDate: end || undefined,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      image: event.heroImage?.src ? [absoluteUrl(event.heroImage.src)] : undefined,
      location: event.venue
        ? {
            "@type": "Place",
            name: event.venue,
            address: event.address || event.locationLabel || undefined
          }
        : undefined,
      organizer: event.organizer
        ? {
            "@type": "Organization",
            name: event.organizer,
            url: event.website || undefined
          }
        : undefined,
      url: canonicalFromLocation(event.slug)
    };

    script.textContent = JSON.stringify(dropUndefined(schema));
  }

  function buildContactLinks(event) {
    if (event.features?.showContact === false) return [];

    const links = [];
    const phone = event.contact?.phone;
    const whatsapp = event.contact?.whatsapp;
    const email = event.contact?.email;

    if (phone) {
      links.push({
        href: `tel:${phone.replace(/\s+/g, "")}`,
        label: "Call",
        icon: "C"
      });
    }

    if (whatsapp) {
      links.push({
        href: `https://wa.me/${whatsapp.replace(/[^\d]/g, "")}`,
        label: "WhatsApp",
        icon: "W",
        external: true
      });
    }

    if (email) {
      links.push({
        href: `mailto:${email}`,
        label: "Email",
        icon: "@"
      });
    }

    return links;
  }

  function formatTimeRange(event) {
    if (!event.startTime && !event.endTime) return "";
    if (event.startTime && event.endTime) return `${event.startTime} to ${event.endTime}`;
    return event.startTime || event.endTime;
  }

  function canUseCalendar(event) {
    return Boolean(parseDate(event.date?.startDateTime));
  }

  function mapUrl(event) {
    const query = event.mapQuery || event.address || event.venue || "";
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  function eventSubtitleLabel(event) {
    if (event.organizer) return event.organizer;
    if (event.venue) return event.venue;
    return "Official Event Page";
  }

  function themeLabel(event) {
    if (event.theme?.reference) return "Theme";
    if (event.eventSubtitle) return "Featured Event";
    return "Official Event";
  }

  function parseDate(value) {
    if (!value) return null;

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function initials(name) {
    return String(name || "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }

  function canonicalFromLocation(slug) {
    if (!window.location.origin || window.location.origin === "null") {
      return window.location.href;
    }

    return `${window.location.origin}${window.location.pathname.replace(/\/$/, "")}?event=${encodeURIComponent(slug)}`;
  }

  function absoluteUrl(path) {
    if (!path) return "";

    try {
      return new URL(path, window.location.href).href;
    } catch (error) {
      return path;
    }
  }

  function toIcsDate(date) {
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  }

  function escapeIcs(value) {
    return String(value || "")
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
  }

  function dropUndefined(value) {
    if (Array.isArray(value)) {
      return value.map(dropUndefined).filter((item) => item !== undefined);
    }

    if (value && typeof value === "object") {
      return Object.entries(value).reduce((result, [key, item]) => {
        const cleaned = dropUndefined(item);

        if (cleaned !== undefined && cleaned !== "") {
          result[key] = cleaned;
        }

        return result;
      }, {});
    }

    return value;
  }

  function text(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function attr(value) {
    return text(value);
  }

  function cssEscape(value) {
    if (window.CSS?.escape) return window.CSS.escape(value);
    return String(value).replace(/"/g, '\\"');
  }
})();
