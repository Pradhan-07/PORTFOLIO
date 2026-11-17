import { test, expect } from "@playwright/test";
import type { VerletRope } from "@/lib/verlet";

interface WindowWithRope extends Window {
  __LANYARD_ROPE__?: VerletRope;
}

test.describe("Lanyard Badge Physics and Stability", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#hero");
    await page.waitForSelector("[data-badge-card]");
    await page.waitForFunction(() => !!(window as unknown as WindowWithRope).__LANYARD_ROPE__);
  });

  test("1. Initial rest state: no NaNs, segment lengths within [0.9x, 2.3x], clip-to-badge gap < 1px", async ({
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
        restLength: rope.config.restSegmentLength,
        transform: rope.getBadgeTransform(),
        points: rope.points,
      };
    });

    expect(telemetry).not.toBeNull();
    const { segmentLengths, restLength, transform, points } = telemetry!;

    expect(Number.isNaN(transform.x)).toBe(false);
    expect(Number.isNaN(transform.y)).toBe(false);
    expect(Number.isNaN(transform.angleDeg)).toBe(false);

    // Assert segment lengths within [0.9x, 2.3x]
    for (const len of segmentLengths) {
      expect(len).toBeGreaterThanOrEqual(restLength * 0.9);
      expect(len).toBeLessThanOrEqual(restLength * 2.3);
    }

    // Clip pivot is points[last], badge is at transform.x, transform.y
    const lastPoint = points[points.length - 1];
    const clipX = lastPoint.x;
    const clipY = lastPoint.y;
    const gap = Math.hypot(transform.x - clipX, transform.y - clipY);
    expect(gap).toBeLessThan(1.0);
  });

  test("2. Drag, stretch up to 2.2x, release: angle <= +-20deg after 0.5s, settles within 2.5s", async ({
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

    // Drag in progressive steps
    await page.mouse.move(startX + 90, startY + 110, { steps: 12 });
    await page.waitForTimeout(100);

    // Verify stretch ratio capped <= 2.2x and segment lengths stay <= 2.3x
    const duringDrag = await page.evaluate(() => {
      const rope = (window as unknown as WindowWithRope).__LANYARD_ROPE__;
      if (!rope) return { segmentLengths: [], restLength: 16, stretchRatio: 1 };
      return {
        segmentLengths: rope.getSegmentLengths(),
        restLength: rope.config.restSegmentLength,
        stretchRatio: rope.getBadgeTransform().stretchRatio,
      };
    });

    expect(duringDrag.stretchRatio).toBeLessThanOrEqual(2.25);
    for (const len of duringDrag.segmentLengths) {
      expect(len).toBeGreaterThanOrEqual(duringDrag.restLength * 0.9);
      expect(len).toBeLessThanOrEqual(duringDrag.restLength * 2.3);
    }

    // Release pointer
    await page.mouse.up();

    // 0.5s after release: badge angle should strictly not exceed +-20 degrees
    await page.waitForTimeout(500);

    const afterHalfSec = await page.evaluate(() => {
      const rope = (window as unknown as WindowWithRope).__LANYARD_ROPE__;
      if (!rope) {
        return {
          angleDeg: 0,
          segmentLengths: [],
          restLength: 16,
          hasNaN: false,
        };
      }
      const t = rope.getBadgeTransform();
      return {
        angleDeg: t.angleDeg,
        segmentLengths: rope.getSegmentLengths(),
        restLength: rope.config.restSegmentLength,
        hasNaN: Number.isNaN(t.x) || Number.isNaN(t.y) || Number.isNaN(t.angleDeg),
      };
    });

    expect(afterHalfSec.hasNaN).toBe(false);
    expect(Math.abs(afterHalfSec.angleDeg)).toBeLessThanOrEqual(20);

    // Segment lengths must remain strictly within [0.9x, 2.3x]
    for (const len of afterHalfSec.segmentLengths) {
      expect(len).toBeGreaterThanOrEqual(afterHalfSec.restLength * 0.9);
      expect(len).toBeLessThanOrEqual(afterHalfSec.restLength * 2.3);
    }

    // Settle to rest within 2.5s (2.0s additional wait)
    await page.waitForTimeout(2000);

    const settled = await page.evaluate(() => {
      const rope = (window as unknown as WindowWithRope).__LANYARD_ROPE__;
      if (!rope) return { angleDeg: 0, isSleeping: true, stretchRatio: 1 };
      const t = rope.getBadgeTransform();
      return {
        angleDeg: t.angleDeg,
        isSleeping: rope.isSleeping,
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
        if (!rope) return { hasNaN: false, y: 100, minLenConstraint: true };
        const t = rope.getBadgeTransform();
        return {
          hasNaN: Number.isNaN(t.x) || Number.isNaN(t.y) || Number.isNaN(t.angleDeg),
          y: t.y,
          minLenConstraint: t.y >= rope.anchorY + 60,
        };
      });

      expect(status.hasNaN).toBe(false);
      expect(status.minLenConstraint).toBe(true);
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
