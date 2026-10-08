import { Suspense } from "react";
import ResetPasswordForm from "./reset-password-form";

function ResetPasswordFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950" role="status" aria-busy="true">
      <div className="max-w-md w-full p-8 bg-zinc-900 rounded-lg border border-zinc-800">
        <div className="h-7 w-56 rounded bg-zinc-800 animate-pulse mx-auto" />
        <div className="mt-6 h-11 w-full rounded-md bg-zinc-800 animate-pulse" />
        <div className="mt-4 h-11 w-full rounded-md bg-zinc-800 animate-pulse" />
        <div className="mt-4 h-12 w-full rounded-md bg-zinc-800 animate-pulse" />
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
