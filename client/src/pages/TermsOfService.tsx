import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, User, ShieldAlert, Database, Activity, AlertTriangle, XCircle, RefreshCw, Gavel } from 'lucide-react';
import { Button } from "@/components/ui/button";

const TermsOfService = () => {
    const effectiveDate = new Date().toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <img src="/logo.png" alt="ClientPulse Logo" className="w-10 h-10 object-contain" />
                        <span className="text-xl font-display font-bold tracking-tight text-chocolate-dark">ClientPulse</span>
                    </Link>
                    <Link to="/">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ArrowLeft size={16} /> Back to Home
                        </Button>
                    </Link>
                </div>
            </nav>

            <main className="pt-32 pb-24">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="mb-12 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold mb-4">
                            <FileText size={14} />
                            <span>LEGAL AGREEMENT</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-display font-bold text-chocolate-dark mb-4">Terms of Service</h1>
                        <p className="text-muted-foreground">Effective Date: {effectiveDate}</p>
                    </div>

                    <div className="bg-white rounded-3xl p-8 md:p-12 border border-border shadow-xl shadow-chocolate/5 space-y-12">
                        <section>
                            <p className="text-lg leading-relaxed text-muted-foreground">
                                By accessing or using <strong>ClientPulse</strong>, you agree to be bound by these Terms of Service. Please read them carefully before using our platform.
                            </p>
                        </section>

                        <section className="space-y-6">
                            <div className="flex items-center gap-3 text-2xl font-display font-bold text-chocolate-dark">
                                <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-primary">
                                    <Activity size={20} />
                                </div>
                                <h2>1. Service Overview</h2>
                            </div>
                            <p className="text-muted-foreground ml-4 md:ml-12 leading-relaxed">
                                ClientPulse provides a digital platform for managing customers, services, visits, loyalty rewards, and reports for Kinyozi, Salon, and Spa businesses in Kenya.
                            </p>
                        </section>

                        <section className="space-y-6">
                            <div className="flex items-center gap-3 text-2xl font-display font-bold text-chocolate-dark">
                                <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-primary">
                                    <User size={20} />
                                </div>
                                <h2>2. User Accounts</h2>
                            </div>
                            <ul className="grid md:grid-cols-2 gap-4 ml-4 md:ml-12">
                                {[
                                    "Users must provide accurate information",
                                    "Login credentials must be kept confidential",
                                    "Users are responsible for all activities under their accounts",
                                    "Unauthorized access must be reported immediately"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 p-4 bg-cream/30 rounded-2xl border border-border text-sm text-chocolate-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section className="space-y-6">
                            <div className="flex items-center gap-3 text-2xl font-display font-bold text-chocolate-dark">
                                <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-primary">
                                    <ShieldAlert size={20} />
                                </div>
                                <h2>3. Acceptable Use</h2>
                            </div>
                            <p className="text-muted-foreground ml-4 md:ml-12">Users agree NOT to:</p>
                            <div className="grid md:grid-cols-2 gap-4 ml-4 md:ml-12">
                                {[
                                    "Use the system for illegal activities",
                                    "Upload unauthorized or false customer data",
                                    "Attempt to breach system security",
                                    "Abuse messaging or notification features"
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 text-muted-foreground">
                                        <XCircle size={16} className="text-destructive shrink-0" />
                                        <span className="text-sm">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="space-y-6">
                            <div className="flex items-center gap-3 text-2xl font-display font-bold text-chocolate-dark">
                                <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-primary">
                                    <Database size={20} />
                                </div>
                                <h2>4. Customer Data Responsibility</h2>
                            </div>
                            <div className="ml-4 md:ml-12 p-6 bg-secondary/20 rounded-2xl border border-secondary space-y-4">
                                <p className="text-sm text-chocolate-dark font-medium">Businesses are solely responsible for:</p>
                                <ul className="space-y-2">
                                    {["Customer consent", "Accuracy of customer information", "Compliance with Kenya’s Data Protection Act"].map((item, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <div className="w-1 h-1 rounded-full bg-primary" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                                <p className="text-xs italic text-chocolate-medium pt-2 border-t border-secondary">
                                    ClientPulse acts as a data processor, while businesses act as data controllers under DPA 2019.
                                </p>
                            </div>
                        </section>

                        <section className="space-y-6">
                            <div className="flex items-center gap-3 text-2xl font-display font-bold text-chocolate-dark">
                                <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-primary">
                                    <AlertTriangle size={20} />
                                </div>
                                <h2>6. Limitation of Liability</h2>
                            </div>
                            <p className="text-muted-foreground ml-4 md:ml-12">ClientPulse shall not be liable for:</p>
                            <ul className="list-disc list-inside text-muted-foreground ml-4 md:ml-12 space-y-2">
                                <li>Business losses or missed revenue</li>
                                <li>Incorrect data entry by users</li>
                                <li>Failures of third-party services (SMS, email, internet providers)</li>
                            </ul>
                        </section>

                        <section className="space-y-6">
                            <div className="flex items-center gap-3 text-2xl font-display font-bold text-chocolate-dark">
                                <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-primary">
                                    <RefreshCw size={20} />
                                </div>
                                <h2>8. Amendments</h2>
                            </div>
                            <p className="text-muted-foreground ml-4 md:ml-12 leading-relaxed">
                                ClientPulse may update these terms at any time. Continued use of the platform implies acceptance of the updated terms.
                            </p>
                        </section>

                        <section className="p-8 bg-accent rounded-3xl text-accent-foreground">
                            <div className="flex items-center gap-3 text-2xl font-display font-bold mb-4">
                                <Gavel />
                                <h2>9. Governing Law</h2>
                            </div>
                            <p className="text-lg font-medium">
                                These Terms shall be governed and interpreted in accordance with the laws of Kenya.
                            </p>
                        </section>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-12 border-t border-border bg-cream/30">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} ClientPulse. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default TermsOfService;
