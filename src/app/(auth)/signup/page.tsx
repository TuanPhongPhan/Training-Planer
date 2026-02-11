import { signUp } from "@/app/actions/auth/sign-up";
import { FormSubmitButton } from "@/components/auth/form-submit-button";

function BrandMark() {
    return (
        <div className="flex items-center gap-3">
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
                    Your training, organized.
                </div>
            </div>
        </div>
    );
}

export default function SignupPage() {
    return (
        <div className="min-h-dvh bg-linear-to-b from-background to-muted/40">
            <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center p-6">
                <div className="rounded-3xl border bg-background/70 p-6 shadow-sm backdrop-blur supports-backdrop-filter:bg-background/60 sm:p-8">
                    <BrandMark />

                    <div className="mt-6">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Create account
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Start planning your week in under a minute.
                        </p>
                    </div>

                    <form action={signUp} className="mt-6 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Email</label>
                            <input
                                name="email"
                                type="email"
                                required
                                autoComplete="email"
                                className="h-10 w-full rounded-2xl border bg-background px-3 text-sm outline-none ring-green-600/20 placeholder:text-muted-foreground focus:ring-4"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Password</label>
                            <input
                                name="password"
                                type="password"
                                required
                                minLength={6}
                                autoComplete="new-password"
                                className="h-10 w-full rounded-2xl border bg-background px-3 text-sm outline-none ring-green-600/20 placeholder:text-muted-foreground focus:ring-4"
                                placeholder="At least 6 characters"
                            />
                            <p className="text-xs text-muted-foreground">
                                Use 6+ characters. For best security, mix letters and numbers.
                            </p>
                        </div>

                        <FormSubmitButton
                            idleLabel="Sign up"
                            pendingLabel="Creating account..."
                            className="w-full rounded-2xl bg-green-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </form>

                    <p className="mt-6 text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <a
                            className="font-medium text-green-700 underline-offset-4 hover:underline dark:text-green-400"
                            href="/login"
                        >
                            Log in
                        </a>
                    </p>
                </div>

                <p className="mt-6 text-center text-xs text-muted-foreground">
                    We’ll send you a confirmation email after signup.
                </p>
            </div>
        </div>
    );
}
