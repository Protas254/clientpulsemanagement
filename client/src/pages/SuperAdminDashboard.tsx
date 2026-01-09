import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Building2, Search, Users, Calendar, MessageSquare, Settings, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

interface Tenant {
  id: string;
  name: string;
  business_type: string;
  city: string;
  phone_number: string;
  is_active: boolean;
  created_at: string;
}

interface TenantStats {
  total_customers: number;
  total_bookings: number;
  total_services: number;
  total_staff: number;
  pending_messages: number;
}

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, TenantStats>>({});

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/tenants/', {
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTenants(data);

        // Fetch stats for each tenant
        data.forEach((tenant: Tenant) => {
          fetchTenantStats(tenant.id);
        });
      } else {
        toast.error('Failed to load tenants');
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
      toast.error('Error loading tenants');
    } finally {
      setLoading(false);
    }
  };

  const fetchTenantStats = async (tenantId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/tenants/${tenantId}/stats/`, {
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(prev => ({ ...prev, [tenantId]: data }));
      }
    } catch (error) {
      console.error(`Error fetching stats for tenant ${tenantId}:`, error);
    }
  };

  const handleApproveTenant = async (e: React.MouseEvent, tenantId: string) => {
    e.stopPropagation();
    try {
      const response = await fetch(`http://localhost:8000/api/tenants/${tenantId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: true, status: 'active' }),
      });

      if (response.ok) {
        toast.success('Tenant approved successfully');
        fetchTenants(); // Refresh the list
      } else {
        toast.error('Failed to approve tenant');
      }
    } catch (error) {
      console.error('Error approving tenant:', error);
      toast.error('Error approving tenant');
    }
  };

  const handleTenantClick = (tenantId: string) => {
    navigate(`/super-admin/tenant/${tenantId}`);
  };

  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.business_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  //   if (loading) {
  //     return (
  //       <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
  //       </div>
  //     );
  //   }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      {/* Header */}
      <div className="bg-white border-b border-amber-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-3 rounded-xl shadow-lg">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Platform Admin
                </h1>
                <p className="text-gray-600 mt-1">Super Admin Dashboard (Global)</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={() => navigate('/super-admin/plans')}
                variant="outline"
                className="border-amber-300 hover:bg-amber-50"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Subscription Plans
              </Button>
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
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border-amber-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Tenants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{tenants.length}</div>
              <p className="text-xs text-gray-500 mt-1">
                {tenants.filter(t => t.is_active).length} active
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-amber-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Active Businesses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {tenants.filter(t => t.is_active).length}
              </div>
              <p className="text-xs text-gray-500 mt-1">Currently operational</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-amber-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Approval</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {tenants.filter(t => !t.is_active).length}
              </div>
              <p className="text-xs text-gray-500 mt-1">Awaiting activation</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-amber-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {Object.values(stats).reduce((acc, s) => acc + (s.pending_messages || 0), 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Contact messages</p>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <Card className="mb-6 bg-white border-amber-200 shadow-lg">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search tenants by name, city, or business type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-amber-200 focus:border-amber-400 focus:ring-amber-400"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tenants List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">
              Sees ALL tenants across <span className="text-amber-600">ClientPulse</span>
            </h2>
          </div>

          {filteredTenants.length === 0 ? (
            <Card className="bg-white border-amber-200 shadow-lg">
              <CardContent className="py-12 text-center">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No tenants found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredTenants.map((tenant) => (
                <Card
                  key={tenant.id}
                  className="bg-white border-amber-200 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:border-amber-400"
                  onClick={() => handleTenantClick(tenant.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="bg-gradient-to-br from-amber-100 to-orange-100 p-3 rounded-lg">
                          <Building2 className="h-6 w-6 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-800">{tenant.name}</h3>
                            <Badge
                              variant={tenant.is_active ? "default" : "secondary"}
                              className={tenant.is_active ? "bg-green-500" : "bg-gray-400"}
                            >
                              {tenant.is_active ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="outline" className="border-amber-300 text-amber-700">
                              {tenant.business_type}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Users className="h-4 w-4 text-amber-600" />
                              <span>{stats[tenant.id]?.total_customers || 0} Customers</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4 text-amber-600" />
                              <span>{stats[tenant.id]?.total_bookings || 0} Bookings</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <BarChart3 className="h-4 w-4 text-amber-600" />
                              <span>{stats[tenant.id]?.total_services || 0} Services</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <MessageSquare className="h-4 w-4 text-amber-600" />
                              <span>{stats[tenant.id]?.pending_messages || 0} Messages</span>
                            </div>
                          </div>
                          <div className="mt-3 text-sm text-gray-500">
                            📍 {tenant.city} • 📞 {tenant.phone_number} • 📅 Joined {new Date(tenant.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2">
                        {!tenant.is_active && (
                          <Button
                            onClick={(e) => handleApproveTenant(e, tenant.id)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Approve
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          className="border-amber-300 hover:bg-amber-50 text-amber-700"
                        >
                          Manage →
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
