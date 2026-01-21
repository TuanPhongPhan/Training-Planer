import React from "react";

/**
 * Shared dot indicator used across Week + Templates.
 * Keeps type colors consistent everywhere.
 *
 * Usage:
 *   <StatusDot type="BADMINTON" className="absolute left-3 top-3" />
 */
export type StatusDotType = "BADMINTON" | "GYM" | "RECOVERY";

const DOT_CLASS: Record<StatusDotType, string> = {
  BADMINTON: "bg-sky-500",
  GYM: "bg-emerald-500",
  RECOVERY: "bg-violet-500",
};

export function StatusDot({
  type,
  className = "",
  size = "md",
}: {
  type: StatusDotType;
  className?: string;
  size?: "sm" | "md";
}) {
  const s = size === "sm" ? "h-1.5 w-1.5" : "h-2.5 w-2.5";
  return <span className={["rounded-full", s, DOT_CLASS[type], className].join(" ")} />;
}
