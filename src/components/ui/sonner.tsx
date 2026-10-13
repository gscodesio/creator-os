"use client";

import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-slate-900 group-[.toaster]:border-slate-200 group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl text-xs font-medium",
          description: "group-[.toast]:text-slate-500 text-xs",
          actionButton:
            "group-[.toast]:bg-blue-600 group-[.toast]:text-white font-medium text-xs",
          cancelButton:
            "group-[.toast]:bg-slate-100 group-[.toast]:text-slate-600 text-xs",
          success: "group-[.toaster]:border-emerald-200 group-[.toaster]:text-emerald-950",
          error: "group-[.toaster]:border-rose-200 group-[.toaster]:text-rose-950",
        },
      }}
      position="bottom-right"
      richColors
      closeButton
      {...props}
    />
  );
};

export { Toaster, toast };
