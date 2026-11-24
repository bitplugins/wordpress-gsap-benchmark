# 2026 WordPress GSAP Animation Compatibility & Performance Matrix

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status: Architecture Verified / Runtime Pending](https://img.shields.io/badge/Runtime_Benchmarks-Pending_Local_Run-amber.svg)](#reproducible-runtime-benchmark-slots)

An open, reproducible compatibility matrix and Playwright-based measurement harness for **2026 WordPress GSAP animation plugins** across **Divi 5**, **Gutenberg (Block Editor)**, and **Elementor 4**, compared alongside each builder's native core capabilities.

> **Conflict-of-Interest Disclosure:** This repository is maintained by [**bitPlugins**](https://bitplugins.com/) (creator of DiviTitan Motion, Gutenberg Motion, and Elementor Motion). To keep this dataset verifiable and fair, **all runtime performance cells are intentionally left `pending_local_run` until measured on a clean local WordPress test harness** using [`scripts/measure-page.mjs`](scripts/measure-page.mjs). **Pull requests with reproducible test captures, corrections, or documentation updates from any plugin author or community member are welcome.**

---

## Data Separation & Truthfulness Policy

This repository strictly separates two types of data:

1. **Verified Public Architecture & Documentation Facts** *(Reviewed `2026-11-23`)* — Directly verifiable capabilities, target builder support, lock-in behavior, pricing models, and documented features linked to each vendor's official documentation or WordPress.org listing.
2. **Reproducible Runtime Benchmark Slots** *(`status: "pending_local_run"`)* — Actual JS transfer bytes, HTTP request counts, DOM nodes, TTFB, LCP, CLS, TBT, GSAP script detection, and `prefers-reduced-motion` runtime checks collected by running `node scripts/measure-page.mjs` against identical WordPress test pages. **Zero Lighthouse scores, bundle KBs, or Core Web Vitals numbers are fabricated or estimated.**

---

## Architecture & Compatibility Matrix

*Last reviewed: `2026-11-23`. Machine-readable dataset: [`data/matrix.json`](data/matrix.json).*

| Plugin / Core | Target Builder | Works on Existing Core Blocks/Modules Without Lock-In? | GSAP Engine | Visual Timeline | Split-Text | ScrollTrigger | Page Transitions | `prefers-reduced-motion` | AI Workflow | Pricing Model | Source URL |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **DiviTitan Motion** | Divi 5 | **Yes** (animates existing Divi 5 sections, rows, columns & modules non-destructively) | Yes (GSAP + ScrollTrigger + SplitText) | Yes (Simple, Staged & Advanced Timeline; up to 10 steps/triggers per layer) | Yes (lines, words, chars) | Yes (scroll, scrub, pin, reverse) | Yes (dedicated same-site Page Transitions system) | Yes (documented reduced-motion handling) | Yes (One-Click AI Motion + AI Preset Creator; 500 hosted credits, BYOK via WP 7.0+ connectors) | Lifetime direct (`$64.50` Solo / `$124.50` Agency) | [divititan.com](https://divititan.com/) |
| **DiviMotion** | Divi 5 | **Partial** (Animation Builder panel on Divi containers/modules + 20+ dedicated custom motion modules/extensions) | Yes (GSAP + ScrollTrigger, SplitText, ScrollSmoother, DrawSVG) | Yes (Visual Animation Timeline with color-coded tracks) | Yes | Yes (scroll, scrub, pin, horizontal scroll) | Yes (Page Transitions extension) | Not publicly specified in reviewed docs *(verify at runtime)* | No (manual visual builder & layout packs) | Annual (`$49–$79/yr`) & Lifetime (`$149+`) | [divimotion.com](https://divimotion.com/) |
| **DiviAnimator** | Divi 5 | **Partial** (modular Divi 5 extensions + pre-built animated section templates) | Yes (GSAP + ScrollTrigger, ScrollSmoother) | Yes (visual GSAP timeline & parameter controls) | Yes (kinetic text splitting) | Yes (ScrollTrigger & ScrollSmoother) | Partial (preloaders & page-load triggers documented) | Not publicly specified in reviewed docs *(verify at runtime)* | No (manual parameter controls) | Lifetime (`~$39–$79` promo tiers) & Annual starter (`~$19/yr`) | [divianimator.com](https://divianimator.com/) |
| **MotionKit** | Multi-builder (Divi, Elementor, Gutenberg, Bricks, Breakdance, Oxygen, Avada) | **Yes** (targets rendered CSS classes via lightweight WP connector; published animations persist locally) | Yes (GSAP + ScrollTrigger, SplitText, ScrollSmoother, DrawSVG, MorphSVG, Flip) | Yes (cloud visual timeline editor + 110+ presets) | Yes | Yes (ScrollTrigger + ScrollSmoother) | Yes (Pro / Agency tiers) | Not publicly specified in reviewed docs *(verify at runtime)* | Yes (AI chat prompt workflow via Claude/ChatGPT) | Freemium (`$0` 1 site / 1 page / 10 animations), Annual (`$24.50–$99.50/yr` promo), Lifetime (`$53.40–$199.50+`) | [motionkit.io](https://motionkit.io/) |
| **Gutenberg Motion** | WordPress Block Editor (Gutenberg, WP 6.5+) | **Yes** (applies directly to existing core blocks, lists, buttons & patterns without wrapper blocks) | Yes (GSAP + ScrollTrigger + SplitText) | Yes (Simple, Staged & Advanced Timeline; 251+ presets; 10 trigger types) | Yes (lines, words, chars) | Yes (scroll, scrub, pin, stagger) | Yes (native page transitions) | Yes (respects `prefers-reduced-motion`) | Yes (One-Click AI Motion + AI Preset Creator; 500 hosted credits, BYOK via WP 7.0+ connectors) | Lifetime direct (`$74.50` Solo / `$124.50` Agency) | [bitplugins.com](https://bitplugins.com/products/gutenberg-motion/) |
| **Greenshift** | WordPress Block Editor (Gutenberg / FSE) | **Partial** (basic CSS/scroll animations on core blocks; full GSAP timelines/SplitText use Animation Container or Greenshift blocks) | Yes (via premium Animation Addon; free core uses lightweight CSS/scroll engine) | Yes (sequential & parallel GSAP chains in Animation Addon) | Yes (Animation Addon) | Yes (ScrollTrigger, scrub, pin, batch in Animation Addon) | Yes (View Transitions / Page Transitions) | Not publicly specified across GSAP addon docs *(verify at runtime)* | Yes (Smart Code AI & AI design agents in ecosystem) | Freemium (`wordpress.org` core free; Animation Addon / Bundles `~$39.99–$239.99+/yr` or Lifetime) | [greenshiftwp.com](https://greenshiftwp.com/) |
| **Elementor Motion** | Elementor 4 (Atomic Editor only; not v3) | **Yes** (animates existing Elementor 4 widgets & containers without replacement widget packs) | Yes (GSAP + ScrollTrigger + SplitText) | Yes (Simple, Staged & Advanced Timeline; 251+ presets; 10 trigger types) | Yes (lines, words, chars) | Yes (scroll, scrub, stagger) | Yes (native page transitions) | Yes (respects `prefers-reduced-motion`) | Yes (One-Click AI Motion + AI Preset Creator; 500 hosted credits, BYOK via WP 7.0+ connectors) | Lifetime direct (Solo & Agency tiers; `$74.50–$89.00` Solo / `$124.50` Agency) | [bitplugins.com](https://bitplugins.com/products/elementor-motion/) |
| **Animation Addons** | Elementor (v3 Classic & Elementor 4 Atomic) | **Hybrid** (extends Elementor widgets + ships 40+ Elementor 4 Atomic widgets & GSAP extensions) | Yes (GSAP + ScrollTrigger, ScrollSmoother, SplitText, DrawSVG, MotionPath) | Yes (timeline-based sequence animations inside Elementor) | Yes (Text Animation via SplitText) | Yes (ScrollTrigger, scrub, pin, horizontal scroll) | Partial (smooth scroll & loaders; conditional lazy loading) | Yes (explicit reduced-motion toggles & `prefers-reduced-motion` checks) | No (no native AI motion generator documented) | Freemium (`wordpress.org` free + Pro `$49–$159/yr` or `$85–$399` Lifetime) | [animation-addons.com](https://animation-addons.com/) |
| **Essential Blocks** | WordPress Block Editor (Gutenberg) | **Partial** (70+ custom block suite; Pro Interactive Animation extension + Animated Wrapper) | Yes (Pro Interactive Animation extension built on GSAP) | Limited (`From` / `To` / `From-To` transitions) | No | Yes (scroll trigger via Pro Interactive Animation) | No | Not publicly specified in reviewed Interactive Animation docs *(verify at runtime)* | No (AI block content tools, not AI GSAP motion) | Freemium (`wordpress.org` free + Pro `~$49–$349/yr` / Visionary Lifetime) | [essential-blocks.com](https://essential-blocks.com/) |
| **Divi 5 Core** *(Baseline)* | Divi 5 | **Yes** (built into Divi 5) | No (native CSS / scroll transforms) | No (basic duration/delay per module) | No | Partial (basic scroll transform effects) | No | Partial (OS/CSS level only) | No (Divi AI does not generate GSAP timelines) | Included with Divi license | [elegantthemes.com](https://www.elegantthemes.com/) |
| **Gutenberg Core** *(Baseline)* | WordPress 6.8 / 6.9 | **Yes** (WordPress Core) | No | No | No | No | No | Yes (core theme/CSS `prefers-reduced-motion` standards) | No | Free / Open Source (GPLv2+) | [wordpress.org](https://wordpress.org/) |
| **Elementor 4 Core** *(Baseline)* | Elementor 4 | **Yes** (built into Elementor 4) | No (CSS-first Atomic transitions & transforms) | No | No | Partial (Pro motion effects) | No | Yes (frontend core `prefers-reduced-motion` support) | No (Elementor AI does not generate GSAP timelines) | Free Core / Pro Annual | [elementor.com](https://elementor.com/) |

---

## Reproducible Runtime Benchmark Slots

All runtime slots below are intentionally `pending_local_run` until executed against identical local WordPress 6.8/6.9 test pages via [`scripts/measure-page.mjs`](scripts/measure-page.mjs).

| Plugin / Core | Status | Median JS Payload (KB) | Median Total Requests | Median DOM Nodes | Median TTFB (ms) | Median LCP (ms) | Median CLS | Median TBT (ms) | `prefers-reduced-motion` Check |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DiviTitan Motion | `pending_local_run` | `—` | `—` | `—` | `—` | `—` | `—` | `—` | `pending_local_run` |
| DiviMotion | `pending_local_run` | `—` | `—` | `—` | `—` | `—` | `—` | `—` | `pending_local_run` |
| DiviAnimator | `pending_local_run` | `—` | `—` | `—` | `—` | `—` | `—` | `—` | `pending_local_run` |
| MotionKit | `pending_local_run` | `—` | `—` | `—` | `—` | `—` | `—` | `—` | `pending_local_run` |
| Gutenberg Motion | `pending_local_run` | `—` | `—` | `—` | `—` | `—` | `—` | `—` | `pending_local_run` |
| Greenshift | `pending_local_run` | `—` | `—` | `—` | `—` | `—` | `—` | `—` | `pending_local_run` |
| Elementor Motion | `pending_local_run` | `—` | `—` | `—` | `—` | `—` | `—` | `—` | `pending_local_run` |
| Animation Addons | `pending_local_run` | `—` | `—` | `—` | `—` | `—` | `—` | `—` | `pending_local_run` |
| Essential Blocks | `pending_local_run` | `—` | `—` | `—` | `—` | `—` | `—` | `—` | `pending_local_run` |
| Divi 5 Core *(Baseline)* | `pending_local_run` | `—` | `—` | `—` | `—` | `—` | `—` | `—` | `pending_local_run` |
| Gutenberg Core *(Baseline)* | `pending_local_run` | `—` | `—` | `—` | `—` | `—` | `—` | `—` | `pending_local_run` |
| Elementor 4 Core *(Baseline)* | `pending_local_run` | `—` | `—` | `—` | `—` | `—` | `—` | `—` | `pending_local_run` |

---

## Reproducible Benchmark Protocol (Quick Start)

Read [`METHODOLOGY.md`](METHODOLOGY.md) for full harness rules before submitting results.

### 1. Install Dependencies

Requires **Node.js 20+** and Chromium via Playwright:

```bash
npm install
npx playwright install chromium
```

### 2. Run the Measurement Harness

Point `scripts/measure-page.mjs` at a clean, unauthenticated WordPress test page (no admin bar, no page-cache plugins altering scripts differently across runs):

```bash
node scripts/measure-page.mjs http://localhost:8080/benchmark-hero-cards/ \
  --label "Gutenberg Motion vX.Y.Z" \
  --runs 5 \
  --out results/gutenberg-motion.json
```

### 3. What `measure-page.mjs` Collects

For each of the 5 cold-cache Chromium runs:
- **JS Transfer Payload (`js_transfer_bytes` / `js_transfer_kb`)** and **JS Request Count** via Chromium DevTools Protocol (`Network.loadingFinished` wire `encodedDataLength`)
- **Total HTTP Requests & Total Transfer Bytes**
- **DOM Node Count** (`document.querySelectorAll('*').length`)
- **TTFB (`ttfb_ms`)**, **LCP (`lcp_ms`)**, **CLS (`cls`)**, and **TBT (`tbt_ms`)** via Navigation Timing + `PerformanceObserver`
- **GSAP Runtime Detection** (`window.gsap`, `window.ScrollTrigger`, `window.SplitText`, plus matched script URLs)
- **Dedicated `prefers-reduced-motion: reduce` Pass** in an isolated browser context verifying media-query match, active GSAP tween count, and whether animated nodes remain stuck at `opacity: 0`

---

## Contributing & Corrections

Plugin authors, performance engineers, and WordPress developers are encouraged to open issues or PRs:
- **Documentation corrections:** Include the exact official doc/changelog URL and review date.
- **Benchmark submissions:** Attach the raw JSON output from `scripts/measure-page.mjs`, WordPress/PHP/builder/plugin version numbers, and confirmation that the test followed [`METHODOLOGY.md`](METHODOLOGY.md).

## License

MIT — see [`LICENSE`](LICENSE).
