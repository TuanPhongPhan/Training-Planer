import * as React from "react";

export function LogDaySection({
                                  title,
                                  subtitle,
                                  children,
                              }: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}) {
    return (
        <section className="space-y-3">
            <div className="text-xs font-medium text-muted-foreground">
                {title}
                {subtitle ? <span className="ml-2 opacity-70">· {subtitle}</span> : null}
            </div>

            <div className="h-px w-full bg-border" />

            <div className="space-y-3">{children}</div>
        </section>
    );
}
