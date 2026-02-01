import { describe, it, expect } from "vitest";
import { inRange } from "@/lib/dateRange";

describe("dateRange.inRange", () => {
    it("includes the last 7 days including today", () => {
        const now = new Date("2026-01-26T12:00:00"); // Mon
        expect(inRange("2026-01-26", "LAST_7", now)).toBe(true);
        expect(inRange("2026-01-20", "LAST_7", now)).toBe(true);
        expect(inRange("2026-01-19", "LAST_7", now)).toBe(false);
    });

    it("computes THIS_WEEK as Mon..Sun", () => {
        const now = new Date("2026-01-26T12:00:00"); // Mon
        expect(inRange("2026-01-26", "THIS_WEEK", now)).toBe(true);
        expect(inRange("2026-02-01", "THIS_WEEK", now)).toBe(true); // Sun
        expect(inRange("2026-02-02", "THIS_WEEK", now)).toBe(false); // next Mon
    });
});
