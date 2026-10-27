import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext';
import { NotificationProvider } from './context/NotificationContext';

// Layouts
import AppLayout from './components/layout/AppLayout';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import FeaturesPage from './pages/public/FeaturesPage';
import PricingPage from './pages/public/PricingPage';
import AboutPage from './pages/public/AboutPage';
import ContactPage from './pages/public/ContactPage';
import PrivacyPage from './pages/public/PrivacyPage';
import TermsPage from './pages/public/TermsPage';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// Onboarding
import OnboardingBusinessPage from './pages/onboarding/OnboardingBusinessPage';

// Authenticated Application Modules
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { CustomersPage } from './pages/customers/CustomersPage';
import { CustomerDetailPage } from './pages/customers/CustomerDetailPage';
import { LeadsPage } from './pages/leads/LeadsPage';
import { ProductsPage } from './pages/products/ProductsPage';
import { ProjectsPage } from './pages/projects/ProjectsPage';
import { ProjectDetailPage } from './pages/projects/ProjectDetailPage';
import { TasksPage } from './pages/tasks/TasksPage';
import { TeamPage } from './pages/team/TeamPage';
import { FinancePage } from './pages/finance/FinancePage';
import { InvoicesPage } from './pages/invoices/InvoicesPage';
import { NewInvoicePage } from './pages/invoices/NewInvoicePage';
import { InvoiceDetailPage } from './pages/invoices/InvoiceDetailPage';
import { InventoryPage } from './pages/inventory/InventoryPage';
import { MarketingPage } from './pages/marketing/MarketingPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import SettingsPage from './pages/settings/SettingsPage';
import PlatformAdminPage from './pages/platform/PlatformAdminPage';

// Route Guards
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f5] text-stone-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-stone-500 font-medium">Validating SmartBiz session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function WorkspaceRoute({ children }) {
  const { currentBusiness, workspace, businessId, loading: wsLoading } = useWorkspace();
  const { activeWorkspace, workspaces, loading: authLoading } = useAuth();

  if (wsLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f5]">
        <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasWorkspace = currentBusiness || workspace || businessId || activeWorkspace || (workspaces && workspaces.length > 0);

  // If user has no active business workspaces, redirect to onboarding wizard
  if (!hasWorkspace) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

function PlatformAdminRoute({ children }) {
  const { user } = useAuth();
  if (user?.role !== 'superadmin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WorkspaceProvider>
          <NotificationProvider>
            <Routes>
              {/* Public Marketing & Legal Pages */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />

              {/* Public Authentication Pages */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ForgotPasswordPage />} />
              <Route path="/verify-email" element={<LoginPage />} />

              {/* Workspace Onboarding */}
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <OnboardingBusinessPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/onboarding/business"
                element={
                  <ProtectedRoute>
                    <OnboardingBusinessPage />
                  </ProtectedRoute>
                }
              />

              {/* Authenticated Workspace Application Layout */}
              <Route
                element={
                  <ProtectedRoute>
                    <WorkspaceRoute>
                      <AppLayout />
                    </WorkspaceRoute>
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<DashboardPage />} />

                {/* CRM Customers */}
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/customers/new" element={<CustomersPage />} />
                <Route path="/customers/:customerId" element={<CustomerDetailPage />} />

                {/* Sales Leads Pipeline */}
                <Route path="/leads" element={<LeadsPage />} />
                <Route path="/leads/new" element={<LeadsPage />} />
                <Route path="/leads/:leadId" element={<LeadsPage />} />

                {/* Catalog */}
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/new" element={<ProductsPage />} />

                {/* Projects & Tasks */}
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/new" element={<ProjectsPage />} />
                <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/team" element={<TeamPage />} />

                {/* Finance & Invoicing */}
                <Route path="/finance" element={<FinancePage />} />
                <Route path="/finance/transactions" element={<FinancePage />} />
                <Route path="/finance/expenses" element={<FinancePage />} />
                <Route path="/invoices" element={<InvoicesPage />} />
                <Route path="/invoices/new" element={<NewInvoicePage />} />
                <Route path="/invoices/:invoiceId" element={<InvoiceDetailPage />} />

                {/* Operations & Analytics */}
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/marketing" element={<MarketingPage />} />
                <Route path="/marketing/campaigns" element={<MarketingPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />

                {/* Settings */}
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/settings/profile" element={<SettingsPage />} />
                <Route path="/settings/business" element={<SettingsPage />} />
                <Route path="/settings/team" element={<TeamPage />} />
                <Route path="/settings/roles" element={<SettingsPage />} />
                <Route path="/settings/notifications" element={<SettingsPage />} />
                <Route path="/settings/billing" element={<SettingsPage />} />
                <Route path="/settings/security" element={<SettingsPage />} />

                {/* Platform Super Administrator */}
                <Route
                  path="/platform"
                  element={
                    <PlatformAdminRoute>
                      <PlatformAdminPage />
                    </PlatformAdminRoute>
                  }
                />
              </Route>

              {/* 404 Catch-All */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </NotificationProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
