import { env } from "../config/env.js";

let timerId: NodeJS.Timeout | null = null;
let isRunning = false;

// Random jitter: +/- 45 seconds around base interval (default: 10 minutes)
const BASE_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const JITTER_MAX_MS = 45 * 1000; // 45 seconds

function getTargetUrl(): string {
  // Render automatically sets RENDER_EXTERNAL_URL (e.g. https://offscript-p9rk.onrender.com)
  const renderUrl = process.env.RENDER_EXTERNAL_URL?.trim();
  if (renderUrl) {
    return renderUrl.replace(/\/$/, "");
  }

  const publicUrl = env.PUBLIC_BASE_URL?.trim();
  if (publicUrl && !publicUrl.includes("localhost") && !publicUrl.includes("127.0.0.1")) {
    return publicUrl.replace(/\/$/, "");
  }

  // Production Render service fallback
  return "https://offscript-p9rk.onrender.com";
}

async function sendKeepAlivePing(): Promise<void> {
  const baseUrl = getTargetUrl();
  const pingUrl = `${baseUrl}/health?keepalive=1&t=${Date.now()}`;

  try {
    const res = await fetch(pingUrl, {
      method: "GET",
      headers: {
        "User-Agent": "OFFSCRIPT-KeepAlive/2.0 (+https://offscript-tan.vercel.app)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15000), // 15-second timeout
    });

    if (res.ok) {
      console.log(`⚡ [KeepAlive] Anti-sleep ping successful → ${baseUrl}/health (Status: ${res.status})`);
    } else {
      console.warn(`⚠️ [KeepAlive] Ping responded with status ${res.status}`);
    }
  } catch (err: any) {
    // Graceful log: network glitches should not disrupt server operation
    console.warn(`ℹ️ [KeepAlive] Ping attempted to ${baseUrl}/health: ${err.message || "Network timeout"}`);
  }
}

function scheduleNextPing(): void {
  if (!isRunning) return;

  // Add random variation to avoid pattern matching
  const jitter = Math.floor(Math.random() * (2 * JITTER_MAX_MS)) - JITTER_MAX_MS;
  const delay = Math.max(5 * 60 * 1000, BASE_INTERVAL_MS + jitter);

  timerId = setTimeout(async () => {
    if (!isRunning) return;
    await sendKeepAlivePing();
    scheduleNextPing();
  }, delay);
}

/**
 * Starts the background keep-alive ping loop.
 * Automatically disabled in test environments to keep test runners fast.
 */
export function startKeepAliveService(): void {
  if (env.NODE_ENV === "test") {
    return;
  }

  if (isRunning) {
    return;
  }

  isRunning = true;
  const target = getTargetUrl();
  console.log(`🛡️  [KeepAlive] Anti-sleep service active. Pinging ${target}/health every ~10 minutes.`);

  // First warm-up ping after 2 minutes to let the server settle
  const initialDelay = 2 * 60 * 1000;
  timerId = setTimeout(async () => {
    if (!isRunning) return;
    await sendKeepAlivePing();
    scheduleNextPing();
  }, initialDelay);
}

/**
 * Stops the keep-alive ping loop for clean graceful shutdown.
 */
export function stopKeepAliveService(): void {
  isRunning = false;
  if (timerId) {
    clearTimeout(timerId);
    timerId = null;
  }
  console.log("🛑 [KeepAlive] Anti-sleep service stopped.");
}
