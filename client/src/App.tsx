import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WebSocketProvider } from "@/contexts/WebSocketContext";

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
import Inbox from "./pages/Inbox";
import ContactMessages from "./pages/ContactMessages";
import ReviewPage from "./pages/ReviewPage";
import Reviews from "./pages/Reviews";
import PlatformReview from "./pages/PlatformReview";
import Inventory from "./pages/Inventory";
import Expenses from "./pages/Expenses";
import Gallery from "./pages/Gallery";
import ForgotPassword from "./pages/ForgotPassword";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <WebSocketProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/review/:visitId" element={<ReviewPage />} />

            {/* Customer Portal - Protected */}
            <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
              <Route path="/portal" element={<CustomerPortal />} />
            </Route>

            {/* Super Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/super-admin" element={<SuperAdminDashboard />} />
              <Route path="/super-admin/tenant/:tenantId" element={<TenantManagement />} />
              <Route path="/super-admin/plans" element={<SubscriptionPlans />} />
            </Route>

            {/* Business Admin/Staff Routes */}
            <Route element={<ProtectedRoute allowedRoles={['tenant_admin', 'staff', 'admin']} />}>
              <Route path="/index" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/services" element={<Services />} />
              <Route path="/visits" element={<Visits />} />
              <Route path="/bookings" element={<Bookings />} />
              <Route path="/staff" element={<Staff />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/customers/:id" element={<CustomerProfile />} />
              <Route path="/rewards" element={<RewardsDashboard />} />
              <Route path="/rewards/manage" element={<RewardsManagement />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/inbox" element={<Inbox />} />
              <Route path="/contact-messages" element={<Inbox />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/platform-review" element={<PlatformReview />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/users" element={<Users />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </WebSocketProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
