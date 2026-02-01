export function inDateRange(
    iso: string,
    mode: "THIS_WEEK" | "LAST_7" | "THIS_MONTH" | "ALL_TIME",
    now = new Date()
) {
    if (mode === "ALL_TIME") return true;

    const d = new Date(iso + "T00:00:00");

    if (mode === "LAST_7") {
        const from = new Date(now);
        from.setDate(now.getDate() - 6);
        from.setHours(0, 0, 0, 0);
        return d >= from;
    }

    if (mode === "THIS_MONTH") {
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }

    const day = now.getDay();
    const mondayOffset = (day + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return d >= monday && d <= sunday;
}
