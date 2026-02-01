export type DateRange = "ALL_TIME" | "LAST_7" | "THIS_WEEK" | "THIS_MONTH";

export function inRange(isoDate: string, dateRange: DateRange, now = new Date()) {
    if (dateRange === "ALL_TIME") return true;

    const d = new Date(isoDate + "T00:00:00");

    if (dateRange === "LAST_7") {
        const from = new Date(now);
        from.setDate(now.getDate() - 6);
        from.setHours(0, 0, 0, 0);
        return d >= from;
    }

    if (dateRange === "THIS_MONTH") {
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }

    // THIS_WEEK Mon..Sun
    const day = now.getDay(); // 0 Sun..6 Sat
    const mondayOffset = (day + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return d >= monday && d <= sunday;
}
