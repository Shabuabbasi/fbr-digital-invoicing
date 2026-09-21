import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import clsx from "clsx";
import { useAuth } from "../context/AuthContext";
import { canAccess } from "../utils/rbac";
import { filterNav, navSections } from "./navConfig";

export function DashboardLayout() {
  const { user, company, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return null;

  const sections = filterNav(navSections, user.role, canAccess);

  return (
    <div className="flex h-screen overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-99999 bg-gray-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={clsx(
          "fixed left-0 top-0 z-9999 flex h-screen w-[290px] flex-col overflow-y-hidden border-r border-gray-200 bg-white px-5 transition-transform duration-300 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-2 pb-7 pt-8">
          <NavLink to="/dashboard" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
            <img src="/images/logo/logo.svg" alt="Intelgency" className="h-8" />
          </NavLink>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.22 7.28a.75.75 0 0 1 1.06-1.06L12 10.94l4.72-4.72a.75.75 0 1 1 1.06 1.06L13.06 12l4.72 4.72a.75.75 0 1 1-1.06 1.06L12 13.06l-4.72 4.72a.75.75 0 0 1-1.06-1.06L10.94 12 6.22 7.28Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>

        <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
          <nav className="mb-6">
            {sections.map((section, idx) => (
              <div key={idx} className={idx > 0 ? "mt-6" : undefined}>
                <h3 className="mb-4 text-xs uppercase leading-5 text-gray-400">
                  {section.label ?? (idx === 0 ? "Menu" : "\u00a0")}
                </h3>
                <ul className="mb-2 flex flex-col gap-1">
                  {section.items.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                          clsx("menu-item group", isActive ? "menu-item-active" : "menu-item-inactive")
                        }
                      >
                        <span className="menu-item-text">{item.label}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </aside>

      <div className="relative flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
        <header className="sticky top-0 z-99999 flex w-full border-gray-200 bg-white lg:border-b">
          <div className="flex w-full grow flex-col items-center justify-between lg:flex-row lg:px-6">
            <div className="flex w-full items-center justify-between gap-2 border-b border-gray-200 px-3 py-3 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">
              <button
                type="button"
                className="z-99999 flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 lg:h-11 lg:w-11"
                onClick={() => setSidebarOpen((open) => !open)}
                aria-label="Toggle sidebar"
              >
                <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden>
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M0.583 1c0-.414.336-.75.75-.75h13.334c.414 0 .75.336.75.75s-.336.75-.75.75H1.333A.75.75 0 0 1 .583 1Zm0 10c0-.414.336-.75.75-.75h13.334c.414 0 .75.336.75.75s-.336.75-.75.75H1.333a.75.75 0 0 1-.75-.75ZM1.333 5.25a.75.75 0 0 0 0 1.5h6.667a.75.75 0 0 0 0-1.5H1.333Z"
                    fill="currentColor"
                  />
                </svg>
              </button>

              <NavLink to="/dashboard" className="lg:hidden">
                <img src="/images/logo/logo.svg" alt="Intelgency" className="h-8" />
              </NavLink>

              <div className="hidden lg:block">
                <p className="text-theme-sm font-medium text-gray-800">{company?.name ?? "—"}</p>
              </div>
            </div>

            <div className="flex w-full items-center justify-between gap-4 px-5 py-4 lg:flex-grow-0 lg:justify-end lg:px-0 lg:shadow-none">
              <div className="lg:hidden">
                <p className="text-theme-sm font-medium text-gray-800">{company?.name ?? "—"}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-theme-sm font-medium text-gray-800">{user.name}</p>
                  <p className="text-theme-xs text-gray-500">{user.role}</p>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <main>
          <div className="mx-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
