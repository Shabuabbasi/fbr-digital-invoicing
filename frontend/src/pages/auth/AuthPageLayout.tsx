import React from "react";
import GridShape from "../../components/common/GridShape";
import { Link } from "react-router";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-1 bg-white p-6 sm:p-0 dark:bg-gray-900">
      <div className="relative flex h-screen w-full flex-col justify-center lg:flex-row dark:bg-gray-900 sm:p-0">
        {children}
        <div className="relative hidden h-full w-full items-center justify-items-center overflow-hidden bg-brand-950 lg:grid lg:w-1/2 dark:bg-white/5">
          <GridShape />
          <div className="relative z-10 flex max-w-xs flex-col items-center">
            <Link to="/login" className="mb-4 flex items-center justify-center gap-3">
              <img width={56} height={56} src="/images/logo/logo.png" alt="Intelgency" className="rounded-full" />
              <span className="text-2xl font-semibold text-white">Intelgency</span>
            </Link>
            <p className="text-center text-gray-400 dark:text-white/60">
              Intelgency Digital Invoicing — create, manage, and submit invoices with FBR
              integration.
            </p>
          </div>
        </div>
        <div className="fixed right-6 bottom-6 z-50 hidden sm:block">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}
