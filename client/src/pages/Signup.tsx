import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Scissors, Eye, EyeOff, User, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { register, registerCustomer } from "../services/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Customer form state
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAdminSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
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
      await register({ username: email, email, password });
      toast({
        title: "Account created!",
        description: "Your admin account has been created successfully. Please login.",
      });
      navigate("/login");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomerSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName || !customerEmail || !customerPhone) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
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
        name: customerName,
        email: customerEmail,
        phone: customerPhone
      });
      toast({
        title: "Registration successful!",
        description: "Your customer profile has been created. You can now access the portal.",
      });
      navigate("/login");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to register customer",
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
                Admin
              </TabsTrigger>
              <TabsTrigger value="customer" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Customer
              </TabsTrigger>
            </TabsList>

            <TabsContent value="admin">
              <form onSubmit={handleAdminSignup} className="space-y-5">
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
                    "Create Admin Account"
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