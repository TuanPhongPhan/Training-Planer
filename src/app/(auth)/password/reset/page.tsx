import { updatePassword } from "@/app/actions/auth/password-reset";

export default function ResetPasswordPage() {
    return (
        <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center p-6">
            <h1 className="text-2xl font-semibold tracking-tight">Set new password</h1>
            <p className="mt-1 text-sm text-muted-foreground">
                Choose a new password for your account.
            </p>

            <form action={updatePassword} className="mt-6 space-y-3">
                <div className="space-y-1">
                    <label className="text-sm font-medium">New password</label>
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
                    Update password
                </button>
            </form>
        </div>
    );
}
