import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Building2, Settings, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface SubscriptionPlan {
    id: string;
    name: string;
    price: string;
    interval: string;
    description: string;
    features_list: string[];
    is_popular: boolean;
}

const SubscriptionPlans = () => {
    const navigate = useNavigate();
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/subscription-plans/', {
                headers: {
                    'Authorization': `Token ${localStorage.getItem('token')}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setPlans(data);
            } else {
                toast.error('Failed to load subscription plans');
            }
        } catch (error) {
            console.error('Error fetching plans:', error);
            toast.error('Error loading plans');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
            {/* Header */}
            <div className="bg-white border-b border-amber-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate('/super-admin')}
                                className="mr-2"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-3 rounded-xl shadow-lg">
                                <Building2 className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                                    Subscription Plans
                                </h1>
                                <p className="text-gray-600 mt-1">Manage pricing and features</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => navigate('/super-admin/settings')}
                            variant="outline"
                            className="border-amber-300 hover:bg-amber-50"
                        >
                            <Settings className="h-4 w-4 mr-2" />
                            System Settings
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan) => (
                        <Card
                            key={plan.id}
                            className={`relative bg-white border-amber-200 shadow-lg hover:shadow-xl transition-all flex flex-col ${plan.is_popular ? 'border-amber-500 ring-2 ring-amber-500 ring-opacity-50 scale-105 z-10' : ''
                                }`}
                        >
                            {plan.is_popular && (
                                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                    <Badge className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-1 text-sm font-medium rounded-full shadow-md">
                                        MOST POPULAR
                                    </Badge>
                                </div>
                            )}

                            <CardHeader className="pb-4">
                                <CardTitle className="text-2xl font-bold text-gray-800">{plan.name}</CardTitle>
                                <CardDescription className="text-gray-500 mt-2 h-10">
                                    {plan.description}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="flex-1">
                                <div className="mb-6">
                                    <span className="text-4xl font-bold text-gray-900">KES {parseFloat(plan.price).toLocaleString()}</span>
                                    <span className="text-gray-500 ml-2">/ {plan.interval}</span>
                                </div>

                                <div className="space-y-4">
                                    {plan.features_list.map((feature, index) => (
                                        <div key={index} className="flex items-start">
                                            <div className="flex-shrink-0">
                                                <Check className="h-5 w-5 text-green-500" />
                                            </div>
                                            <p className="ml-3 text-sm text-gray-600">{feature}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>

                            <CardFooter className="pt-6 pb-8">
                                <Button
                                    className={`w-full ${plan.is_popular
                                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                        : 'bg-white border-2 border-amber-600 text-amber-700 hover:bg-amber-50'
                                        }`}
                                >
                                    Edit Plan
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SubscriptionPlans;
