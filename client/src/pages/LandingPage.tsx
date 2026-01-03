import React from 'react';
import { Link } from 'react-router-dom';
import {
    Scissors,
    Calendar,
    Award,
    Users,
    TrendingUp,
    Smartphone,
    ChevronRight,
    Star,
    CheckCircle2,
    ArrowRight,
    Zap,
    ShieldCheck,
    Mail
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { fetchReviews, Review } from '@/services/api';
import { useState, useEffect } from 'react';

const LandingPage = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loadingReviews, setLoadingReviews] = useState(true);

    useEffect(() => {
        loadPublicReviews();
    }, []);

    const loadPublicReviews = async () => {
        try {
            const data = await fetchReviews();
            setReviews(data.slice(0, 6)); // Show top 6
        } catch (error) {
            console.error('Failed to load reviews', error);
        } finally {
            setLoadingReviews(false);
        }
    };
    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link to="/" className="flex items-center gap-2">
                            <img src="/logo.png" alt="ClientPulse Logo" className="w-10 h-10 object-contain" />
                            <span className="text-xl font-display font-bold tracking-tight text-chocolate-dark">ClientPulse</span>
                        </Link>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</a>
                        <a href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">How it Works</a>
                        <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">Pricing</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link to="/login">
                            <Button variant="ghost" className="text-sm font-medium">Log in</Button>
                        </Link>
                        <Link to="/signup">
                            <Button className="bg-primary hover:bg-chocolate-medium text-primary-foreground shadow-chocolate">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="/hero-bg.jpg"
                        alt="Luxury Salon Background"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-chocolate-dark/90 via-chocolate-dark/70 to-transparent md:bg-gradient-to-r md:from-chocolate-dark/95 md:via-chocolate-dark/60 md:to-transparent"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-bold mb-6 animate-fade-in backdrop-blur-sm border border-accent/30">
                            <Zap size={14} />
                            <span>THE #1 LOYALTY PLATFORM FOR BUSINESSES</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight mb-6 text-white">
                            Elevate Your Business's <br />
                            <span className="text-accent">Client Experience</span>
                        </h1>
                        <p className="text-lg md:text-xl text-cream/80 mb-8 max-w-2xl leading-relaxed">
                            The all-in-one management and loyalty platform designed for modern beauty businesses.
                            Retain more clients, automate bookings, and grow your revenue effortlessly.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <Link to="/signup">
                                <Button size="lg" className="h-14 px-8 text-lg bg-accent hover:bg-caramel text-accent-foreground shadow-xl shadow-accent/20 border-none">
                                    Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
                                </Button>
                            </Link>
                            <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-2 border-white/30 text-black bg-white/90 hover:bg-white backdrop-blur-sm">
                                Watch Demo
                            </Button>
                        </div>
                        <div className="mt-12 flex items-center gap-4 text-sm text-cream/60">
                            <div className="flex -space-x-2">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-chocolate-dark bg-muted flex items-center justify-center overflow-hidden">
                                        <img src={`https://i.pravatar.cc/100?img=${i + 20}`} alt="User" />
                                    </div>
                                ))}
                            </div>
                            <p>Joined by <span className="font-bold text-white">20+</span> salon owners this month</p>
                        </div>
                    </div>
                </div>

                {/* Floating Stats Card - Positioned for desktop */}
                <div className="hidden lg:block absolute bottom-20 right-20 bg-white/10 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-white/20 animate-bounce-slow">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center shadow-lg">
                            <TrendingUp className="text-accent-foreground w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs text-cream/60 font-medium uppercase tracking-wider">Revenue Growth</p>
                            <p className="text-2xl font-bold text-white">+32%</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-cream/50">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-5xl font-display font-bold mb-6 text-chocolate-dark">
                            Everything you need to run a <span className="text-accent">successful business</span>
                        </h2>
                        <p className="text-lg text-muted-foreground">
                            Our comprehensive suite of tools helps you manage every aspect of your business from a single, intuitive dashboard.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Award className="w-8 h-8 text-accent" />,
                                title: "Loyalty Programs",
                                description: "Automated visit-based rewards that keep your clients coming back for more."
                            },
                            {
                                icon: <Calendar className="w-8 h-8 text-accent" />,
                                title: "Smart Bookings",
                                description: "Easy online scheduling for your clients and a powerful calendar for your team."
                            },
                            {
                                icon: <Smartphone className="w-8 h-8 text-accent" />,
                                title: "Digital Receipts",
                                description: "Go paperless with beautiful digital receipts sent directly to your clients' phones."
                            },
                            {
                                icon: <Users className="w-8 h-8 text-accent" />,
                                title: "Client Management",
                                description: "Detailed client profiles with service history, preferences, and automated notes."
                            },
                            {
                                icon: <TrendingUp className="w-8 h-8 text-accent" />,
                                title: "Business Analytics",
                                description: "Deep insights into your revenue, staff performance, and client retention rates."
                            },
                            {
                                icon: <ShieldCheck className="w-8 h-8 text-accent" />,
                                title: "Secure Payments",
                                description: "Integrated payment processing including M-Pesa STK push for seamless transactions."
                            }
                        ].map((feature, index) => (
                            <div key={index} className="bg-white p-8 rounded-2xl border border-border hover:border-accent/50 hover:shadow-xl transition-all group">
                                <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-chocolate-dark">{feature.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it Works */}
            <section id="how-it-works" className="py-24 overflow-hidden">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row items-center gap-16">
                        <div className="flex-1 order-2 md:order-1">
                            <div className="space-y-12">
                                {[
                                    {
                                        step: "01",
                                        title: "Set Up Your Shop",
                                        description: "Add your services, staff members, and business hours in minutes."
                                    },
                                    {
                                        step: "02",
                                        title: "Onboard Your Clients",
                                        description: "Import your existing client list or start fresh with our easy signup flow."
                                    },
                                    {
                                        step: "03",
                                        title: "Watch Your Business Grow",
                                        description: "Automate rewards and reminders to boost retention and revenue."
                                    }
                                ].map((item, index) => (
                                    <div key={index} className="flex gap-6">
                                        <div className="text-4xl font-display font-bold text-accent/30">{item.step}</div>
                                        <div>
                                            <h3 className="text-2xl font-bold mb-2 text-chocolate-dark">{item.title}</h3>
                                            <p className="text-muted-foreground text-lg">{item.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 order-1 md:order-2">
                            <div className="relative">
                                <div className="bg-primary rounded-3xl p-8 md:p-12 text-primary-foreground">
                                    <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">Ready to transform your salon?</h2>
                                    <p className="text-lg opacity-90 mb-8">
                                        Join hundreds of successful business owners who have scaled their business with ClientPulse.
                                    </p>
                                    <ul className="space-y-4 mb-8">
                                        <li className="flex items-center gap-3">
                                            <CheckCircle2 className="text-accent" />
                                            <span>No credit card required for trial</span>
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <CheckCircle2 className="text-accent" />
                                            <span>Cancel anytime</span>
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <CheckCircle2 className="text-accent" />
                                            <span>24/7 Priority Support</span>
                                        </li>
                                    </ul>
                                    <Link to="/signup">
                                        <Button size="lg" className="w-full bg-accent hover:bg-caramel text-accent-foreground font-bold">
                                            Get Started Now
                                        </Button>
                                    </Link>
                                </div>
                                {/* Decorative circle */}
                                <div className="absolute -top-6 -right-6 w-24 h-24 bg-accent rounded-full -z-10"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-5xl font-display font-bold mb-6 text-chocolate-dark">
                            Simple, <span className="text-accent">transparent</span> pricing
                        </h2>
                        <p className="text-lg text-muted-foreground">
                            Choose the plan that's right for your business. All plans include a 14-day free trial.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {[
                            {
                                name: "Starter",
                                price: "2,500",
                                description: "Perfect for solo stylists and small barbershops.",
                                features: ["Up to 30 clients", "Basic loyalty program", "Digital receipts", "Email support"],
                                buttonText: "Start Starter Trial",
                                popular: false
                            },
                            {
                                name: "Professional",
                                price: "5,000",
                                description: "Ideal for growing salons with multiple staff members.",
                                features: ["Multi-service packages", "100 clients", "24/7 WhatsApp Support", "Advanced loyalty rules", "Staff management", "M-Pesa integration", "Priority support"],
                                buttonText: "Start Pro Trial",
                                popular: true
                            },
                            {
                                name: "Enterprise",
                                price: "12,000",
                                description: "For large spas and multi-location beauty businesses.",
                                features: ["Multi-service packages", " Unlimited clients", "24/7 WhatsApp Support", "Multiple locations", "Custom branding", "API access", "Dedicated account manager", "24/7 Phone support"],
                                buttonText: "Contact Sales",
                                popular: false
                            }
                        ].map((plan, index) => (
                            <div key={index} className={`relative p-8 rounded-3xl border ${plan.popular ? 'border-accent shadow-2xl shadow-accent/10 scale-105 z-10 bg-cream/30' : 'border-border bg-white'} flex flex-col`}>
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full">
                                        MOST POPULAR
                                    </div>
                                )}
                                <h3 className="text-xl font-bold mb-2 text-chocolate-dark">{plan.name}</h3>
                                <div className="mb-4">
                                    <span className="text-4xl font-bold text-chocolate-dark">KES {plan.price}</span>
                                    <span className="text-muted-foreground">/month</span>
                                </div>
                                <p className="text-muted-foreground mb-8 text-sm">{plan.description}</p>
                                <ul className="space-y-4 mb-8 flex-1">
                                    {plan.features.map((feature, fIndex) => (
                                        <li key={fIndex} className="flex items-center gap-3 text-sm">
                                            <CheckCircle2 className="text-accent w-4 h-4 shrink-0" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Link to="/signup">
                                    <Button className={`w-full h-12 ${plan.popular ? 'bg-accent hover:bg-caramel text-accent-foreground' : 'bg-primary hover:bg-chocolate-medium text-primary-foreground'}`}>
                                        {plan.buttonText}
                                    </Button>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials & Reviews */}
            <section className="py-24 bg-chocolate-dark text-white">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">
                            What <span className="text-accent">Customers</span> Are Saying
                        </h2>
                        <p className="text-lg text-accent/80">
                            Real feedback from clients who have experienced the ClientPulse difference.
                        </p>
                    </div>

                    {reviews.length > 0 ? (
                        <div className="space-y-16">
                            {/* Featured Review */}
                            <div className="text-center animate-fade-in">
                                <div className="inline-flex items-center gap-1 mb-6">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <Star
                                            key={i}
                                            className={`w-6 h-6 ${i <= reviews[0].rating ? 'fill-accent text-accent' : 'text-gray-600'}`}
                                        />
                                    ))}
                                </div>
                                <h2 className="text-2xl md:text-4xl font-display font-bold mb-12 max-w-4xl mx-auto leading-tight italic">
                                    "{reviews[0].comment || 'The service was absolutely incredible. Highly recommended!'}"
                                </h2>
                                <div className="flex flex-col items-center">
                                    <div className="w-20 h-20 rounded-full border-4 border-accent bg-accent/10 flex items-center justify-center text-accent text-3xl font-bold mb-4">
                                        {reviews[0].customer_name.charAt(0)}
                                    </div>
                                    <p className="text-xl font-bold">{reviews[0].customer_name}</p>
                                    <p className="text-accent font-medium">Verified Customer</p>
                                </div>
                            </div>

                            {/* Other Reviews Grid (if more than 1) */}
                            {reviews.length > 1 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-16 border-t border-white/10">
                                    {reviews.slice(1).map((review) => (
                                        <div key={review.id} className="bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
                                            <div className="flex items-center gap-1 mb-4">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star
                                                        key={star}
                                                        className={`w-4 h-4 ${star <= review.rating ? 'fill-accent text-accent' : 'text-gray-600'}`}
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-white font-medium mb-6 italic">
                                                "{review.comment || 'Excellent service!'}"
                                            </p>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                                                    {review.customer_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white">{review.customer_name}</p>
                                                    <p className="text-xs text-accent/70">
                                                        {new Date(review.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center animate-fade-in">
                            <div className="inline-flex items-center gap-1 mb-6">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <Star key={i} className="w-6 h-6 fill-accent text-accent" />
                                ))}
                            </div>
                            <h2 className="text-3xl md:text-5xl font-display font-bold mb-12 max-w-4xl mx-auto leading-tight">
                                "ClientPulse has doubled my repeat <br className="hidden md:block" /> customers in just 3 months."
                            </h2>
                            <div className="flex flex-col items-center">
                                <div className="w-20 h-20 rounded-full border-4 border-accent overflow-hidden mb-4 shadow-xl">
                                    <img src="https://i.pravatar.cc/150?img=32" alt="Testimonial" className="w-full h-full object-cover" />
                                </div>
                                <p className="text-xl font-bold">Sarah Johnson</p>
                                <p className="text-accent font-medium">Owner, Glow Beauty Spa</p>
                            </div>
                        </div>
                    )}
                </div>
            </section>
            {/* Contact Section */}
            <section id="contact" className="py-24 bg-cream/30">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto bg-white rounded-[2rem] overflow-hidden shadow-2xl shadow-chocolate/5 border border-border">
                        <div className="flex flex-col md:flex-row">
                            {/* Contact Info */}
                            <div className="md:w-2/5 bg-chocolate-dark p-8 md:p-12 text-white flex flex-col justify-between">
                                <div>
                                    <h2 className="text-3xl font-display font-bold mb-6">Get in Touch</h2>
                                    <p className="text-cream/70 mb-12">
                                        Have questions about how ClientPulse can help your business?
                                        Our team is here to help you scale.
                                    </p>

                                    <div className="space-y-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-accent">
                                                <Mail size={24} />
                                            </div>
                                            <div>
                                                <p className="text-xs text-cream/50 uppercase tracking-wider font-bold">Email Us</p>
                                                <p className="font-medium">marketing@clientpulse.co.ke</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-accent">
                                                <Smartphone size={24} />
                                            </div>
                                            <div>
                                                <p className="text-xs text-cream/50 uppercase tracking-wider font-bold">Call Us</p>
                                                <p className="font-medium">+254 743 849 304</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12 pt-12 border-t border-white/10">
                                    <p className="text-sm text-cream/50">Follow our journey</p>
                                    <div className="flex gap-4 mt-4">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-all cursor-pointer">
                                                <div className="w-5 h-5 bg-current rounded-sm opacity-20" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Contact Form */}
                            <div className="md:w-3/5 p-8 md:p-12">
                                <form
                                    className="space-y-6"
                                    onSubmit={async (e) => {
                                        e.preventDefault();
                                        const formData = new FormData(e.currentTarget);
                                        const data = {
                                            full_name: formData.get('full_name') as string,
                                            phone: formData.get('phone') as string,
                                            email: formData.get('email') as string,
                                            subject: formData.get('subject') as string,
                                            message: formData.get('message') as string,
                                        };

                                        try {
                                            const { sendContactMessage } = await import('@/services/api');
                                            await sendContactMessage(data);
                                            alert('Message sent successfully! We will get back to you soon.');
                                            (e.target as HTMLFormElement).reset();
                                        } catch (error) {
                                            alert('Failed to send message. Please try again.');
                                        }
                                    }}
                                >
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-chocolate-dark ml-1">Full Name</label>
                                            <input
                                                name="full_name"
                                                required
                                                placeholder="John Doe"
                                                className="w-full h-12 px-4 rounded-xl border border-border bg-cream/10 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-chocolate-dark ml-1">Telephone Number</label>
                                            <input
                                                name="phone"
                                                required
                                                placeholder="+254 7..."
                                                className="w-full h-12 px-4 rounded-xl border border-border bg-cream/10 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-chocolate-dark ml-1">Email Address</label>
                                        <input
                                            name="email"
                                            type="email"
                                            required
                                            placeholder="john@example.com"
                                            className="w-full h-12 px-4 rounded-xl border border-border bg-cream/10 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-chocolate-dark ml-1">Subject</label>
                                        <input
                                            name="subject"
                                            required
                                            placeholder="How can we help?"
                                            className="w-full h-12 px-4 rounded-xl border border-border bg-cream/10 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-chocolate-dark ml-1">Message</label>
                                        <textarea
                                            name="message"
                                            required
                                            rows={4}
                                            placeholder="Type your message here..."
                                            className="w-full p-4 rounded-xl border border-border bg-cream/10 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none"
                                        />
                                    </div>

                                    <Button type="submit" className="w-full h-14 text-lg bg-accent hover:bg-caramel text-accent-foreground shadow-lg shadow-accent/20">
                                        Send Message
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-border">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex items-center gap-2">
                            <img src="/logo.png" alt="ClientPulse Logo" className="w-8 h-8 object-contain" />
                            <span className="text-lg font-display font-bold tracking-tight text-chocolate-dark">ClientPulse</span>
                        </div>
                        <div className="flex gap-8 text-sm font-medium text-muted-foreground">
                            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
                            <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
                            <a href="#contact" className="hover:text-primary transition-colors">Contact Us</a>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            © {new Date().getFullYear()} ClientPulse. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
