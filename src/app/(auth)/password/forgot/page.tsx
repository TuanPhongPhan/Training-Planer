import { requestPasswordReset } from "@/app/actions/auth/password-reset";

export default function ForgotPasswordPage() {
    return (
        <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center p-6">
            <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
            <p className="mt-1 text-sm text-muted-foreground">
                Enter your email and we’ll send you a reset link.
            </p>

            <form action={requestPasswordReset} className="mt-6 space-y-3">
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

                <button className="w-full rounded-xl bg-foreground px-3 py-2 text-sm font-medium text-background">
                    Send reset link
                </button>
            </form>

            <p className="mt-4 text-sm text-muted-foreground">
                <a className="underline" href="/login">Back to login</a>
            </p>
        </div>
    );
}
