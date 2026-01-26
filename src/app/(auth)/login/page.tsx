import { signIn } from "@/app/actions/auth/sign-in";
import { resendConfirmation } from "@/app/actions/resend-confirmation";

export default async function LoginPage({
                                            searchParams,
                                        }: {
    searchParams: Promise<{ error?: string }>;
}) {
    const { error } = await searchParams;

    const showUnverified = error === "email-not-verified";

    return (
        <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center p-6">
            <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>
            <p className="mt-1 text-sm text-muted-foreground">Email + password.</p>

            {showUnverified && (
                <div className="mt-4 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-3 py-2 text-sm text-yellow-600">
                    Your email address is not verified yet. Please check your inbox and
                    confirm your email.
                </div>
            )}

            {error && !showUnverified && (
                <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600">
                    {decodeURIComponent(error)}
                </div>
            )}

            <form action={signIn} className="mt-6 space-y-3">
                <div className="space-y-1">
                    <label className="text-sm font-medium">Email</label>
                    <input
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                        placeholder="you@example.com"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium">Password</label>
                    <input
                        name="password"
                        type="password"
                        required
                        minLength={6}
                        autoComplete="current-password"
                        className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                        placeholder="••••••••"
                    />
                </div>

                <button className="w-full rounded-xl bg-foreground px-3 py-2 text-sm font-medium text-background">
                    Continue
                </button>
            </form>

            {/* Only show when unverified */}
            {showUnverified && (
                <form action={resendConfirmation} className="mt-3 space-y-2">
                    <input
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                        placeholder="Re-enter email to resend"
                    />
                    <button className="w-full rounded-xl border px-3 py-2 text-sm font-medium">
                        Resend verification email
                    </button>
                </form>
            )}

            <p className="mt-4 text-sm text-muted-foreground">
                No account?{" "}
                <a className="underline" href="/signup">
                    Sign up
                </a>
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
                <a className="underline" href="/forgot-password">
                    Forgot password?
                </a>
            </p>
        </div>
    );
}
