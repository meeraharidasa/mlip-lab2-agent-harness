---
name: web-testing
description: Explore a local web app with Playwright CLI, turn observed workflows into resilient Playwright end-to-end tests, diagnose failures from traces, and feed reusable lessons back into this Skill.
---

# Web Testing with Playwright

Adapted from this repository's `skill-template/web-testing/SKILL.MD`.

## Goal

Use `playwright-cli` for token-efficient browser exploration and `@playwright/test`
for repeatable end-to-end coverage. Test user-visible behavior without changing the
application merely to satisfy a test.

## Readiness

1. Read the app's scripts and relevant routes before starting it.
   Honor the project's supported Node version; if npm itself fails while resolving a
   legacy or incomplete lockfile, reproduce with the lowest supported current Node
   release before changing dependency metadata.
2. Run `npx playwright-cli --help` and `npx playwright --version` to prove both
   the exploration CLI and test runner are installed.
   Install the browser expected by each pinned tool (`playwright install chromium`
   and `playwright-cli install-browser`) because their browser revisions can differ.
3. Start the app on a fixed host and port. Confirm the URL responds before opening
   it in Playwright.
   When CLI exploration and Playwright Test share that server, configure the test
   runner to reuse the existing server instead of competing for the same port.
4. Use a named CLI session, such as
   `npx playwright-cli -s=web-test open http://127.0.0.1:4173`.

If dependency installation is blocked, report the exact command and error. Do not
bypass organization network policy or claim browser verification occurred.

## Understand the Application

Before writing tests:

- Identify route guards and prerequisites such as authentication or nonempty state.
- Determine where state is stored and whether it must survive navigation or reloads.
- Calculate expected values independently, including discounts and quantities.
- Prefer actual UI setup over injecting application state.

## Browser Interaction

1. Snapshot before acting and after every meaningful transition.
2. Use snapshot refs for one-off exploration; refresh the snapshot after navigation
   or rerender because refs may become stale.
3. Prefer role, label, and visible-name locators in final tests. Avoid generated
   classes and brittle DOM chains when an accessible locator exists.
4. Inspect `console` after important transitions and capture screenshots for
   unexpected states.
5. Start tracing before the scenario and stop it after the outcome. Preserve a
   failed trace before changing tests.

Useful commands:

```bash
npx playwright-cli -s=web-test snapshot
npx playwright-cli -s=web-test click e12
npx playwright-cli -s=web-test fill e18 "value"
npx playwright-cli -s=web-test console warning
npx playwright-cli -s=web-test tracing-start
npx playwright-cli -s=web-test tracing-stop
```

## Identify Test Cases

Cover a coherent journey, not isolated clicks:

- successful completion and its durable state change;
- an authorization or prerequisite failure;
- invalid required and boundary inputs;
- quantity, price, or other derived-state changes;
- direct navigation to guarded routes;
- post-completion cleanup or redirect behavior.

Avoid testing every validation permutation. Choose representative failures that
exercise distinct rules and meaningful user consequences.

## Writing Tests

- Start each test from isolated browser storage.
- Build state through user-visible interactions when validating an end-to-end flow.
- Keep setup helpers focused on user actions rather than assertions.
- Assert intermediate state before the final outcome so failures identify the
  broken transition.
- Assert both rendered state and durable browser state when completion mutates both.
- Account for intentional timers with explicit, narrow timeouts rather than sleeps.

## Failure Triage

Classify a failure before editing:

1. **Application defect:** observed behavior contradicts the intended product.
2. **Test defect:** wrong locator, arithmetic, timing, or assumption.
3. **Environment defect:** server, browser, dependency, or network unavailable.

Review the Playwright error, screenshot, and trace together. Reproduce the smallest
failing path with CLI snapshots. Fix test defects, document application defects,
and never modify product code solely to make a test green.

Treat harness orchestration as part of failure triage: a port-ownership failure before
test collection is not an application failure. Coordinate one server across CLI and
test phases, then rerun before changing locators or assertions.

## Verification

1. Run the focused test while iterating:
   `npx playwright test e2e/checkout.spec.js --project=chromium`.
2. Inspect retained traces with `npx playwright show-trace <trace.zip>`.
3. Run the complete E2E command, then unit tests, lint, and build.
4. Rerun one representative workflow after updating this Skill and record whether
   its instructions reduced retries or ambiguity.

## Completion Criteria

Testing is complete when the browser path was observed, meaningful success and
failure paths pass as Playwright E2E tests, state changes are asserted, failures
are classified from evidence, and reusable trace lessons are captured here.
