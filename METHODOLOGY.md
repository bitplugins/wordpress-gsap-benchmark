# Benchmark Methodology

This document defines the exact, reproducible rules for populating runtime performance entries in [`data/matrix.json`](data/matrix.json) and the benchmark table in [`README.md`](README.md).

---

## 1. Guiding Principles

1. **Identical Baseline Layouts:** Every plugin within a builder group (Divi 5, Gutenberg, Elementor 4) must animate the **exact same clean test layout** with identical copy, fonts, images, and viewport dimensions (`1440×900`).
2. **Cold-Cache Measurement:** Every run uses a fresh incognito Playwright Chromium context with zero cached assets, logged-out visitor state (no `#wpadminbar`), and no third-party analytics/chat scripts.
3. **5-Run Median:** Each URL is measured **5 times** in `normal` motion mode (`--runs 5`), and all numeric metrics are reported as the **median** across the 5 runs.
4. **Zero Cherry-Picking:** Full raw JSON output from `scripts/measure-page.mjs` (all 5 runs + reduced-motion verification pass) must accompany any PR updating `data/matrix.json`.
5. **No Editorial Alteration of Measured Numbers:** Never round down competitor payloads or omit baseline results. Every group reports its **native builder core** (`Divi 5 Core`, `Gutenberg Core`, `Elementor 4 Core`) on the exact same page first so plugin overhead (`Δ vs Core`) is transparent.

---

## 2. Canonical Test Environment

| Component | Required Specification |
| --- | --- |
| **WordPress** | Clean WordPress `6.8` or `6.9` install (fresh database, default `WP_DEBUG = false`) |
| **PHP** | PHP `8.2` or `8.3` |
| **Theme** | Gutenberg tests: `Twenty Twenty-Five` (clean core block theme)<br>Divi 5 tests: `Divi 5` (no child theme overrides)<br>Elementor 4 tests: `Hello Elementor` |
| **Other Plugins** | **None** active except the target builder (if applicable) and the single animation plugin under test |
| **Caching / Minification** | Disabled during measurement so raw plugin asset loading is measured directly |
| **Fonts & Media** | Local system font stack or self-hosted `WOFF2` + identical local `WebP` hero image (`1200×800`) |

---

## 3. Canonical Benchmark Page Fixture

Each test page must contain the following 4 sections using equivalent native elements:

1. **Hero Section (Above the Fold):**
   - One `H1` headline (8 words) — **SplitText word/line reveal on load** (or closest native fade/slide if SplitText is unsupported)
   - One paragraph (20 words) — fade-up reveal
   - One CTA button — hover micro-interaction
2. **3-Column Feature Card Grid (ScrollTrigger):**
   - Three cards (heading + short paragraph + icon/image) — **staggered scroll-reveal** (`ScrollTrigger` entering viewport)
3. **Scroll-Scrubbed Section:**
   - One visual container + heading — subtle scroll-linked translate/scale (`scrub`)
4. **Footer / Static Control Section:**
   - Static text block to verify zero unintended global CLS or layout shifts

> Note: When a plugin does not support a specific capability (for example, `SplitText` or `ScrollTrigger scrub`), the fixture documents the exact fallback used and notes the capability difference transparently rather than penalizing or modifying unrelated sections.

---

## 4. Measurement Protocol (`scripts/measure-page.mjs`)

Run the Node.js ESM Playwright harness against the published test URL:

```bash
node scripts/measure-page.mjs http://localhost:8080/bench-gutenberg-motion/ \
  --label "Gutenberg Motion" \
  --runs 5 \
  --wait-ms 1500 \
  --out results/gutenberg-motion.json
```

### Collected Metrics

- **`js_transfer_bytes` / `js_transfer_kb`**: Sum of encoded wire bytes (`encodedDataLength`) for all `Script` resources loaded on initial page load.
- **`js_requests` & `total_requests`**: Count of JavaScript requests and total HTTP requests.
- **`total_transfer_bytes`**: Sum of encoded wire bytes across all HTTP responses.
- **`dom_nodes`**: `document.querySelectorAll('*').length` after settle.
- **`ttfb_ms`**: Navigation Timing `responseStart - requestStart`.
- **`lcp_ms`**: Largest Contentful Paint captured via `PerformanceObserver('largest-contentful-paint')`.
- **`cls`**: Cumulative Layout Shift captured via `PerformanceObserver('layout-shift')` excluding entries with `hadRecentInput === true`.
- **`tbt_ms`**: Total Blocking Time (`sum(max(0, duration - 50))`) from `PerformanceObserver('longtask')` entries occurring after First Contentful Paint (`first-contentful-paint`).
- **`gsap_detection`**: Checks loaded script URLs for `gsap`, `ScrollTrigger`, and `SplitText`, plus `window.gsap`, `window.ScrollTrigger`, and `window.SplitText` globals.

---

## 5. `prefers-reduced-motion` Verification Pass

After the 5 standard runs, `measure-page.mjs` launches an additional cold-cache Chromium context configured with `reducedMotion: 'reduce'` (`@media (prefers-reduced-motion: reduce)` active) and records:

- `reduced_motion_media_matched`: confirms the browser reported `(prefers-reduced-motion: reduce)` as `true`.
- `gsap_detected`: whether GSAP is present on the page.
- `active_gsap_tweens`: number of non-zero-duration tweens active on `gsap.globalTimeline`.
- `hidden_inline_opacity_zero_count`: number of visible-flow elements left with computed `opacity === "0"` after settle (catches accessibility bugs where reduced motion skips the animation but leaves initial hidden elements invisible).

---

## 6. Submitting Verified Benchmark PRs

To submit a measured run to `data/matrix.json`:

1. Keep the exact structure of `benchmark_runs` in `data/matrix.json`.
2. Include `plugin_version`, `wp_version`, `builder_version`, `php_version`, `measured_at` (ISO-8601), `hardware_os`, `medians`, and `reduced_motion_check`.
3. Attach the raw output JSON from `scripts/measure-page.mjs` in `results/` or the PR description so anyone can audit all 5 runs.
