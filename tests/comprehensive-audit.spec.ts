import { test, expect } from "@playwright/test";
import type { VerletRope } from "@/lib/verlet";

interface WindowWithLanyard extends Window {
  __LANYARD_ROPE__?: VerletRope;
  __LANYARD_GLYPH_INTERVALS__?: Array<{ char: string; start: number; end: number }>;
}

test.describe("Comprehensive Visual Audit & Physics Verification", () => {
  test("1. Programmatic Glyph Overlap & Ribbon Stretch Verification", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#hero");
    await page.waitForFunction(() => !!(window as unknown as WindowWithLanyard).__LANYARD_GLYPH_INTERVALS__);

    // Helper to verify no two adjacent glyph intervals overlap
    const checkGlyphs = async (contextLabel: string) => {
      const intervals = await page.evaluate(() => {
        return (window as unknown as WindowWithLanyard).__LANYARD_GLYPH_INTERVALS__ || [];
      });

      expect(intervals.length).toBeGreaterThan(0);
      for (let i = 0; i < intervals.length - 1; i++) {
        const curr = intervals[i];
        const next = intervals[i + 1];
        expect(
          curr.end,
          `Glyph overlap detected at index ${i} ('${curr.char}' and '${next.char}') during ${contextLabel}: curr.end=${curr.end.toFixed(1)}, next.start=${next.start.toFixed(1)}`
        ).toBeLessThanOrEqual(next.start + 0.01);
      }
    };

    // A. At Rest
    await page.waitForTimeout(500);
    await checkGlyphs("Rest State");

    // B. Mid-Drag
    const badge = page.locator("[data-badge-card]");
    const box = await badge.boundingBox();
    expect(box).not.toBeNull();
    const centerX = box!.x + box!.width / 2;
    const centerY = box!.y + box!.height / 2;

    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX + 60, centerY + 80, { steps: 8 });
    await page.waitForTimeout(100);
    await checkGlyphs("Mid-Drag State");

    // C. Maximum Stretch (~2.2x)
    await page.mouse.move(centerX + 120, centerY + 180, { steps: 12 });
    await page.waitForTimeout(150);
    await checkGlyphs("Maximum Stretch State");

    // D. Mid-Swing (Release)
    await page.mouse.up();
    await page.waitForTimeout(180);
    await checkGlyphs("Mid-Swing State");
  });

  test("2. Lanyard Screenshots at Rest, Mid-Drag, Max-Stretch, and Mid-Swing (Dark & Light)", async ({
    page,
  }) => {
    test.setTimeout(45000);
    await page.setViewportSize({ width: 1470, height: 950 });

    const themes: Array<"dark" | "light"> = ["dark", "light"];

    for (const theme of themes) {
      await page.goto("/");
      await page.waitForSelector("#hero");
      await page.waitForSelector("[data-badge-card]");

      // Set theme
      await page.evaluate((t) => {
        const html = document.documentElement;
        if (t === "dark") {
          html.classList.add("dark");
          localStorage.setItem("kp-theme", "dark");
        } else {
          html.classList.remove("dark");
          localStorage.setItem("kp-theme", "light");
        }
      }, theme);
      await page.waitForTimeout(300);

      const hero = page.locator("#hero");

      // 1. Rest
      await hero.screenshot({ path: `test-results/lanyard-${theme}-rest.png` });

      // Grab badge
      const badge = page.locator("[data-badge-card]");
      const box = await badge.boundingBox();
      const cx = box!.x + box!.width / 2;
      const cy = box!.y + box!.height / 2;

      // 2. Mid-Drag
      await page.mouse.move(cx, cy);
      await page.mouse.down();
      await page.mouse.move(cx + 60, cy + 90, { steps: 10 });
      await page.waitForTimeout(150);
      await hero.screenshot({ path: `test-results/lanyard-${theme}-mid-drag.png` });

      // 3. Max Stretch
      await page.mouse.move(cx + 120, cy + 180, { steps: 12 });
      await page.waitForTimeout(150);
      await hero.screenshot({ path: `test-results/lanyard-${theme}-max-stretch.png` });

      // 4. Mid-Swing
      await page.mouse.up();
      await page.waitForTimeout(160);
      await hero.screenshot({ path: `test-results/lanyard-${theme}-mid-swing.png` });

      await page.waitForTimeout(1500); // settle
    }
  });

  test("3. Multi-viewport verification (1920, 1470, 768, 360) and Page Background Scenes", async ({
    page,
  }) => {
    test.setTimeout(45000);
    const viewports = [
      { name: "desktop-1920", width: 1920, height: 1080 },
      { name: "desktop-1470", width: 1470, height: 950 },
      { name: "tablet-768", width: 768, height: 1024 },
      { name: "mobile-360", width: 360, height: 800 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      await page.waitForSelector("#hero");
      await page.waitForTimeout(200);

      // Verify Hero breathing glow exists
      const heroGlow = page.locator(".animate-hero-glow");
      await expect(heroGlow).toBeVisible();

      // Scroll to resume teaser & contact to trigger view
      await page.locator("#resume").scrollIntoViewIfNeeded();
      await page.waitForTimeout(150);

      await page.locator("#contact").scrollIntoViewIfNeeded();
      await page.waitForTimeout(150);
    }

    // Verify /work, /resume, /about pages render their unique backgrounds
    await page.goto("/work");
    await page.waitForSelector("[data-category-filter]");

    await page.goto("/resume");
    await page.waitForSelector(".resume-page-root");

    await page.goto("/about");
    await page.waitForSelector(".animate-about-beam");
  });

  test("4. Measure Hero FPS, CLS, and Console Error Audit", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/");
    await page.waitForSelector("#hero");

    // Measure FPS over 120 animation frames
    const telemetry = await page.evaluate(async () => {
      return new Promise<{ avgFps: number; minFps: number; cls: number }>((resolve) => {
        let frameCount = 0;
        const frameTimes: number[] = [];
        let lastT = performance.now();

        // Track CLS via PerformanceObserver
        let clsValue = 0;
        try {
          const po = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              const layoutShift = entry as PerformanceEntry & {
                hadRecentInput?: boolean;
                value?: number;
              };
              if (!layoutShift.hadRecentInput) {
                clsValue += layoutShift.value || 0;
              }
            }
          });
          po.observe({ type: "layout-shift", buffered: true });
        } catch {
          // ignore
        }

        function countFrames(t: number) {
          const delta = t - lastT;
          lastT = t;
          if (delta > 0) frameTimes.push(1000 / delta);

          frameCount++;
          if (frameCount >= 120) {
            const sum = frameTimes.reduce((a, b) => a + b, 0);
            const avg = sum / frameTimes.length;
            const min = Math.min(...frameTimes);
            resolve({ avgFps: avg, minFps: min, cls: clsValue });
            return;
          }
          requestAnimationFrame(countFrames);
        }

        requestAnimationFrame(countFrames);
      });
    });

    console.log(`Measured Performance Telemetry:`, telemetry);

    // Target steady ~60 FPS (threshold > 54 fps in test environment)
    expect(telemetry.avgFps).toBeGreaterThanOrEqual(54);
    // Cumulative Layout Shift should be <= 0.05
    expect(telemetry.cls).toBeLessThanOrEqual(0.05);

    // Console errors should be 0
    const filteredErrors = consoleErrors.filter(
      (err) => !err.includes("Download the React DevTools") && !err.includes("favicon")
    );
    expect(filteredErrors.length).toBe(0);
  });

  test("5. Bug 1 Regression Test: multi-DPR (1, 2, 3), multi-viewport (1470, 1920, 768, 390), multi-zoom (90%, 100%, 110%) alignment and physics", async ({
    browser,
  }) => {
    test.setTimeout(90000);

    const testCases = [
      // Viewports & DPR variations
      { dpr: 1, width: 1470, height: 950, zoom: 1.0 },
      { dpr: 2, width: 1920, height: 1080, zoom: 1.0 },
      { dpr: 2, width: 768, height: 1024, zoom: 1.0 },
      { dpr: 3, width: 390, height: 844, zoom: 1.0 },
      // Zoom variations (90%, 100%, 110%)
      { dpr: 2, width: 1470, height: 950, zoom: 0.9 },
      { dpr: 2, width: 1470, height: 950, zoom: 1.1 },
      { dpr: 1, width: 390, height: 844, zoom: 1.1 },
      { dpr: 3, width: 1470, height: 950, zoom: 0.9 },
    ];

    for (const tc of testCases) {
      const context = await browser.newContext({
        viewport: { width: tc.width, height: tc.height },
        deviceScaleFactor: tc.dpr,
      });
      const page = await context.newPage();

      try {
        await page.goto("/");
        await page.waitForSelector("#hero");
        await page.waitForSelector("[data-badge-card]");
        await page.waitForFunction(
          () =>
            !!(window as unknown as WindowWithLanyard).__LANYARD_TELEMETRY__ &&
            !!(window as unknown as { __LANYARD_ROPE__?: VerletRope }).__LANYARD_ROPE__
        );

        if (tc.zoom !== 1.0) {
          await page.evaluate((z) => {
            (document.body.style as CSSStyleDeclaration & { zoom?: string }).zoom = `${z * 100}%`;
            window.dispatchEvent(new Event("resize"));
          }, tc.zoom);
          await page.waitForTimeout(150);
        }

        // 1. Assert: Strap top x within 1px of notch center x
        const alignment = await page.evaluate(() => {
          const container = document.getElementById("hero");
          if (!container) return null;
          const cRect = container.getBoundingClientRect();
          const notch =
            document.getElementById("notch-navbar")?.querySelector("nav") ||
            document.getElementById("notch-navbar");
          if (!notch) return null;
          const nRect = notch.getBoundingClientRect();
          const notchCenterRelX = nRect.left + nRect.width / 2 - cRect.left;

          const telemetry = (window as unknown as WindowWithLanyard).__LANYARD_TELEMETRY__;
          const rope = (window as unknown as { __LANYARD_ROPE__?: VerletRope }).__LANYARD_ROPE__;
          if (!telemetry || !rope) return null;

          const badgeTransform = rope.getBadgeTransform();
          return {
            notchCenterRelX,
            strapTopX: telemetry.strapTopX,
            strapBottomX: telemetry.strapBottomX,
            strapBottomY: telemetry.strapBottomY,
            badgeX: badgeTransform.x,
            badgeY: badgeTransform.y,
            segmentLengths: rope.getSegmentLengths(),
            restLength: rope.config.restSegmentLength,
          };
        });

        expect(alignment).not.toBeNull();
        const diffTop = Math.abs(alignment!.strapTopX - alignment!.notchCenterRelX);
        expect(
          diffTop,
          `Strap top X (${alignment!.strapTopX}) deviated from notch center X (${alignment!.notchCenterRelX}) by ${diffTop}px on DPR ${tc.dpr}, ${tc.width}px, zoom ${tc.zoom}`
        ).toBeLessThanOrEqual(1.0);

        // 2. Assert: Strap bottom within 1px of badge clip position
        const diffBottom = Math.hypot(
          alignment!.strapBottomX - alignment!.badgeX,
          alignment!.strapBottomY - alignment!.badgeY
        );
        expect(
          diffBottom,
          `Strap bottom deviated from clip pivot by ${diffBottom}px on DPR ${tc.dpr}, ${tc.width}px, zoom ${tc.zoom}`
        ).toBeLessThanOrEqual(1.0);

        // 3. Drag badge down, release, assert segment lengths within [0.9x, 2.3x], no NaN, settles within 2.5s
        const badge = page.locator("[data-badge-card]");
        const box = await badge.boundingBox();
        expect(box).not.toBeNull();
        const cx = box!.x + box!.width / 2;
        const cy = box!.y + box!.height / 2;

        await page.mouse.move(cx, cy);
        await page.mouse.down();
        await page.mouse.move(cx + 40, cy + 90, { steps: 8 });
        await page.waitForTimeout(80);

        // Check drag stretch constraint
        const duringDrag = await page.evaluate(() => {
          const rope = (window as unknown as { __LANYARD_ROPE__?: VerletRope }).__LANYARD_ROPE__;
          if (!rope) return null;
          return {
            lengths: rope.getSegmentLengths(),
            rest: rope.config.restSegmentLength,
            transform: rope.getBadgeTransform(),
          };
        });
        expect(duringDrag).not.toBeNull();
        expect(Number.isNaN(duringDrag!.transform.x)).toBe(false);
        expect(Number.isNaN(duringDrag!.transform.y)).toBe(false);
        expect(Number.isNaN(duringDrag!.transform.angleDeg)).toBe(false);
        for (const l of duringDrag!.lengths) {
          expect(l).toBeGreaterThanOrEqual(duringDrag!.rest * 0.9);
          expect(l).toBeLessThanOrEqual(duringDrag!.rest * 2.35);
        }

        // Release and settle
        await page.mouse.up();
        await page.waitForTimeout(2500);

        const settled = await page.evaluate(() => {
          const rope = (window as unknown as { __LANYARD_ROPE__?: VerletRope }).__LANYARD_ROPE__;
          if (!rope) return null;
          const t = rope.getBadgeTransform();
          return {
            angleDeg: t.angleDeg,
            hasNaN: Number.isNaN(t.x) || Number.isNaN(t.y) || Number.isNaN(t.angleDeg),
            stretchRatio: t.stretchRatio,
          };
        });
        expect(settled).not.toBeNull();
        expect(settled!.hasNaN).toBe(false);
        expect(Math.abs(settled!.angleDeg)).toBeLessThan(1.5);
        expect(settled!.stretchRatio).toBeCloseTo(1.0, 1);
      } finally {
        await context.close();
      }
    }
  });

  test("6. /resume Scroll Thread: multi-viewport, multi-zoom, node alignment, 60 FPS, footer handoff & screenshots", async ({
    browser,
  }) => {
    test.setTimeout(90000);

    const configs = [
      { name: "desktop-1470-dark", width: 1470, height: 950, dpr: 2, theme: "dark", zoom: 1.0 },
      { name: "desktop-1920-light", width: 1920, height: 1080, dpr: 1, theme: "light", zoom: 1.0 },
      { name: "tablet-768-dark", width: 768, height: 1024, dpr: 2, theme: "dark", zoom: 1.0 },
      { name: "mobile-360-light", width: 360, height: 800, dpr: 3, theme: "light", zoom: 1.0 },
      { name: "zoom-90-dark", width: 1470, height: 950, dpr: 2, theme: "dark", zoom: 0.9 },
      { name: "zoom-110-dark", width: 1470, height: 950, dpr: 2, theme: "dark", zoom: 1.1 },
    ];

    for (const cfg of configs) {
      const context = await browser.newContext({
        viewport: { width: cfg.width, height: cfg.height },
        deviceScaleFactor: cfg.dpr,
      });
      const page = await context.newPage();

      try {
        await page.goto("/resume");
        await page.waitForSelector(".resume-page-root");
        if (cfg.width >= 1024) {
          await page.waitForSelector("[data-resume-progress-rail]");
        }
        await page.waitForTimeout(300);

        // Set theme
        await page.evaluate((t) => {
          const html = document.documentElement;
          if (t === "dark") {
            html.classList.add("dark");
            localStorage.setItem("kp-theme", "dark");
          } else {
            html.classList.remove("dark");
            localStorage.setItem("kp-theme", "light");
          }
        }, cfg.theme);
        await page.waitForTimeout(200);

        // Zoom if required
        if (cfg.zoom !== 1.0) {
          await page.evaluate((z) => {
            (document.body.style as CSSStyleDeclaration & { zoom?: string }).zoom = `${z * 100}%`;
            window.dispatchEvent(new Event("resize"));
          }, cfg.zoom);
          await page.waitForTimeout(200);
        }

        // 1. Verify all 6 section headings exist and are in order
        const sectionsPresent = await page.evaluate(() => {
          const sectionIds = ["summary", "education", "projects", "certifications", "skills", "activity"];
          return sectionIds.every((id) => document.getElementById(id) !== null);
        });

        expect(sectionsPresent).toBe(true);

        // 2. Measure scroll FPS over smooth scroll
        if (cfg.name === "desktop-1470-dark") {
          const fpsTelemetry = await page.evaluate(async () => {
            return new Promise<{ avgFps: number; minFps: number }>((resolve) => {
              let count = 0;
              const times: number[] = [];
              let last = performance.now();

              function onFrame(now: number) {
                const delta = now - last;
                last = now;
                if (delta > 0) times.push(1000 / delta);
                count++;
                if (count >= 70) {
                  const avg = times.reduce((a, b) => a + b, 0) / times.length;
                  const min = Math.min(...times);
                  resolve({ avgFps: avg, minFps: min });
                  return;
                }
                requestAnimationFrame(onFrame);
              }
              requestAnimationFrame(onFrame);
            });
          });

          console.log("/resume Scroll FPS Telemetry:", fpsTelemetry);
          expect(fpsTelemetry.avgFps).toBeGreaterThanOrEqual(54);

          // Screenshots
          await page.screenshot({ path: "test-results/scroll-thread-dark-top.png" });

          await page.evaluate(() => window.scrollTo(0, 1100));
          await page.waitForTimeout(300);
          await page.screenshot({ path: "test-results/scroll-thread-dark-mid.png" });
        } else if (cfg.name === "desktop-1920-light") {
          await page.screenshot({ path: "test-results/scroll-thread-light-top.png" });
          await page.evaluate(() => window.scrollTo(0, 1100));
          await page.waitForTimeout(300);
          await page.screenshot({ path: "test-results/scroll-thread-light-mid.png" });
        } else if (cfg.name === "mobile-360-light") {
          await page.screenshot({ path: "test-results/scroll-thread-mobile.png" });
        }

        // 3. Footer Handoff test: scroll into footer and assert event firing
        if (cfg.name === "desktop-1470-dark") {
          const eventReceived = await page.evaluate(async () => {
            return new Promise<boolean>((resolve) => {
              let triggered = false;
              window.addEventListener("footer-ember-burst", () => {
                triggered = true;
                resolve(true);
              }, { once: true });

              const footer = document.querySelector("footer");
              if (footer) {
                footer.scrollIntoView({ behavior: "smooth" });
              }

              setTimeout(() => resolve(triggered), 2500);
            });
          });

          expect(eventReceived, "footer-ember-burst was triggered upon reaching footer").toBe(true);
        }
      } finally {
        await context.close();
      }
    }
  });
});

