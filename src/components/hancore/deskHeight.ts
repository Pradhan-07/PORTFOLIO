/**
 * The G6 desk height budget, shared by the stage/CSS integration:
 *   width ≤ 640px (any height)  -> 0
 *   viewport height < 700px     -> 0
 *   height 700–849px            -> 84px  (6 cells)
 *   height 850–999px            -> 126px (9 cells)
 *   height ≥ 1000px, width > 640 -> 184px (cap)
 * The `--desk-h` CSS token in index.css encodes the same table for the
 * stage grid; DeskStrip uses this when no explicit height is passed.
 */
export function deskHeightForViewport(viewportWidth: number, viewportHeight: number): number {
  if (viewportWidth <= 640 || viewportHeight < 700) return 0;
  if (viewportHeight < 850) return 84;
  if (viewportHeight < 1000) return 126;
  return 184;
}
