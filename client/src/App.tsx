import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Customers from "./pages/Customers";
import CustomerProfile from "./pages/CustomerProfile";
import Sales from "./pages/Sales";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import CustomerPortal from "./pages/CustomerPortal";
import RewardsDashboard from "./pages/RewardsDashboard";
import RewardsManagement from "./pages/RewardsManagement";
import CustomerWallet from "./pages/CustomerWallet";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Users from "./pages/Users";
import NotFound from "./pages/NotFound";
import Services from "./pages/Services";
import Visits from "./pages/Visits";
import Bookings from "./pages/Bookings";
import Staff from "./pages/Staff";
import Dashboard from "./pages/Dashboard";
import LandingPage from "./pages/LandingPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import TenantManagement from "./pages/TenantManagement";
import SubscriptionPlans from "./pages/SubscriptionPlans";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/portal" element={<CustomerPortal />} />
          {/* Super Admin Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/super-admin" element={<SuperAdminDashboard />} />
            <Route path="/super-admin/tenant/:tenantId" element={<TenantManagement />} />
            <Route path="/super-admin/plans" element={<SubscriptionPlans />} />
          </Route>
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/index" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/services" element={<Services />} />
            <Route path="/visits" element={<Visits />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerProfile />} />
            {/* <Route path="/sales" element={<Sales />} /> */}
            <Route path="/rewards" element={<RewardsDashboard />} />
            <Route path="/rewards/manage" element={<RewardsManagement />} />
            {/* <Route path="/rewards/wallet" element={<CustomerWallet />} /> */}
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            {/* <Route path="/websites" element={<Websites />} /> */}
            <Route path="/users" element={<Users />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
