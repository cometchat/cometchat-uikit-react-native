/**
 * Frame probe (TEST-PLAN §3.3): on every committed render of a list, hand the row list to a probe
 * the sample app installed (`globalThis.__ccFrameProbe`), so a runner can assert "no duplicate key,
 * no flash, no blank" across frames, not just on the final screen.
 *
 * Dev and sample builds only. `__DEV__` is a constant in release bundles, so the body and the global
 * name are folded out of them (`scripts/probe-strip-check.sh` proves it). Nothing here runs unless a
 * probe was installed, and nothing is installed by the kit.
 *
 * @internal
 */
export interface FrameRow {
  key: string;
  id: number;
  state: string;
  /** The row's own object, for a runner that needs to label it. Never logged or stored by the kit. */
  item: unknown;
}

export function probeFrame(list: string, rows: () => FrameRow[]): void {
  if (!__DEV__) return;
  const probe = (globalThis as any).__ccFrameProbe;
  if (typeof probe === "function") probe(list, rows());
}
