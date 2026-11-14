# Balcão · landing page for a WhatsApp receptionist bot

[![CI](https://github.com/GuilhermeBSthyrmer/balcao-atendimento-site/actions/workflows/ci.yml/badge.svg)](https://github.com/GuilhermeBSthyrmer/balcao-atendimento-site/actions/workflows/ci.yml) [![CodeQL](https://github.com/GuilhermeBSthyrmer/balcao-atendimento-site/actions/workflows/codeql.yml/badge.svg)](https://github.com/GuilhermeBSthyrmer/balcao-atendimento-site/actions/workflows/codeql.yml)

Product page for [whatsapp-atendimento-bot](https://github.com/GuilhermeBSthyrmer/whatsapp-atendimento-bot), my multi-tenant WhatsApp customer-service bot (Node.js, Express, MongoDB, Claude API). The bot talks to the customer, runs an intake questionnaire, picks the right branch and hands the qualified lead to a human with a short summary.

The page is in Portuguese, the bot's market.

**Live:** https://guilhermebsthyrmer.github.io/balcao-atendimento-site/

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

## Tests

End-to-end tests with [Playwright](https://playwright.dev/), each scenario run on a desktop and a mobile viewport (Chromium). 5 scenarios: a full conversation fills and delivers the message slip, a neighbourhood is routed to the nearest branch while the customer asks for a person, the out-of-hours reply is fixed text, and the model/customer tabs work with arrow keys.

Every push runs the suite on GitHub Actions, together with Lighthouse (accessibility and best practices must score 90 or more) and CodeQL security analysis. Dependabot keeps the dependencies up to date.

```bash
npm install
npx playwright install chromium
npm test
```

## Run locally

```bash
npm start   # http://localhost:4180
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
