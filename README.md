# Balcão · landing page for a WhatsApp receptionist bot

Product page for [whatsapp-atendimento-bot](https://github.com/cururupernatorta/whatsapp-atendimento-bot), my multi-tenant WhatsApp customer-service bot (Node.js, Express, MongoDB, Claude API). The bot talks to the customer, runs an intake questionnaire, picks the right branch and hands the qualified lead to a human with a short summary.

The page is in Portuguese, the bot's market.

**Live:** `https://cururupernatorta.github.io/balcao-atendimento-site/` (after GitHub Pages is enabled)

## Design

The visual world is the office **phone message pad** ("Recado"): pink paper, red printed labels, ballpoint-blue handwriting, perforated top edge, a carbon copy behind it and an "Entregue" (delivered) rubber stamp. The lead hand-off is literally a message slip delivered to the branch.

## What's on the page

- **Hand-filled message slip** in the hero, written field by field with a stepped clip-path reveal, then stamped.
- **Interactive conversation demo**: the visitor plays a customer of a fictional dental clinic with three branches. A scripted state machine asks for name, service, branch (or neighbourhood, mapped to the nearest branch) and best time, and fills the slip live. It also simulates:
  - the deterministic out-of-hours reply (fixed text, no model call),
  - "talk to a person" at any step,
  - the control tags the real bot strips before replying (`[NOME:x]`, `[FILIAL:N]`, `[HUMANO]`, `[LEAD_PRONTO]`).
- **Model output vs. what the customer sees** tabs (ARIA tabs with arrow-key support).
- Pipeline explanation (webhook with timing-safe secret check, 4 s message buffer, cached system prompt, tag actions), features, security measures and quick-start commands with a copy button.

The demo is scripted and runs only in the browser. The real bot uses the Claude API.

## Technical notes

- Plain HTML, CSS and JavaScript. No build step, no dependencies.
- Strict Content Security Policy: no inline scripts or styles, `connect-src 'none'`. Dynamic values are set through the CSSOM.
- Live regions announce new chat messages; reduced-motion users get the final state without animation.

## Run locally

```bash
npx serve .
```

## Structure

```
index.html
css/style.css
js/main.js
assets/favicon.svg
```

The clinic and the people in the conversation are fictional.

## License

MIT
