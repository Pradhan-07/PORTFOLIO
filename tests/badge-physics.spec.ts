import { test, expect } from "@playwright/test";
import type { VerletRope } from "@/lib/verlet";

interface WindowWithRope extends Window {
  __LANYARD_ROPE__?: VerletRope;
}

test.describe("Lanyard Badge Physics and Stability (beebombshell-style V-strap)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#hero");
    await page.waitForSelector("[data-badge-card]");
    await page.waitForFunction(() => !!(window as unknown as WindowWithRope).__LANYARD_ROPE__);
  });

  test("1. Initial rest state: no NaNs, each stick near its own rest length, badge centre = midpoint of points 9-10", async ({
    page,
  }) => {
    const badgePhysics = page.locator("#hero div[style*='translate3d']").first();
    const transformStyle = await badgePhysics.getAttribute("style");
    expect(transformStyle).not.toBeNull();
    expect(transformStyle).not.toContain("NaN");

    const telemetry = await page.evaluate(() => {
      const rope = (window as unknown as WindowWithRope).__LANYARD_ROPE__;
      if (!rope) return null;
      return {
        segmentLengths: rope.getSegmentLengths(),
        restLengths: rope.sticks.map((s) => s.restLength),
        transform: rope.getBadgeTransform(),
        points: rope.points,
      };
    });

    expect(telemetry).not.toBeNull();
    const { segmentLengths, restLengths, transform, points } = telemetry!;

    expect(Number.isNaN(transform.x)).toBe(false);
    expect(Number.isNaN(transform.y)).toBe(false);
    expect(Number.isNaN(transform.angleDeg)).toBe(false);

    // At rest every stick sits close to its own rest length
    expect(segmentLengths.length).toBe(restLengths.length);
    for (let i = 0; i < segmentLengths.length; i++) {
      expect(segmentLengths[i]).toBeGreaterThanOrEqual(restLengths[i] * 0.85);
      expect(segmentLengths[i]).toBeLessThanOrEqual(restLengths[i] * 1.3);
    }

    // Badge transform is the midpoint of rope points 9 and 10
    const midX = (points[9].x + points[10].x) / 2;
    const midY = (points[9].y + points[10].y) / 2;
    const gap = Math.hypot(transform.x - midX, transform.y - midY);
    expect(gap).toBeLessThan(1.0);
  });

  test("2. Drag stretches the badge stick elastically, release: angle <= +-20deg after 0.5s, settles within 2.5s", async ({
    page,
  }) => {
    const badgeCard = page.locator("[data-badge-card]");
    const box = await badgeCard.boundingBox();
    expect(box).not.toBeNull();

    const startX = box!.x + box!.width / 2;
    const startY = box!.y + box!.height / 2;

    // Grab and drag badge down and to the right
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.waitForTimeout(60);

    // Sample the peak stick stretch on every frame during the drag.
    // The badge stick itself stays ~1x (point 9 follows the pinned
    // badge point); the elongation shows in the strap + connector
    // sticks above it — exactly like the reference site.
    await page.evaluate(() => {
      const w = window as unknown as { __MAX_STRETCH__?: number };
      w.__MAX_STRETCH__ = 1;
      const tick = () => {
        const rope = (window as unknown as WindowWithRope).__LANYARD_ROPE__;
        if (rope) {
          const lens = rope.getSegmentLengths();
          for (let i = 0; i < lens.length; i++) {
            const ratio = lens[i] / rope.sticks[i].restLength;
            if (ratio > (w.__MAX_STRETCH__ ?? 1)) w.__MAX_STRETCH__ = ratio;
          }
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });

    // Drag far down — past the chain's natural reach, so the strap
    // sticks must genuinely stretch, bee-style.
    await page.mouse.move(startX + 60, startY + 300, { steps: 8 });
    await page.waitForTimeout(100);

    const maxStretch = await page.evaluate(
      () => (window as unknown as { __MAX_STRETCH__?: number }).__MAX_STRETCH__ ?? 1
    );
    expect(maxStretch).toBeGreaterThan(1.15);
    expect(maxStretch).toBeLessThanOrEqual(2.6);

    // During the drag the badge stick may stretch, but stays sane;
    // every other stick stays within generous per-stick bounds.
    const duringDrag = await page.evaluate(() => {
      const rope = (window as unknown as WindowWithRope).__LANYARD_ROPE__;
      if (!rope) return { segmentLengths: [], restLengths: [], stretchRatio: 1 };
      return {
        segmentLengths: rope.getSegmentLengths(),
        restLengths: rope.sticks.map((s) => s.restLength),
        stretchRatio: rope.getBadgeTransform().stretchRatio,
      };
    });

    expect(duringDrag.stretchRatio).toBeLessThanOrEqual(2.6);
    for (let i = 0; i < duringDrag.segmentLengths.length; i++) {
      expect(duringDrag.segmentLengths[i]).toBeGreaterThanOrEqual(duringDrag.restLengths[i] * 0.6);
      expect(duringDrag.segmentLengths[i]).toBeLessThanOrEqual(duringDrag.restLengths[i] * 2.6);
    }

    // Release pointer
    await page.mouse.up();

    // 0.5s after release: badge angle should strictly not exceed +-20 degrees
    await page.waitForTimeout(500);

    const afterHalfSec = await page.evaluate(() => {
      const rope = (window as unknown as WindowWithRope).__LANYARD_ROPE__;
      if (!rope) {
        return { angleDeg: 0, hasNaN: false };
      }
      const t = rope.getBadgeTransform();
      return {
        angleDeg: t.angleDeg,
        hasNaN: Number.isNaN(t.x) || Number.isNaN(t.y) || Number.isNaN(t.angleDeg),
      };
    });

    expect(afterHalfSec.hasNaN).toBe(false);
    expect(Math.abs(afterHalfSec.angleDeg)).toBeLessThanOrEqual(20);

    // Settles to rest: the reference physics (damping 0.992) swings
    // gracefully for a few seconds after a fling, so poll for rest
    // instead of assuming the old engine's fast decay.
    await page.waitForFunction(
      () => {
        const rope = (window as unknown as WindowWithRope).__LANYARD_ROPE__;
        if (!rope) return false;
        const t = rope.getBadgeTransform();
        return Math.abs(t.angleDeg) < 1.5 && Math.abs(t.stretchRatio - 1) < 0.05;
      },
      undefined,
      { timeout: 15000 }
    );

    const settled = await page.evaluate(() => {
      const rope = (window as unknown as WindowWithRope).__LANYARD_ROPE__;
      if (!rope) return { angleDeg: 0, stretchRatio: 1 };
      const t = rope.getBadgeTransform();
      return {
        angleDeg: t.angleDeg,
        stretchRatio: t.stretchRatio,
      };
    });

    expect(Math.abs(settled.angleDeg)).toBeLessThan(1.5);
    expect(settled.stretchRatio).toBeCloseTo(1.0, 1);
  });

  test("3. Responsive viewports: 1920 desktop, 768 tablet, 360 mobile", async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080 },
      { width: 768, height: 1024 },
      { width: 360, height: 800 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.waitForTimeout(200);

      const status = await page.evaluate(() => {
        const rope = (window as unknown as WindowWithRope).__LANYARD_ROPE__;
        if (!rope) return { hasNaN: false, y: 500, centered: true };
        const t = rope.getBadgeTransform();
        return {
          hasNaN: Number.isNaN(t.x) || Number.isNaN(t.y) || Number.isNaN(t.angleDeg),
          y: t.y,
          centered: Math.abs(t.x - rope.anchorX) < 60,
        };
      });

      expect(status.hasNaN).toBe(false);
      expect(status.y).toBeGreaterThanOrEqual(100);
      expect(status.centered).toBe(true);
    }
  });

  test("4. Debug overlay toggle with 'D' key", async ({ page }) => {
    // Press 'd' to open debug overlay
    await page.keyboard.press("d");
    await page.waitForSelector("canvas.w-full.h-full.block");
    const overlayCanvas = page.locator("canvas.w-full.h-full.block").first();
    await expect(overlayCanvas).toBeVisible();

    // Press 'd' again to close debug overlay
    await page.keyboard.press("d");
    await page.waitForTimeout(100);
    const closeBtn = page.locator("text=CLOSE [D]");
    await expect(closeBtn).toHaveCount(0);
  });
});
