# Lab 2 Part 2: Enhanced Agent Harness

## Tooling choice

This branch chooses [Playwright CLI](https://playwright.dev/docs/getting-started-cli)
rather than Playwright MCP. The CLI is designed for coding agents: concise commands
and snapshots use less model context, and its behavior can be taught through a
repository Skill. MCP is a better fit for long-lived exploratory loops that benefit
from persistent tool state and structured browser tools, at the cost of larger tool
schemas and more context.

The tradeoff is explicit lifecycle management. With CLI, the agent must start the
server, name and close browser sessions, refresh snapshot references after rerenders,
and preserve traces itself. MCP can make that loop more integrated.

## Harness additions

- `.github/workflows/copilot-setup-steps.yml` installs project dependencies without
  rewriting the starter lockfile, pinned Playwright tooling, and the browser revision
  required by each Playwright package before the coding agent starts.
- `.github/workflows/playwright-e2e.yml` verifies a CLI-controlled browser, runs the
  checkout suite and existing checks, and uploads snapshots, screenshots, traces,
  and reports as workflow evidence.
- `.github/skills/web-testing/SKILL.md` adapts the provided Skill template into a
  reusable exploration, test-design, failure-triage, and verification workflow.
- `playwright.config.js` starts Vite on a deterministic URL and retains screenshots,
  videos, and traces for failures.
- `e2e/checkout.spec.js` covers an unauthenticated checkout block, cart persistence
  through sign-up, required and boundary validation failures, quantity and discounted
  total state changes, successful completion, durable cart cleanup, delayed redirect,
  and direct navigation with an empty cart.

## Interaction and trace record

The initial local installation commands were:

```text
npm install --save-dev @playwright/cli@0.1.19 @playwright/test@1.62.1
```

Result: the organization package proxy returned HTTP 404 for
`@csstools/css-syntax-patches-for-csstree@1.1.10`.

```text
npm install --save-dev @playwright/cli@0.1.19 @playwright/test@1.62.1 \
  --registry=https://registry.npmjs.org/
```

Result: the direct-registry request remained blocked with no response and was
terminated. IT confirmed npm will not be unblocked. No Playwright browser interaction
or Playwright trace was produced locally, and this document does not claim otherwise.
The official CLI has no standalone binary distribution, so bypassing npm would mean
using an unsupported package source or violating the network policy.

The first GitHub-hosted run reached npm but found that the starter `package-lock.json`
was already incomplete (`@emnapi/runtime` and `@emnapi/core` were absent), so `npm ci`
stopped before Playwright setup. The harness now uses
`npm install --package-lock=false` in ephemeral runners, preserving the repository
lockfile while allowing npm to resolve the starter project's missing transitive
metadata.

Node 22's bundled npm then failed internally with
`Cannot read properties of null (reading 'edgesOut')`. Because Playwright CLI supports
Node 20 and newer, the hosted harness pins Node 20/npm 10 rather than modifying the
starter dependency graph to accommodate an npm resolver regression.

The next hosted run successfully installed both Playwright tools and browser revisions,
started the application, opened `http://127.0.0.1:4173/` with Playwright CLI, and
captured a real accessibility snapshot, screenshot, console log, and CLI trace. The
snapshot confirmed accessible product names, prices, and `Add to Cart` controls. The
first E2E invocation then stopped before test collection because the CLI verification
server already owned port 4173 while the test runner was configured to reject an
existing CI server. This was a harness orchestration defect, not an application defect.
The config now reuses the verified server, and the CLI evidence step performs a real
cart state change before the E2E suite.

Source review still exposed an important behavior for browser verification: discounted
products use the discounted amount in the order total, while each checkout line shows
the undiscounted extended price. For two Wireless Headphones and one Bluetooth Speaker,
the rows show `$199.98` and `$59.99`, while the order total is `$239.97`. The E2E test
captures the application as implemented rather than changing it for the test.

## Skill improvement

The first tooling attempt failed before browser launch. That failure improved the
Skill's readiness and triage guidance:

- prove both CLI and test-runner availability before starting exploration;
- verify the server before opening a browser;
- classify dependency/network failures as environment failures;
- report blocked installation exactly and never bypass organization policy;
- do not claim a browser or trace was produced when setup failed.
- coordinate server ownership when CLI exploration and Playwright Test run in one job.

The test-design review added reusable guidance to assert intermediate transitions,
durable browser state, independent price calculations, guarded-route behavior, and
intentional timers. Human judgment was still required to select representative
validation boundaries, distinguish the line-price/total discrepancy from a test
arithmetic error, and decide not to modify the application.

Following that Skill update, the focused workflow was rerun:

```text
npm run test:e2e -- e2e/checkout.spec.js --project=chromium
```

It failed immediately with `playwright: command not found`, as the updated readiness
guidance predicts. The improvement was a fast, correctly classified environment
failure instead of repeated browser or locator debugging; completing the browser run
still requires an allowed coding-agent runner to execute the committed setup steps.

## Commands

Once Playwright is available in an allowed environment:

```bash
npm run browser -- -s=checkout open http://127.0.0.1:4173
npm run test:e2e -- e2e/checkout.spec.js --project=chromium
npm test
npm run lint
npm run build
```

The extra harness complexity is worthwhile for stateful, regression-prone workflows
where real navigation, storage, browser validation, and trace artifacts matter. It is
usually not worthwhile for a small pure function or component behavior already covered
reliably by unit tests.
