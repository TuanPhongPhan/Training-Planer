import { signIn } from "@/app/actions/auth/sign-in";
import { resendConfirmation } from "@/app/actions/resend-confirmation";
import React from "react";

function BrandMark() {
    return (
        <div className="flex items-center gap-3">
            {/* Calendar/check icon */}
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 shadow-sm">
                <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-white"
                    aria-hidden="true"
                >
                    <path
                        d="M7 2v3M17 2v3"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                    <path
                        d="M4.5 8.5h15"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                    <path
                        d="M6.5 5h11A3.5 3.5 0 0 1 21 8.5v9A3.5 3.5 0 0 1 17.5 21h-11A3.5 3.5 0 0 1 3 17.5v-9A3.5 3.5 0 0 1 6.5 5Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M8.2 13.2l2.2 2.2 5.4-5.4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>

            <div className="leading-tight">
                <div className="text-sm font-semibold text-foreground">
                    Training <span className="text-green-600">Planner</span>
                </div>
                <div className="text-xs text-muted-foreground">
                    Plan. Complete. Improve.
                </div>
            </div>
        </div>
    );
}

function Alert({
                   variant,
                   title,
                   children,
               }: {
    variant: "warning" | "error";
    title: string;
    children: React.ReactNode;
}) {
    const styles =
        variant === "warning"
            ? "border-yellow-400/30 bg-yellow-400/10 text-yellow-700 dark:text-yellow-400"
            : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400";

    return (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${styles}`}>
            <div className="font-medium">{title}</div>
            <div className="mt-1 text-sm opacity-90">{children}</div>
        </div>
    );
}

export default async function LoginPage({
                                            searchParams,
                                        }: {
    searchParams?: Promise<{ error?: string }>;
}) {
    const params = await searchParams;
    const error = params?.error;
    const showUnverified = error === "email-not-verified";

    return (
        <div className="min-h-dvh bg-linear-to-b from-background to-muted/40">
            <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center p-6">
                <div className="rounded-3xl border bg-background/70 p-6 shadow-sm backdrop-blur supports-backdrop-filter:bg-background/60 sm:p-8">
                    <BrandMark />

                    <div className="mt-6">
                        <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Welcome back. Continue where you left off.
                        </p>
                    </div>

                    <div className="mt-5 space-y-3">
                        {showUnverified && (
                            <Alert variant="warning" title="Email not verified">
                                Please check your inbox and confirm your email address to activate
                                your account.
                            </Alert>
                        )}

                        {error && !showUnverified && (
                            <Alert variant="error" title="Couldn’t log you in">
                                {decodeURIComponent(error)}
                            </Alert>
                        )}
                    </div>

                    <form action={signIn} className="mt-6 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Email</label>
                            <input
                                name="email"
                                type="email"
                                required
                                autoComplete="email"
                                className="w-full rounded-2xl border bg-background px-3 py-2.5 text-sm outline-none ring-green-600/20 placeholder:text-muted-foreground focus:ring-4"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Password</label>
                                <a
                                    className="text-xs font-medium text-green-100 underline-offset-4 hover:underline dark:text-green-400"
                                    href="/forgot-password"
                                >
                                    Forgot password?
                                </a>
                            </div>
                            <input
                                name="password"
                                type="password"
                                required
                                minLength={6}
                                autoComplete="current-password"
                                className="w-full rounded-2xl border bg-background px-3 py-2.5 text-sm outline-none ring-green-600/20 placeholder:text-muted-foreground focus:ring-4"
                                placeholder="••••••••"
                            />
                        </div>

                        <button className="w-full rounded-2xl bg-green-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.99] hover:bg-green-700">
                            Continue
                        </button>
                    </form>

                    {/* Only show when unverified */}
                    {showUnverified && (
                        <div className="mt-5 rounded-2xl border bg-muted/30 p-4">
                            <div className="text-sm font-medium">Resend verification email</div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Enter your email again and we’ll send a new confirmation link.
                            </p>

                            <form action={resendConfirmation} className="mt-3 space-y-3">
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    className="w-full rounded-2xl border bg-background px-3 py-2.5 text-sm outline-none ring-green-600/20 placeholder:text-muted-foreground focus:ring-4"
                                    placeholder="you@example.com"
                                />
                                <button className="w-full rounded-2xl border bg-background px-3 py-2.5 text-sm font-semibold transition hover:bg-muted">
                                    Resend email
                                </button>
                            </form>
                        </div>
                    )}

                    <p className="mt-6 text-sm text-muted-foreground">
                        No account?{" "}
                        <a
                            className="font-medium text-green-700 underline-offset-4 hover:underline dark:text-green-400"
                            href="/signup"
                        >
                            Sign up
                        </a>
                    </p>
                </div>

                <p className="mt-6 text-center text-xs text-muted-foreground">
                    By continuing, you agree to use Training Planner responsibly.
                </p>
            </div>
        </div>
    );
}
