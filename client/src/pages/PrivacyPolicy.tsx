import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, FileText, Scale, UserCheck, Clock, Mail } from 'lucide-react';
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
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
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4">
                            <Shield size={14} />
                            <span>DATA PROTECTION</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-display font-bold text-chocolate-dark mb-4">Privacy Policy</h1>
                        <p className="text-muted-foreground">Effective Date: {effectiveDate}</p>
                    </div>

                    <div className="bg-white rounded-3xl p-8 md:p-12 border border-border shadow-xl shadow-chocolate/5 space-y-12">
                        <section>
                            <p className="text-lg leading-relaxed text-muted-foreground mb-6">
                                ClientPulse is committed to protecting personal data in compliance with the <strong>Kenya Data Protection Act, 2019</strong> and applicable regulations issued by the Office of the Data Protection Commissioner (ODPC). This Privacy Policy explains how personal data is collected, used, stored, and protected when using the ClientPulse platform.
                            </p>
                        </section>

                        <section className="space-y-6">
                            <div className="flex items-center gap-3 text-2xl font-display font-bold text-chocolate-dark">
                                <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-primary">
                                    <FileText size={20} />
                                </div>
                                <h2>1. Personal Data We Collect</h2>
                            </div>
                            <div className="grid md:grid-cols-2 gap-8 ml-4 md:ml-12">
                                <div className="space-y-3">
                                    <h3 className="font-bold text-chocolate-medium">a) Business & User Data</h3>
                                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                        <li>Business name and location</li>
                                        <li>Owner/attendant names</li>
                                        <li>Phone numbers and email addresses</li>
                                        <li>Login credentials (securely stored)</li>
                                    </ul>
                                </div>
                                <div className="space-y-3">
                                    <h3 className="font-bold text-chocolate-medium">b) Customer Data</h3>
                                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                        <li>Customer name</li>
                                        <li>Phone number</li>
                                        <li>Service history (haircuts, salon services, spa treatments)</li>
                                        <li>Visit frequency and loyalty rewards data</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="ml-4 md:ml-12 space-y-3">
                                <h3 className="font-bold text-chocolate-medium">c) Technical Data</h3>
                                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                    <li>IP address</li>
                                    <li>Device and browser information</li>
                                    <li>System usage logs</li>
                                </ul>
                            </div>
                        </section>

                        <section className="space-y-6">
                            <div className="flex items-center gap-3 text-2xl font-display font-bold text-chocolate-dark">
                                <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-primary">
                                    <Eye size={20} />
                                </div>
                                <h2>2. Purpose of Data Processing</h2>
                            </div>
                            <p className="text-muted-foreground ml-4 md:ml-12">Personal data is collected and processed to:</p>
                            <ul className="grid md:grid-cols-2 gap-4 ml-4 md:ml-12">
                                {[
                                    "Manage customer records and service history",
                                    "Track visits, appointments, and loyalty rewards",
                                    "Generate reports and analytics for business owners",
                                    "Send system notifications (SMS, email, WhatsApp)",
                                    "Improve system performance and security"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-muted-foreground">
                                        <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section className="space-y-6">
                            <div className="flex items-center gap-3 text-2xl font-display font-bold text-chocolate-dark">
                                <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-primary">
                                    <Scale size={20} />
                                </div>
                                <h2>3. Legal Basis for Processing</h2>
                            </div>
                            <p className="text-muted-foreground ml-4 md:ml-12">
                                In accordance with <strong>DPA 2019</strong>, ClientPulse processes personal data based on:
                            </p>
                            <ul className="list-disc list-inside text-muted-foreground ml-4 md:ml-12 space-y-2">
                                <li>Consent from users and customers</li>
                                <li>Legitimate business interests of service providers</li>
                                <li>Contractual necessity to deliver services</li>
                                <li>Legal obligations under Kenyan law</li>
                            </ul>
                        </section>

                        <section className="space-y-6">
                            <div className="flex items-center gap-3 text-2xl font-display font-bold text-chocolate-dark">
                                <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-primary">
                                    <Lock size={20} />
                                </div>
                                <h2>4. Data Security</h2>
                            </div>
                            <p className="text-muted-foreground ml-4 md:ml-12">
                                ClientPulse implements appropriate technical and organizational security measures including:
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 ml-4 md:ml-12">
                                {["Authentication controls", "Restricted system access", "Secure data storage", "Regular monitoring"].map((item, i) => (
                                    <div key={i} className="p-4 bg-cream/50 rounded-2xl text-center text-sm font-medium text-chocolate-medium border border-border">
                                        {item}
                                    </div>
                                ))}
                            </div>
                            <p className="text-sm italic text-muted-foreground ml-4 md:ml-12">
                                However, no system is 100% secure, and users are encouraged to safeguard their credentials.
                            </p>
                        </section>

                        <section className="space-y-6">
                            <div className="flex items-center gap-3 text-2xl font-display font-bold text-chocolate-dark">
                                <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-primary">
                                    <UserCheck size={20} />
                                </div>
                                <h2>6. Data Subject Rights</h2>
                            </div>
                            <p className="text-muted-foreground ml-4 md:ml-12">Under Kenya DPA 2019, users and customers have the right to:</p>
                            <div className="grid md:grid-cols-2 gap-4 ml-4 md:ml-12">
                                {["Access personal data", "Correct inaccurate data", "Withdraw consent", "Request deletion", "Object to processing"].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl border border-secondary">
                                        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-accent">
                                            <UserCheck size={14} />
                                        </div>
                                        <span className="text-sm font-medium text-chocolate-dark">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="space-y-6">
                            <div className="flex items-center gap-3 text-2xl font-display font-bold text-chocolate-dark">
                                <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-primary">
                                    <Clock size={20} />
                                </div>
                                <h2>7. Data Retention</h2>
                            </div>
                            <p className="text-muted-foreground ml-4 md:ml-12">
                                Personal data is retained only as long as necessary for business operations and legal compliance. Inactive accounts may have their data archived or deleted.
                            </p>
                        </section>

                        <section className="p-8 bg-chocolate-dark rounded-3xl text-white">
                            <div className="flex items-center gap-3 text-2xl font-display font-bold mb-6">
                                <Mail className="text-accent" />
                                <h2>9. Contact Information</h2>
                            </div>
                            <p className="mb-4 opacity-80">For privacy or data protection concerns, please reach out to us:</p>
                            <a href="mailto:privacy@clientpulse.co.ke" className="text-xl font-bold text-accent hover:underline">
                                privacy@clientpulse.co.ke
                            </a>
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

export default PrivacyPolicy;
