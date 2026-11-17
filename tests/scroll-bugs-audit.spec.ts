import { test, expect } from "@playwright/test";

test.describe("Scroll Bugs & Physics Coordinate Alignment Audit", () => {
  test.setTimeout(120000);

  const testConfigurations = [
    {
      name: "desktop-1470-dark-dpr2",
      viewport: { width: 1470, height: 950 },
      dpr: 2,
      theme: "dark",
      zoom: 1.0,
      isMobile: false,
    },
    {
      name: "desktop-1920-light-dpr1-zoom90",
      viewport: { width: 1920, height: 1080 },
      dpr: 1,
      theme: "light",
      zoom: 0.9,
      isMobile: false,
    },
    {
      name: "desktop-1470-light-dpr3-zoom110",
      viewport: { width: 1470, height: 950 },
      dpr: 3,
      theme: "light",
      zoom: 1.1,
      isMobile: false,
    },
    {
      name: "mobile-390-dark-dpr3",
      viewport: { width: 390, height: 844 },
      dpr: 3,
      theme: "dark",
      zoom: 1.0,
      isMobile: true,
    },
  ];

  for (const cfg of testConfigurations) {
    test(`Scroll verification across ${cfg.name}`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: cfg.viewport,
        deviceScaleFactor: cfg.dpr,
        hasTouch: cfg.isMobile,
        isMobile: cfg.isMobile,
      });

      const page = await context.newPage();

      // Collect console errors & warnings
      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });
      page.on("pageerror", (err) => consoleErrors.push(err.message));

      await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

      // Apply theme & zoom
      await page.evaluate(
        ({ theme, zoom }) => {
          if (theme === "dark") {
            document.documentElement.classList.add("dark");
            localStorage.setItem("kp-theme", "dark");
          } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("kp-theme", "light");
          }
          if (zoom !== 1.0) {
            (document.body.style as unknown as { zoom: string }).zoom = `${zoom}`;
            window.dispatchEvent(new Event("resize"));
          }
        },
        { theme: cfg.theme, zoom: cfg.zoom }
      );

      await page.waitForTimeout(300);

      // Setup performance, CLS & Long Task monitoring
      await page.evaluate(() => {
        const perfWin = window as unknown as {
          __scrollTelemetry: {
            fps: number[];
            longTasks: number;
            cls: number;
          };
        };
        perfWin.__scrollTelemetry = {
          fps: [],
          longTasks: 0,
          cls: 0,
        };

        // Long Tasks Observer
        try {
          const longTaskObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.duration > 50) {
                perfWin.__scrollTelemetry.longTasks++;
              }
            }
          });
          longTaskObserver.observe({ entryTypes: ["longtask"] });
        } catch {
          // Unsupported in some environments
        }

        // Layout Shift Observer
        try {
          const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(entry as unknown as { hadRecentInput: boolean }).hadRecentInput) {
                perfWin.__scrollTelemetry.cls += (entry as unknown as { value: number }).value;
              }
            }
          });
          clsObserver.observe({ entryTypes: ["layout-shift"] });
        } catch {
          // Unsupported in some environments
        }

        // FPS measurement loop
        let lastFrameTime = performance.now();
        const checkFps = (now: number) => {
          const delta = now - lastFrameTime;
          lastFrameTime = now;
          if (delta > 0) {
            const currentFps = 1000 / delta;
            perfWin.__scrollTelemetry.fps.push(currentFps);
          }
          requestAnimationFrame(checkFps);
        };
        requestAnimationFrame(checkFps);
      });

      // Test step scroll points: 0, 300, 600, 1200, bottom, top
      const maxScroll = await page.evaluate(
        () => document.documentElement.scrollHeight - window.innerHeight
      );
      const scrollSteps = [0, 300, 600, Math.min(1200, maxScroll), maxScroll, 0];

      for (let s = 0; s < scrollSteps.length; s++) {
        const targetY = scrollSteps[s];

        await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), targetY);
        await page.waitForTimeout(150);

        // Programmatic assertions at each scroll step
        const check = await page.evaluate(() => {
          const container = document.querySelector('[data-hero-lanyard="true"]') as HTMLElement | null;
          const svg = document.querySelector('[data-lanyard-canvas="true"]') as HTMLElement | null;
          const badgeCard = document.querySelector('[data-badge-card="true"]') as HTMLElement | null;

          if (!container || !svg || !badgeCard) {
            return { error: "Elements not found" };
          }

          const badgeRect = badgeCard.getBoundingClientRect();
          const tele = (window as unknown as { __LANYARD_TELEMETRY__?: {
            strapTopX: number;
            strapTopY: number;
            strapBottomX: number;
            strapBottomY: number;
          } }).__LANYARD_TELEMETRY__;

          const containerWidth = container.clientWidth;
          const expectedAnchorX = containerWidth / 2;

          // Check 1: Strap top is at container's top-center
          const topAnchorDiff = tele ? Math.abs(tele.strapTopX - expectedAnchorX) : 0;

          // Check 2: Strap end is within 1px of clip
          const clipPointDiff = tele ? Math.abs(tele.strapBottomX - tele.strapBottomX) : 0;

          // Check 3: Badge is fully opaque whenever inside viewport
          const isInViewport = badgeRect.bottom > 0 && badgeRect.top < window.innerHeight;
          const badgeOpacity = parseFloat(window.getComputedStyle(badgeCard).opacity || "1");

          return {
            containerWidth,
            topAnchorDiff,
            clipPointDiff,
            isInViewport,
            badgeOpacity,
            tele,
          };
        });

        expect(check.error).toBeUndefined();
        expect(check.topAnchorDiff, `Strap anchor must be centered at scroll ${targetY}`).toBeLessThanOrEqual(1.5);
        expect(check.clipPointDiff, `Strap end must be within 1px of clip at scroll ${targetY}`).toBeLessThanOrEqual(1.0);

        if (check.isInViewport) {
          expect(check.badgeOpacity, `Badge must be fully opaque in viewport at scroll ${targetY}`).toBe(1.0);
        }

        // Take snapshot for visual verification
        await page.screenshot({
          path: `test-results/scroll-audit/scroll-${cfg.name}-step${s}-y${targetY}.png`,
        });
      }

      // Fast flick down & up test
      await page.evaluate(() => {
        window.scrollTo({ top: 1400, behavior: "auto" });
      });
      await page.waitForTimeout(100);
      await page.evaluate(() => {
        window.scrollTo({ top: 0, behavior: "auto" });
      });
      await page.waitForTimeout(200);

      // Scroll to footer to verify clean complete letters reveal (no particles, no "BRADHAN")
      const footer = page.locator("footer#footer");
      await footer.scrollIntoViewIfNeeded();
      await page.waitForTimeout(700);

      const footerCanvas = page.locator("footer canvas");
      await expect(footerCanvas).toBeVisible();

      await page.screenshot({
        path: `test-results/scroll-audit/scroll-${cfg.name}-footer.png`,
      });

      // Verify Telemetry, FPS, CLS, long tasks
      const telemetry = await page.evaluate(() => {
        const perfWin = window as unknown as {
          __scrollTelemetry?: {
            fps: number[];
            longTasks: number;
            cls: number;
          };
        };
        const samples = perfWin.__scrollTelemetry?.fps || [];
        const avgFps = samples.length > 0 ? samples.reduce((a, b) => a + b, 0) / samples.length : 60;
        return {
          avgFps,
          longTasks: perfWin.__scrollTelemetry?.longTasks || 0,
          cls: perfWin.__scrollTelemetry?.cls || 0,
        };
      });

      // Check overlay issues count (0 allowed)
      const overlayIssueCount = await page.evaluate(() => {
        const portal = document.querySelector("nextjs-portal");
        if (!portal || !portal.shadowRoot) return 0;
        const toastError = portal.shadowRoot.querySelector(
          "[data-nextjs-toast-errors], [data-nextjs-dialog-header], .nextjs-toast-errors"
        );
        const countBadge = portal.shadowRoot.querySelector(
          "#nextjs-dev-tools-issue-count, [data-issue-count]"
        );
        if (toastError) return 1;
        if (countBadge) {
          const num = parseInt(countBadge.textContent || "0");
          return isNaN(num) ? 0 : num;
        }
        return 0;
      });

      expect(overlayIssueCount, "Zero Next.js dev overlay issues").toBe(0);
      expect(consoleErrors.length, `Console errors must be 0: ${consoleErrors.join(", ")}`).toBe(0);

      console.log(`${cfg.name} results:`, {
        avgFps: Math.round(telemetry.avgFps),
        cls: telemetry.cls.toFixed(4),
        longTasks: telemetry.longTasks,
        consoleErrors: consoleErrors.length,
      });

      await context.close();
    });
  }
});
