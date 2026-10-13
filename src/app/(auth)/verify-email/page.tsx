"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Play, CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(token ? "loading" : "error");
  const [errorMessage, setErrorMessage] = useState(token ? "" : "No verification token provided in URL.");

  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    async function verify() {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token!)}`);
        const data = await res.json();

        if (!isMounted) return;

        if (res.ok) {
          setStatus("success");
        } else {
          setStatus("error");
          setErrorMessage(data.error || "Verification link is invalid or has expired.");
        }
      } catch {
        if (isMounted) {
          setStatus("error");
          setErrorMessage("Network error verifying email. Please try again.");
        }
      }
    }

    verify();

    return () => {
      isMounted = false;
    };
  }, [token]);

  return (
    <div className="max-w-md w-full mx-auto bg-slate-900/60 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-sm text-center">
      {status === "loading" && (
        <div className="py-8 space-y-4">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto" />
          <h3 className="text-xl font-bold text-white">Verifying Your Email...</h3>
          <p className="text-sm text-slate-400">Please wait while we confirm your credentials.</p>
        </div>
      )}

      {status === "success" && (
        <div className="py-6 space-y-4">
          <div className="w-14 h-14 bg-emerald-950 border border-emerald-700/80 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">Email Verified!</h3>
          <p className="text-sm text-slate-300">
            Your email address has been verified successfully. Your account and workspace are active.
          </p>
          <div className="pt-4">
            <Link href="/login?verified=true">
              <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-11 rounded-xl flex items-center justify-center gap-2">
                <span>Continue to Log In</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="py-6 space-y-4">
          <div className="w-14 h-14 bg-red-950 border border-red-800/80 rounded-2xl flex items-center justify-center mx-auto text-red-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">Verification Failed</h3>
          <p className="text-sm text-slate-400 leading-relaxed">{errorMessage}</p>
          <div className="pt-4">
            <Link href="/login">
              <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold h-11 rounded-xl">
                Go to Log In
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
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
          Email Verification
        </h1>
      </div>

      <Suspense fallback={<div className="text-center text-slate-500">Checking verification token...</div>}>
        <VerifyEmailContent />
      </Suspense>

      <div className="max-w-md w-full mx-auto text-center mt-8 text-xs text-slate-500">
        Creator OS secure authentication and token validation.
      </div>
    </div>
  );
}
