"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Play, ArrowRight, AlertCircle, Loader2, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);
    setFormError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setFieldError("Email address is required");
      return;
    }
    if (!emailRegex.test(email.trim())) {
      setFieldError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to process request");
        setIsSubmitting(false);
        return;
      }

      setIsSent(true);
      setIsSubmitting(false);
    } catch {
      setFormError("Network error. Please try again.");
      setIsSubmitting(false);
    }
  };

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
          Reset Your Password
        </h1>
        <p className="text-slate-400 text-sm mt-2">
          Enter your account email to receive a secure, single-use password recovery link.
        </p>
      </div>

      <div className="max-w-md w-full mx-auto bg-slate-900/60 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
        {formError && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">{formError}</div>
          </div>
        )}

        {isSent ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 bg-blue-950 border border-blue-700/80 rounded-2xl flex items-center justify-center mx-auto text-blue-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">Reset Link Dispatched</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              If an account exists for <span className="text-white font-semibold">{email}</span>, a secure password recovery link has been generated.
            </p>
            <p className="text-xs text-slate-500">
              Check your inbox or server logs (in development). The reset token will expire in 1 hour.
            </p>
            <div className="pt-4">
              <Link href="/login">
                <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold h-11 rounded-xl">
                  Return to Log In
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="forgot-email" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Account Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldError) setFieldError(null);
                  }}
                  placeholder="alex@example.com"
                  className={`w-full bg-slate-950 border ${
                    fieldError ? "border-red-500" : "border-slate-800"
                  } focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-10 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all`}
                  disabled={isSubmitting}
                />
              </div>
              {fieldError && (
                <p className="mt-1.5 text-xs text-red-400 font-medium">{fieldError}</p>
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
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Send Recovery Link</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-slate-800 text-center text-xs text-slate-400">
          Remember your password?{" "}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-bold ml-1">
            Back to Log In
          </Link>
        </div>
      </div>

      <div className="max-w-md w-full mx-auto text-center mt-8 text-xs text-slate-500">
        Password recovery links are single-use and expire after 60 minutes.
      </div>
    </div>
  );
}
