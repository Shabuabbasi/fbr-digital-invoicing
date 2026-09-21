import type { ReactNode } from "react";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative z-1 bg-white p-6 sm:p-0">
      <div className="relative flex h-screen w-full flex-col justify-center lg:flex-row">
        <div className="flex w-full flex-1 flex-col lg:w-1/2">
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
            <div className="mb-5 sm:mb-8">
              <div className="mb-6 flex items-center gap-3">
                <img src="/images/logo/auth-logo.svg" alt="Intelgency" className="h-10" />
              </div>
              <h1 className="mb-2 text-title-sm font-semibold text-gray-800 sm:text-title-md">Sign In</h1>
              <p className="text-sm text-gray-500">Enter your email and password to sign in!</p>
            </div>
            {children}
          </div>
        </div>

        <div className="relative hidden w-full items-center justify-center bg-brand-950 lg:flex lg:w-1/2">
          <div className="flex max-w-md flex-col items-center px-8 text-center">
            <img src="/images/logo/logo-dark.svg" alt="" className="mb-8 h-12 brightness-0 invert" />
            <h2 className="mb-3 text-title-sm font-semibold text-white">Intelgency Digital Invoicing</h2>
            <p className="text-theme-sm text-white/70">
              Create, manage, and submit digital invoices with FBR integration — by Intelgency IT Solutions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
