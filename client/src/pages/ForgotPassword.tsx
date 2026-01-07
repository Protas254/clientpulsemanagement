import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, Mail, Lock, KeyRound, Smartphone } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { requestPasswordReset, resetPassword, requestOTP, verifyOTP, resetPasswordWithOTP } from '@/services/api';

type Step = 'REQUEST' | 'SENT' | 'VERIFY_OTP' | 'RESET' | 'SUCCESS';

export default function ForgotPassword() {
    const [step, setStep] = useState<Step>('REQUEST');
    const [identifier, setIdentifier] = useState(''); // Email or Phone
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const [isEmailFlow, setIsEmailFlow] = useState(true);

    const [searchParams] = useSearchParams();
    const [token, setToken] = useState('');
    const [uid, setUid] = useState('');

    useEffect(() => {
        const tokenParam = searchParams.get('token');
        const uidParam = searchParams.get('uid');
        if (tokenParam && uidParam) {
            setToken(tokenParam);
            setUid(uidParam);
            setStep('RESET');
            setIsEmailFlow(true); // Token flow is always email-link based
        }
    }, [searchParams]);

    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!identifier) {
            toast({
                title: "Error",
                description: "Please enter your email or phone number",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        try {
            // Check if input looks like an email
            const isEmail = identifier.includes('@');
            setIsEmailFlow(isEmail);

            // Use the OTP flow for both now, or keep link for email?
            // User requested "reset using emil or otp way sent in both phone number and email"
            // Let's use OTP flow for both as it's unified.
            // But wait, the backend sends a link for email in the old flow.
            // Let's try the new OTP endpoint.

            await requestOTP(identifier);

            if (isEmail) {
                // For email, we can either show "Check your email for link" (old way) or "Enter OTP" (new way).
                // The backend RequestOTPView sends an OTP via email.
                setStep('VERIFY_OTP');
                toast({
                    title: "OTP Sent",
                    description: "Check your email for the verification code",
                });
            } else {
                setStep('VERIFY_OTP');
                toast({
                    title: "OTP Sent",
                    description: "Check your phone for the verification code",
                });
            }

        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to send OTP. Please check your input and try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp || otp.length !== 6) {
            toast({
                title: "Error",
                description: "Please enter a valid 6-digit OTP",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        try {
            await verifyOTP(identifier, otp);
            setStep('RESET');
            toast({
                title: "Verified",
                description: "OTP verified successfully",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Invalid or expired OTP",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast({
                title: "Error",
                description: "Passwords do not match",
                variant: "destructive",
            });
            return;
        }

        if (password.length < 8) {
            toast({
                title: "Error",
                description: "Password must be at least 8 characters",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        try {
            if (token && uid) {
                // Old Link Flow
                await resetPassword(token, uid, password);
            } else {
                // New OTP Flow
                await resetPasswordWithOTP(identifier, otp, password);
            }

            setStep('SUCCESS');
            toast({
                title: "Success",
                description: "Your password has been updated",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to reset password",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
            <div className="w-full max-w-md animate-fade-in">
                {/* Header Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="p-3 rounded-2xl bg-white shadow-sm mb-4">
                        <img src="/logo.png" alt="ClientPulse Logo" className="h-10 w-10 object-contain" />
                    </div>
                    <h1 className="text-2xl font-display font-bold text-foreground">ClientPulse</h1>
                </div>

                <Card className="border-border shadow-xl">
                    {step === 'REQUEST' && (
                        <>
                            <CardHeader>
                                <CardTitle className="text-2xl text-center">Forgot Password</CardTitle>
                                <CardDescription className="text-center">
                                    Enter your email or phone number to receive a reset code.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleRequestReset} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="identifier">Email or Phone Number</Label>
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                {identifier.includes('@') || identifier === '' ? (
                                                    <Mail className="h-4 w-4" />
                                                ) : (
                                                    <Smartphone className="h-4 w-4" />
                                                )}
                                            </div>
                                            <Input
                                                id="identifier"
                                                type="text"
                                                placeholder="email@example.com or 0712345678"
                                                value={identifier}
                                                onChange={(e) => setIdentifier(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full bg-accent hover:bg-caramel text-accent-foreground"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Sending..." : "Send Code"}
                                    </Button>
                                </form>
                            </CardContent>
                        </>
                    )}

                    {step === 'VERIFY_OTP' && (
                        <>
                            <CardHeader>
                                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                    <Smartphone className="h-6 w-6 text-blue-600" />
                                </div>
                                <CardTitle className="text-2xl text-center">Verify Code</CardTitle>
                                <CardDescription className="text-center">
                                    Enter the 6-digit code sent to <span className="font-medium text-foreground">{identifier}</span>
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleVerifyOTP} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="otp">Verification Code</Label>
                                        <div className="flex justify-center">
                                            <Input
                                                id="otp"
                                                type="text"
                                                maxLength={6}
                                                placeholder="123456"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                                                className="text-center text-2xl tracking-widest w-48"
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full bg-accent hover:bg-caramel text-accent-foreground"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Verifying..." : "Verify Code"}
                                    </Button>
                                    <div className="text-center">
                                        <Button
                                            variant="link"
                                            type="button"
                                            onClick={() => setStep('REQUEST')}
                                            className="text-sm text-muted-foreground"
                                        >
                                            Change {identifier.includes('@') ? 'email' : 'number'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </>
                    )}

                    {step === 'RESET' && (
                        <>
                            <CardHeader>
                                <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                                    <KeyRound className="h-6 w-6 text-amber-600" />
                                </div>
                                <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
                                <CardDescription className="text-center">
                                    Create a new strong password for your account.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleResetPassword} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="password">New Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="password"
                                                type="password"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="confirmPassword"
                                                type="password"
                                                placeholder="••••••••"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full bg-accent hover:bg-caramel text-accent-foreground"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Updating..." : "Reset Password"}
                                    </Button>
                                </form>
                            </CardContent>
                        </>
                    )}

                    {step === 'SUCCESS' && (
                        <>
                            <CardHeader>
                                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                                </div>
                                <CardTitle className="text-2xl text-center">Password Updated</CardTitle>
                                <CardDescription className="text-center">
                                    Your password has been successfully reset. You can now login with your new password.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Link to="/login">
                                    <Button className="w-full bg-accent hover:bg-caramel text-accent-foreground">
                                        Back to Login
                                    </Button>
                                </Link>
                            </CardContent>
                        </>
                    )}

                    <CardFooter className="flex justify-center border-t p-4 bg-muted/20">
                        <Link to="/login" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Login
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
