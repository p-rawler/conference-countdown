# Reusable Conference Countdown Template

This is a lightweight, dependency-free event countdown page. Event content is centralized in `src/data/events.js`, while the page structure, countdown behavior, theming, metadata, and optional sections are handled by the reusable renderer and stylesheet.

## Customize An Event

1. Add the client flyer and any supplied logos/photos to `assets/images/`.
2. Add a new event object in `src/data/events.js`.
3. Change `defaultEventSlug` or visit the event with `?event=your-slug`, `#/events/your-slug`, or `/events/your-slug` when deployed with route fallback.
4. Set `date.startDateTime` and `date.endDateTime` in ISO 8601 format with timezone, for example `2026-09-04T08:00:00+03:00`.
5. Toggle optional sections in the `features` object.

## Flyer Extraction For This Event

Readable from the supplied flyer:

- Event name: Women of the Word Conference
- Theme: Myrrh Before the Crown
- Scripture reference: Esther 2:12
- Date label: Sunday, September 4th - Sunday, September 11th
- Time: 8:00 AM to 6:00 PM
- Hosts: Dr. Joseph Serwadda and Pr. Fredah Serwadda
- Location: At Victory Christian Centre Ndeeba
- Visual style: magenta, purple, white, orange accent, bold rounded headings, script accent lettering, circular portrait framing

Not readable or not shown:

- Event year
- Names/titles of the four portrait guests
- Registration/contact links
- Full street address
- Schedule details

Those fields are intentionally left configurable instead of being guessed.

## Files

- `index.html` - shell, baseline metadata, and script/style loading.
- `src/data/events.js` - centralized event data and theme tokens.
- `src/js/main.js` - reusable renderer, countdown, route resolution, sharing, calendar export, metadata, and schema.
- `src/styles/styles.css` - responsive visual system driven by CSS variables.
- `netlify.toml` and `vercel.json` - route rewrites for `/events/:slug` on common static hosts.

## Countdown Behavior

The countdown uses the configured ISO start date/time. If a start date is missing, it shows a polished pending state instead of rendering incorrect numbers. When the event starts, it displays the configured `postCountdownLabel`. When the configured end time has passed, it displays `finishedLabel`.

When served over HTTP, the page attempts a lightweight `HEAD` request to compare the browser clock with the server `Date` header, then uses that offset for the countdown. If unavailable, it falls back to the device clock.
