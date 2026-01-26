import { signUp } from "@/app/actions/auth/sign-up";

export default function SignupPage() {
    return (
        <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center p-6">
            <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
            <p className="mt-1 text-sm text-muted-foreground">Email + password.</p>

            <form action={signUp} className="mt-6 space-y-3">
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
                        autoComplete="new-password"
                        className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                        placeholder="At least 6 characters"
                    />
                </div>

                <button className="w-full rounded-xl bg-foreground px-3 py-2 text-sm font-medium text-background">
                    Sign up
                </button>
            </form>

            <p className="mt-4 text-sm text-muted-foreground">
                Already have an account?{" "}
                <a className="underline" href="/login">
                    Log in
                </a>
            </p>
        </div>
    );
}
