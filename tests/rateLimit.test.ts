import { describe, expect, it } from "vitest";
import { rateLimit } from "../lib/rateLimit";

describe("rateLimit", () => {
  it("allows up to the limit in a window, then blocks", () => {
    const t = 1_000_000;
    for (let i = 0; i < 3; i++) expect(rateLimit("k1", 3, 60_000, t)).toBe(true);
    expect(rateLimit("k1", 3, 60_000, t + 1000)).toBe(false);
  });

  it("resets after the window", () => {
    const t = 2_000_000;
    rateLimit("k2", 1, 60_000, t);
    expect(rateLimit("k2", 1, 60_000, t + 30_000)).toBe(false);
    expect(rateLimit("k2", 1, 60_000, t + 60_001)).toBe(true);
  });

  it("keeps separate counts per key", () => {
    const t = 3_000_000;
    expect(rateLimit("a", 1, 60_000, t)).toBe(true);
    expect(rateLimit("b", 1, 60_000, t)).toBe(true);
    expect(rateLimit("a", 1, 60_000, t)).toBe(false);
  });
});
