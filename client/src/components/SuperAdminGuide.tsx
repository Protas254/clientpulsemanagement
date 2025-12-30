import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Calendar, Users, Scissors, MessageSquare, Search, Settings } from 'lucide-react';

const SuperAdminGuide = () => {
    return (
        <div className="space-y-6">
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                <CardHeader>
                    <CardTitle className="text-2xl text-amber-800">Welcome to the Super Admin Dashboard</CardTitle>
                    <CardDescription className="text-amber-700">
                        Manage all tenants across ClientPulse from one central location
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start space-x-3 p-4 bg-white rounded-lg border border-amber-200">
                            <Building2 className="h-6 w-6 text-amber-600 mt-1" />
                            <div>
                                <h3 className="font-semibold text-gray-800">View All Tenants</h3>
                                <p className="text-sm text-gray-600">
                                    See every business using ClientPulse with real-time statistics
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3 p-4 bg-white rounded-lg border border-amber-200">
                            <Search className="h-6 w-6 text-amber-600 mt-1" />
                            <div>
                                <h3 className="font-semibold text-gray-800">Search & Filter</h3>
                                <p className="text-sm text-gray-600">
                                    Quickly find tenants by name, city, or business type
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3 p-4 bg-white rounded-lg border border-amber-200">
                            <MessageSquare className="h-6 w-6 text-amber-600 mt-1" />
                            <div>
                                <h3 className="font-semibold text-gray-800">Contact Messages</h3>
                                <p className="text-sm text-gray-600">
                                    View and manage customer inquiries for each tenant
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3 p-4 bg-white rounded-lg border border-amber-200">
                            <Settings className="h-6 w-6 text-amber-600 mt-1" />
                            <div>
                                <h3 className="font-semibold text-gray-800">Tenant Management</h3>
                                <p className="text-sm text-gray-600">
                                    Access detailed data for bookings, customers, and services
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-white rounded-lg border-2 border-amber-300">
                        <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                            <MessageSquare className="h-5 w-5 text-amber-600 mr-2" />
                            NEW: Contact Messages Feature
                        </h3>
                        <p className="text-sm text-gray-700 mb-3">
                            You can now view and manage contact messages from customers for each tenant.
                            This makes it easy to provide support and handle inquiries across all your tenants.
                        </p>
                        <div className="flex items-center space-x-2 text-sm text-amber-700">
                            <span className="font-semibold">How to access:</span>
                            <span>Click on any tenant → Navigate to "Contact Messages" tab</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default SuperAdminGuide;
