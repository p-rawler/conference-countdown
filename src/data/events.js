(function () {
  "use strict";

  /*
   * Event content lives here so future client pages can be created without
   * rewriting the components. Add a new key to events, then visit:
   * /events/your-event-slug, ?event=your-event-slug, or #/events/your-event-slug.
   */
  const defaultEventSlug = "victory-women-of-the-word";

  const events = {
    "victory-women-of-the-word": {
      slug: "victory-women-of-the-word",
      eventName: "Women of the Word Conference",
      eventSubtitle: "Myrrh Before the Crown",
      theme: {
        title: "Myrrh Before the Crown",
        reference: "Esther 2:12"
      },

      /*
       * The flyer does not show a year. Keep startDateTime and endDateTime null
       * until the client confirms the exact year. Use ISO 8601 with timezone:
       * 2026-09-04T08:00:00+03:00
       */
      date: {
        display: "Sunday, September 4th - Sunday, September 11th",
        startDateTime: null,
        endDateTime: null
      },
      startTime: "8:00 AM",
      endTime: "6:00 PM",
      timezone: "Africa/Kampala",
      venue: "Victory Christian Centre Ndeeba",
      address: null,
      locationLabel: "At Victory Christian Centre Ndeeba",
      mapQuery: "Victory Christian Centre Ndeeba",
      description:
        "Women of the Word Conference is presented with the theme Myrrh Before the Crown and scripture reference Esther 2:12.",
      organizer: null,
      website: null,
      contact: {
        phone: null,
        whatsapp: null,
        email: null
      },

      heroImage: {
        src: "assets/images/victory-church-conference.jpeg",
        alt:
          "Official flyer for Women of the Word Conference, themed Myrrh Before the Crown"
      },
      logo: null,

      primaryColor: "#9b0f7f",
      secondaryColor: "#d51b73",
      accentColor: "#e8942c",
      backgroundColor: "#fff7fb",
      textColor: "#2e1631",
      headingFont: '"Segoe UI", Arial, sans-serif',
      bodyFont: '"Segoe UI", Arial, sans-serif',
      accentFont: 'Georgia, "Times New Roman", serif',

      hosts: [
        {
          name: "Dr. Joseph Serwadda",
          role: "Host",
          title: null,
          capacity: null,
          organization: null,
          image: null
        },
        {
          name: "Pr. Fredah Serwadda",
          role: "Host",
          title: null,
          capacity: null,
          organization: null,
          image: null
        }
      ],
      speakers: [],
      guests: [],
      schedule: [],
      faqs: [],
      socialLinks: [],

      registrationUrl: null,
      ticketUrl: null,
      canonicalUrl: "",
      postCountdownLabel: "LIVE NOW",
      finishedLabel: "EVENT COMPLETED",

      features: {
        showLogo: true,
        showFlyer: true,
        showGuests: true,
        showSchedule: true,
        showMap: true,
        showCalendar: true,
        showRegistration: true,
        showContact: true,
        showSocialLinks: true,
        showShare: true,
        showFaq: true,
        showQrCode: false
      },

      seo: {
        pageTitle: "Women of the Word Conference",
        metaDescription:
          "Women of the Word Conference themed Myrrh Before the Crown, hosted at Victory Christian Centre Ndeeba.",
        openGraphImage: "assets/images/victory-church-conference.jpeg"
      },

      extractionNotes: [
        "The flyer does not show an event year, so the countdown target is intentionally left configurable.",
        "The flyer includes four portrait photos, but their names and roles are not readable in the supplied image.",
        "The visible host line reads: Dr. Joseph & Pr. Fredah Serwadda.",
        "The visible wording includes: Worship the Lord."
      ]
    }
  };

  window.EVENT_TEMPLATE = {
    defaultEventSlug,
    events
  };
})();
