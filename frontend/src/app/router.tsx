import { createBrowserRouter, Navigate } from "react-router-dom";
import AppLayout from "../layout/AppLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { Login } from "../pages/auth/Login";
import { Dashboard } from "../pages/dashboard/Dashboard";
import { ProductsList } from "../pages/products/ProductsList";
import { ProductNew } from "../pages/products/ProductNew";
import { ProductEdit } from "../pages/products/ProductEdit";
import { CustomersList } from "../pages/customers/CustomersList";
import { CustomerNew } from "../pages/customers/CustomerNew";
import { CustomerDetail } from "../pages/customers/CustomerDetail";
import { InvoicesList } from "../pages/invoices/InvoicesList";
import { InvoiceNew } from "../pages/invoices/InvoiceNew";
import { InvoiceDetail } from "../pages/invoices/InvoiceDetail";
import { InvoicePrint } from "../pages/invoices/InvoicePrint";
import { FbrSubmissions } from "../pages/fbr/FbrSubmissions";
import { FbrLogs } from "../pages/fbr/FbrLogs";
import { SalesReport } from "../pages/reports/SalesReport";
import { InvoiceReport } from "../pages/reports/InvoiceReport";
import { TaxReport } from "../pages/reports/TaxReport";
import { CompanySettings } from "../pages/settings/CompanySettings";
import { FbrConfiguration } from "../pages/settings/FbrConfiguration";
import { UsersSettings } from "../pages/settings/UsersSettings";
import { Profile } from "../pages/profile/Profile";

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  {
    element: <ProtectedRoute />,
    children: [
      // Print view renders full-page, without the dashboard chrome.
      { path: "/invoices/:id/print", element: <InvoicePrint /> },
      {
        element: <AppLayout />,
        children: [
          { path: "/", element: <Navigate to="/dashboard" replace /> },
          { path: "/dashboard", element: <Dashboard /> },
          { path: "/products", element: <ProductsList /> },
          { path: "/products/new", element: <ProductNew /> },
          { path: "/products/:id/edit", element: <ProductEdit /> },
          { path: "/customers", element: <CustomersList /> },
          { path: "/customers/new", element: <CustomerNew /> },
          { path: "/customers/:id", element: <CustomerDetail /> },
          { path: "/invoices", element: <InvoicesList /> },
          { path: "/invoices/new", element: <InvoiceNew /> },
          { path: "/invoices/:id", element: <InvoiceDetail /> },
          { path: "/fbr/submissions", element: <FbrSubmissions /> },
          { path: "/fbr/logs", element: <FbrLogs /> },
          { path: "/reports/sales", element: <SalesReport /> },
          { path: "/reports/invoices", element: <InvoiceReport /> },
          { path: "/reports/tax", element: <TaxReport /> },
          { path: "/profile", element: <Profile /> },
          {
            element: <ProtectedRoute allowedRoles={["ADMIN"]} />,
            children: [
              { path: "/settings/company", element: <CompanySettings /> },
              { path: "/settings/fbr", element: <FbrConfiguration /> },
              { path: "/settings/users", element: <UsersSettings /> },
            ],
          },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
