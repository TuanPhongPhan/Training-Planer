import {describe, it, expect} from "vitest";
import {inDateRange} from "@/lib/dateFilters";

describe("date filtering", () => {
    it("includes today in LAST_7", () => {
        const now = new Date("2024-06-15T12:00:00");
        expect(inDateRange("2026-01-26", "LAST_7", now)).toBe(true);
    });

    it("excludes dates older than 7 days", () => {
        const now = new Date("2026-01-26T12:00:00");
        expect(inDateRange("2026-01-18", "LAST_7", now)).toBe(false);
    });

    it("computes THIS_WEEK as Mon–Sun", () => {
        const now = new Date("2026-01-26T12:00:00"); // Monday
        expect(inDateRange("2026-02-01", "THIS_WEEK", now)).toBe(true); // Sunday
        expect(inDateRange("2026-02-02", "THIS_WEEK", now)).toBe(false);
    });
})