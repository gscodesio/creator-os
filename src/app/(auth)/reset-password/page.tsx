"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Play,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Lock,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!token) {
      setFormError("Missing or invalid password reset token in URL.");
      return false;
    }

    if (!password) {
      errors.password = "New password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    } else if (!/[0-9]|[^a-zA-Z0-9]/.test(password)) {
      errors.password = "Password must include at least one number or special character";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your new password";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to reset password.");
        setIsSubmitting(false);
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push("/login?reset=success");
      }, 1500);
    } catch {
      setFormError("Network error. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="max-w-md w-full mx-auto bg-slate-900/60 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center space-y-4">
        <div className="w-12 h-12 bg-red-950 border border-red-800 rounded-2xl flex items-center justify-center mx-auto text-red-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-white">Invalid Reset Link</h3>
        <p className="text-sm text-slate-400">
          This password reset link is invalid or has expired. Please request a new one.
        </p>
        <div className="pt-2">
          <Link href="/forgot-password">
            <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold h-11 rounded-xl">
              Request New Link
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full mx-auto bg-slate-900/60 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
      {formError && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">{formError}</div>
        </div>
      )}

      {isSuccess ? (
        <div className="text-center py-6 space-y-4">
          <div className="w-14 h-14 bg-emerald-950 border border-emerald-700/80 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">Password Updated!</h3>
          <p className="text-sm text-slate-400">
            All previous active sessions have been revoked. Redirecting to login...
          </p>
          <div className="flex justify-center pt-2">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label htmlFor="new-password" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: "" });
                }}
                placeholder="Min 8 characters with number/symbol"
                className={`w-full bg-slate-950 border ${
                  fieldErrors.password ? "border-red-500" : "border-slate-800"
                } focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-10 pr-12 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all`}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1.5 text-xs text-red-400 font-medium">{fieldErrors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirm-new-password" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="confirm-new-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword)
                    setFieldErrors({ ...fieldErrors, confirmPassword: "" });
                }}
                placeholder="Re-enter new password"
                className={`w-full bg-slate-950 border ${
                  fieldErrors.confirmPassword ? "border-red-500" : "border-slate-800"
                } focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-10 pr-12 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all`}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="mt-1.5 text-xs text-red-400 font-medium">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm h-12 rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Resetting Password...</span>
              </>
            ) : (
              <>
                <span>Set New Password</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>
      )}

      <div className="mt-6 pt-6 border-t border-slate-800 text-center text-xs text-slate-400">
        <Link href="/login" className="text-blue-400 hover:text-blue-300 font-bold">
          Back to Log In
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between py-12 px-6 selection:bg-blue-600 selection:text-white font-sans antialiased">
      <div className="max-w-md w-full mx-auto text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl w-10 h-10 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform">
            <Play className="h-5 w-5 text-white fill-white ml-0.5" />
          </div>
          <span className="font-extrabold text-xl text-white tracking-wider uppercase">
            CREATOR OS
          </span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-black text-white mt-6 tracking-tight">
          Choose a New Password
        </h1>
        <p className="text-slate-400 text-sm mt-2">
          Your new password must be at least 8 characters long.
        </p>
      </div>

      <Suspense fallback={<div className="text-center text-slate-500">Loading form...</div>}>
        <ResetPasswordForm />
      </Suspense>

      <div className="max-w-md w-full mx-auto text-center mt-8 text-xs text-slate-500">
        Changing your password invalidates all existing active sessions immediately.
      </div>
    </div>
  );
}
