import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Scissors, Eye, EyeOff, User, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { registerBusiness, registerCustomer, searchTenants, Tenant } from "../services/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Business form state
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("Salon");
  const [ownerName, setOwnerName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");

  // Customer form state
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerPassword, setCustomerPassword] = useState("");
  const [customerConfirmPassword, setCustomerConfirmPassword] = useState("");
  const [tenantSearchQuery, setTenantSearchQuery] = useState("");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isSearchingTenants, setIsSearchingTenants] = useState(false);
  const [customerReferralCode, setCustomerReferralCode] = useState("");

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleBusinessSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !businessName || !city || !phone || !ownerName) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (!agreeTerms) {
      toast({
        title: "Error",
        description: "Please agree to the terms and conditions",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await registerBusiness({
        business_name: businessName,
        business_type: businessType,
        city,
        phone_number: phone,
        owner_name: ownerName,
        email,
        password,
        confirm_password: confirmPassword
      });
      toast({
        title: "Application Submitted!",
        description: "Your business application is under review. You'll be notified once approved.",
      });
      navigate("/login");
    } catch (error: any) {
      // Extract error message from response if possible
      let errorMessage = "Failed to submit application";
      if (error.message && error.message.includes("400")) {
        errorMessage = "Registration failed. Please check your inputs (Email might be taken).";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTenantSearch = async (query: string) => {
    setTenantSearchQuery(query);
    if (query.length < 2) {
      setTenants([]);
      return;
    }

    setIsSearchingTenants(true);
    try {
      const results = await searchTenants(query);
      setTenants(results);
    } catch (error) {
      console.error("Failed to search tenants", error);
    } finally {
      setIsSearchingTenants(false);
    }
  };

  const selectTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setTenantSearchQuery(tenant.name);
    setTenants([]); // Hide results
  };

  const handleCustomerSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName || !customerEmail || !customerPhone || !selectedTenant || !customerPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields and select a business",
        variant: "destructive",
      });
      return;
    }

    if (customerPassword !== customerConfirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (!agreeTerms) {
      toast({
        title: "Error",
        description: "Please agree to the terms and conditions",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await registerCustomer({
        full_name: customerName,
        email: customerEmail,
        phone_number: customerPhone,
        password: customerPassword,
        confirm_password: customerConfirmPassword,
        tenant_id: selectedTenant.id,
        referral_code: customerReferralCode
      });
      toast({
        title: "Registration successful!",
        description: "Your customer profile has been created. You can now access the portal.",
      });
      navigate("/login");
    } catch (error: any) {
      console.error("Registration error:", error);
      let errorMessage = "Failed to register customer";

      // Try to extract the specific error message from the backend
      if (error.message) {
        // The error message from api.ts includes the status and body
        // e.g., "Failed to register customer: 400 {"error":"Email already registered"}"
        try {
          const bodyPart = error.message.split('}')[0].split('{')[1];
          if (bodyPart) {
            const body = JSON.parse('{' + bodyPart + '}');
            errorMessage = body.error || body.detail || Object.values(body)[0] as string || errorMessage;
          }
        } catch (e) {
          // If parsing fails, just use the status if available
          if (error.message.includes("400")) {
            errorMessage = "Registration failed. Please check if the email or phone is already registered.";
          }
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/hero-bg.jpg"
            alt="Luxury Salon Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-chocolate-dark/95 via-chocolate-dark/80 to-chocolate-dark/40" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-center">
          {/* Logo */}
          <div className="mb-8 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
            <img src="/logo.png" alt="ClientPulse Logo" className="h-24 w-24 object-contain" />
          </div>

          <h1 className="text-6xl font-display font-bold text-white mb-4 tracking-tight">
            ClientPulse
          </h1>
          <p className="text-xl text-cream/80 font-light max-w-md leading-relaxed">
            The all-in-one management and loyalty platform for modern beauty businesses.
          </p>

          <div className="mt-16 space-y-6 w-full max-w-sm">
            {[
              { num: "1", text: "Track services & appointments" },
              { num: "2", text: "Manage loyalty & memberships" },
              { num: "3", text: "Enhance client experience" }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 text-white/90 bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-all">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shrink-0 shadow-lg">
                  <span className="text-accent-foreground text-lg font-bold">{item.num}</span>
                </div>
                <span className="text-left font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="p-4 rounded-xl bg-primary mb-4">
              <Scissors className="h-10 w-10 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">ClientPulse</h1>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-display font-bold text-foreground">
              Create Account
            </h2>
            <p className="mt-2 text-muted-foreground">
              Get started with your free account
            </p>
          </div>

          <Tabs defaultValue="admin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Business Owner
              </TabsTrigger>
              <TabsTrigger value="customer" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Customer
              </TabsTrigger>
            </TabsList>

            <TabsContent value="admin">
              <form onSubmit={handleBusinessSignup} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="ownerName" className="text-foreground">Owner Full Name</Label>
                  <Input id="ownerName" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className="h-12 bg-muted/50" placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessName" className="text-foreground">Business Name</Label>
                  <Input id="businessName" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="h-12 bg-muted/50" placeholder="My Salon" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessType" className="text-foreground">Type</Label>
                    <select
                      id="businessType"
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      className="flex h-12 w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="Salon">Salon</option>
                      <option value="Kinyozi">Kinyozi</option>
                      <option value="Spa">Spa</option>
                      <option value="Multi-service">Multi-service</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-foreground">City</Label>
                    <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} className="h-12 bg-muted/50" placeholder="Nairobi" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-foreground">Phone Number</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 bg-muted/50" placeholder="0712345678" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 bg-muted/50 border-border focus:border-accent focus:ring-accent/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 bg-muted/50 border-border focus:border-accent focus:ring-accent/30 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-foreground">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 bg-muted/50 border-border focus:border-accent focus:ring-accent/30"
                  />
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms-admin"
                    checked={agreeTerms}
                    onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                    className="border-border data-[state=checked]:bg-accent mt-0.5"
                  />
                  <Label htmlFor="terms-admin" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                    I agree to the{" "}
                    <Link to="/terms" className="text-accent hover:underline cursor-pointer">Terms of Service</Link>
                    {" "}and{" "}
                    <Link to="/privacy" className="text-accent hover:underline cursor-pointer">Privacy Policy</Link>
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-accent hover:bg-caramel text-accent-foreground font-bold text-base shadow-lg shadow-accent/20 transition-all duration-300 hover:shadow-xl"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating account...</span>
                    </div>
                  ) : (
                    "Submit Application"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="customer">
              <form onSubmit={handleCustomerSignup} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="customerName" className="text-foreground">
                    Full Name
                  </Label>
                  <Input
                    id="customerName"
                    type="text"
                    placeholder="John Doe"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="h-12 bg-muted/50 border-border focus:border-accent focus:ring-accent/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerEmail" className="text-foreground">
                    Email Address
                  </Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    placeholder="name@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="h-12 bg-muted/50 border-border focus:border-accent focus:ring-accent/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerPhone" className="text-foreground">
                    Phone Number
                  </Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="h-12 bg-muted/50 border-border focus:border-accent focus:ring-accent/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerPassword" className="text-foreground">
                    Password
                  </Label>
                  <Input
                    id="customerPassword"
                    type="password"
                    placeholder="Create a password"
                    value={customerPassword}
                    onChange={(e) => setCustomerPassword(e.target.value)}
                    className="h-12 bg-muted/50 border-border focus:border-accent focus:ring-accent/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerConfirmPassword" className="text-foreground">
                    Confirm Password
                  </Label>
                  <Input
                    id="customerConfirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={customerConfirmPassword}
                    onChange={(e) => setCustomerConfirmPassword(e.target.value)}
                    className="h-12 bg-muted/50 border-border focus:border-accent focus:ring-accent/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referralCode" className="text-foreground">
                    Referral Code (Optional)
                  </Label>
                  <Input
                    id="referralCode"
                    type="text"
                    placeholder="ENTER-CODE"
                    value={customerReferralCode}
                    onChange={(e) => setCustomerReferralCode(e.target.value.toUpperCase())}
                    className="h-12 bg-muted/50 border-border focus:border-accent focus:ring-accent/30 font-mono tracking-widest"
                  />
                  <p className="text-[10px] text-muted-foreground ml-1">Got a friend's code? Enter it here for bonus points!</p>
                </div>

                <div className="space-y-2 relative">
                  <Label htmlFor="tenantSearch" className="text-foreground">
                    Find Your Business
                  </Label>
                  <Input
                    id="tenantSearch"
                    type="text"
                    placeholder="Search by business name..."
                    value={tenantSearchQuery}
                    onChange={(e) => handleTenantSearch(e.target.value)}
                    className="h-12 bg-muted/50 border-border focus:border-accent focus:ring-accent/30"
                  />
                  {isSearchingTenants && (
                    <div className="absolute right-3 top-10">
                      <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}

                  {tenants.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-zinc-900 border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                      {tenants.map((tenant) =>
                        <div
                          key={tenant.id}
                          onClick={() => selectTenant(tenant)}
                          className="p-3 hover:bg-muted cursor-pointer transition-colors border-b border-border last:border-0"
                        >
                          <div className="font-medium">{tenant.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {tenant.business_type} • {tenant.city} <br />
                            <span className="text-accent/80">Owner: {tenant.owner_name}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedTenant && (
                    <div className="mt-2 p-2 bg-accent/10 border border-accent/20 rounded text-sm text-accent-foreground flex justify-between items-center">
                      <span>Selected: <strong>{selectedTenant.name}</strong></span>
                      <button type="button" onClick={() => setSelectedTenant(null)} className="text-xs underline">Change</button>
                    </div>
                  )}
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms-customer"
                    checked={agreeTerms}
                    onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                    className="border-border data-[state=checked]:bg-accent mt-0.5"
                  />
                  <Label htmlFor="terms-customer" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                    I agree to the{" "}
                    <Link to="/terms" className="text-accent hover:underline cursor-pointer">Terms of Service</Link>
                    {" "}and{" "}
                    <Link to="/privacy" className="text-accent hover:underline cursor-pointer">Privacy Policy</Link>
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-accent hover:bg-caramel text-accent-foreground font-bold text-base shadow-lg shadow-accent/20 transition-all duration-300 hover:shadow-xl"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Registering...</span>
                    </div>
                  ) : (
                    "Register as Customer"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-background text-muted-foreground">
                or continue with
              </span>
            </div>
          </div>

          {/* Social Login */}
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              className="h-12 border-border hover:bg-muted/50 hover:border-accent/20 transition-all"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>
          </div>

          {/* Toggle to Login */}
          <p className="text-center text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-accent hover:text-caramel font-bold transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;