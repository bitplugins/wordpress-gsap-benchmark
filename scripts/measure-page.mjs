#!/usr/bin/env node
/**
 * Reproducible Playwright performance & GSAP telemetry harness for WordPress pages.
 *
 * Usage:
 *   node scripts/measure-page.mjs <url> [--runs 5] [--wait-ms 1500] [--label "Plugin"] [--out results.json]
 */

import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

function printHelp() {
  console.log(`Usage:
  node scripts/measure-page.mjs <url> [options]

Options:
  --runs <number>      Number of cold-cache Chromium runs (default: 5)
  --wait-ms <number>   Settle delay after load in milliseconds (default: 1500)
  --label <string>     Optional label for the tested plugin/configuration
  --out <path>         Optional JSON output file path (defaults to stdout)
  --help               Show this help message
`);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    return { help: true };
  }

  let url = null;
  let runs = 5;
  let waitMs = 1500;
  let label = null;
  let out = null;

  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];
    if (token === "--runs") {
      runs = Number.parseInt(args[++i], 10);
    } else if (token === "--wait-ms") {
      waitMs = Number.parseInt(args[++i], 10);
    } else if (token === "--label") {
      label = args[++i] ?? null;
    } else if (token === "--out") {
      out = args[++i] ?? null;
    } else if (!token.startsWith("-") && !url) {
      url = token;
    } else {
      throw new Error(`Unknown or unexpected argument: ${token}`);
    }
  }

  if (!url) {
    throw new Error("Target <url> is required.");
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error(`Unsupported URL protocol: ${parsedUrl.protocol}`);
  }
  if (!Number.isInteger(runs) || runs < 1 || runs > 50) {
    throw new Error(`--runs must be an integer between 1 and 50 (received: ${runs})`);
  }
  if (!Number.isInteger(waitMs) || waitMs < 0 || waitMs > 30000) {
    throw new Error(`--wait-ms must be an integer between 0 and 30000 (received: ${waitMs})`);
  }

  return { help: false, url: parsedUrl.toString(), runs, waitMs, label, out };
}

function median(values) {
  const valid = values
    .filter((v) => typeof v === "number" && Number.isFinite(v))
    .sort((a, b) => a - b);
  if (valid.length === 0) return null;
  const mid = Math.floor(valid.length / 2);
  if (valid.length % 2 === 1) return valid[mid];
  return Number(((valid[mid - 1] + valid[mid]) / 2).toFixed(4));
}

function round(value, decimals = 2) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Number(value.toFixed(decimals));
}

async function installWebVitalsObservers(page) {
  await page.addInitScript(() => {
    window.__bpBench = {
      lcpMs: null,
      fcpMs: null,
      cls: 0,
      longTasks: [],
    };

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === "first-contentful-paint" && window.__bpBench.fcpMs === null) {
            window.__bpBench.fcpMs = entry.startTime;
          }
        }
      }).observe({ type: "paint", buffered: true });
    } catch {
      // Unsupported in older environments
    }

    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          window.__bpBench.lcpMs = entries[entries.length - 1].startTime;
        }
      }).observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
      // Unsupported
    }

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            window.__bpBench.cls += entry.value;
          }
        }
      }).observe({ type: "layout-shift", buffered: true });
    } catch {
      // Unsupported
    }

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.__bpBench.longTasks.push({
            startTime: entry.startTime,
            duration: entry.duration,
          });
        }
      }).observe({ type: "longtask", buffered: true });
    } catch {
      // Unsupported
    }
  });
}

async function measureSingleRun(browser, url, waitMs, { reducedMotion = "no-preference" } = {}) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion,
    ignoreHTTPSErrors: true,
  });

  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });

  const requests = new Map();
  const scriptUrls = [];

  cdp.on("Network.requestWillBeSent", (evt) => {
    requests.set(evt.requestId, {
      url: evt.request.url,
      type: evt.type || "Other",
      encodedBytes: 0,
      status: null,
    });
  });

  cdp.on("Network.responseReceived", (evt) => {
    const rec = requests.get(evt.requestId) || {
      url: evt.response.url,
      type: evt.type || "Other",
      encodedBytes: 0,
      status: null,
    };
    rec.type = evt.type || rec.type;
    rec.status = evt.response.status;
    if (rec.type === "Script") {
      scriptUrls.push(rec.url);
    }
    requests.set(evt.requestId, rec);
  });

  cdp.on("Network.loadingFinished", (evt) => {
    const rec = requests.get(evt.requestId);
    if (rec && typeof evt.encodedDataLength === "number") {
      rec.encodedBytes = evt.encodedDataLength;
    }
  });

  await installWebVitalsObservers(page);

  const response = await page.goto(url, { waitUntil: "load", timeout: 45000 });
  try {
    await page.waitForLoadState("networkidle", { timeout: 5000 });
  } catch {
    // Allow long-polling / keepalive connections without failing measurement
  }

  if (waitMs > 0) {
    await page.waitForTimeout(waitMs);
  }

  const domTelemetry = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    const ttfbMs = nav ? Math.max(0, nav.responseStart - nav.requestStart) : null;
    const bench = window.__bpBench || { lcpMs: null, fcpMs: null, cls: 0, longTasks: [] };

    const fcpAnchor = typeof bench.fcpMs === "number" ? bench.fcpMs : 0;
    let tbtMs = 0;
    for (const task of bench.longTasks) {
      if (task.startTime + task.duration > fcpAnchor) {
        tbtMs += Math.max(0, task.duration - 50);
      }
    }

    const hasGsap = typeof window.gsap !== "undefined";
    const hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";
    const hasSplitText = typeof window.SplitText !== "undefined";

    let activeGsapTweens = 0;
    if (hasGsap && window.gsap?.globalTimeline?.getChildren) {
      const children = window.gsap.globalTimeline.getChildren(true, true, false) || [];
      activeGsapTweens = children.filter((tween) => {
        const dur = typeof tween.duration === "function" ? tween.duration() : 0;
        return dur > 0;
      }).length;
    }

    const bodyNodes = document.querySelectorAll("body *");
    let hiddenOpacityZeroCount = 0;
    for (const el of bodyNodes) {
      const style = window.getComputedStyle(el);
      if (style.display !== "none" && style.visibility !== "hidden" && style.opacity === "0") {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          hiddenOpacityZeroCount += 1;
        }
      }
    }

    return {
      domNodes: document.querySelectorAll("*").length,
      ttfbMs,
      lcpMs: bench.lcpMs,
      fcpMs: bench.fcpMs,
      cls: bench.cls,
      tbtMs,
      reducedMotionMatched: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      gsapGlobals: {
        gsap: hasGsap,
        scrollTrigger: hasScrollTrigger,
        splitText: hasSplitText,
        activeGsapTweens,
      },
      hiddenOpacityZeroCount,
    };
  });

  await context.close();

  const records = Array.from(requests.values());
  const jsRecords = records.filter((r) => r.type === "Script");
  const totalTransferBytes = records.reduce((acc, r) => acc + (r.encodedBytes || 0), 0);
  const jsTransferBytes = jsRecords.reduce((acc, r) => acc + (r.encodedBytes || 0), 0);
  const gsapScripts = scriptUrls.filter((u) => /gsap|scrolltrigger|splittext|greensock/i.test(u));

  return {
    http_status: response ? response.status() : null,
    total_requests: records.length,
    js_requests: jsRecords.length,
    total_transfer_bytes: totalTransferBytes,
    total_transfer_kb: round(totalTransferBytes / 1024, 2),
    js_transfer_bytes: jsTransferBytes,
    js_transfer_kb: round(jsTransferBytes / 1024, 2),
    dom_nodes: domTelemetry.domNodes,
    ttfb_ms: round(domTelemetry.ttfbMs, 2),
    fcp_ms: round(domTelemetry.fcpMs, 2),
    lcp_ms: round(domTelemetry.lcpMs, 2),
    cls: round(domTelemetry.cls, 4),
    tbt_ms: round(domTelemetry.tbtMs, 2),
    gsap_detection: {
      script_urls: gsapScripts,
      globals: domTelemetry.gsapGlobals,
    },
    reduced_motion_media_matched: domTelemetry.reducedMotionMatched,
    hidden_opacity_zero_count: domTelemetry.hiddenOpacityZeroCount,
  };
}

async function main() {
  const opts = parseArgs(process.argv);
  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const runs = [];
    for (let i = 0; i < opts.runs; i += 1) {
      const result = await measureSingleRun(browser, opts.url, opts.waitMs, {
        reducedMotion: "no-preference",
      });
      runs.push({ run_index: i + 1, ...result });
    }

    const reducedMotionPass = await measureSingleRun(browser, opts.url, opts.waitMs, {
      reducedMotion: "reduce",
    });

    const summary = {
      schema_version: "1.0.0",
      label: opts.label,
      url: opts.url,
      measured_at: new Date().toISOString(),
      run_count: opts.runs,
      wait_ms: opts.waitMs,
      medians: {
        total_requests: median(runs.map((r) => r.total_requests)),
        js_requests: median(runs.map((r) => r.js_requests)),
        total_transfer_bytes: median(runs.map((r) => r.total_transfer_bytes)),
        total_transfer_kb: median(runs.map((r) => r.total_transfer_kb)),
        js_transfer_bytes: median(runs.map((r) => r.js_transfer_bytes)),
        js_transfer_kb: median(runs.map((r) => r.js_transfer_kb)),
        dom_nodes: median(runs.map((r) => r.dom_nodes)),
        ttfb_ms: median(runs.map((r) => r.ttfb_ms)),
        fcp_ms: median(runs.map((r) => r.fcp_ms)),
        lcp_ms: median(runs.map((r) => r.lcp_ms)),
        cls: median(runs.map((r) => r.cls)),
        tbt_ms: median(runs.map((r) => r.tbt_ms)),
      },
      gsap_detection: runs[0]?.gsap_detection ?? null,
      reduced_motion_check: {
        media_query_matched: reducedMotionPass.reduced_motion_media_matched,
        gsap_detected:
          reducedMotionPass.gsap_detection.globals.gsap ||
          reducedMotionPass.gsap_detection.script_urls.length > 0,
        active_gsap_tweens: reducedMotionPass.gsap_detection.globals.activeGsapTweens,
        hidden_opacity_zero_count: reducedMotionPass.hidden_opacity_zero_count,
      },
      runs,
    };

    const json = `${JSON.stringify(summary, null, 2)}\n`;
    if (opts.out) {
      const outPath = path.resolve(opts.out);
      await fs.mkdir(path.dirname(outPath), { recursive: true });
      await fs.writeFile(outPath, json, "utf8");
      console.error(`Wrote benchmark output to ${outPath}`);
    } else {
      process.stdout.write(json);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
