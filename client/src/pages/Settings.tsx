import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { fetchUserProfile } from '@/services/api';

export default function Settings() {
  const [user, setUser] = useState<any>(null);
  const [tenant, setTenant] = useState<any>({
    primary_color: '#D97706',
    auto_campaign_we_miss_you: false,
    we_miss_you_discount_pct: 10,
    we_miss_you_days: 30
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [userData, tenantData] = await Promise.all([
        fetchUserProfile(),
        import('@/services/api').then(m => m.fetchTenantSettings())
      ]);
      setUser(userData);
      // Merge with existing state to ensure defaults
      setTenant(prev => ({
        ...prev,
        ...tenantData,
        primary_color: tenantData.primary_color || prev.primary_color
      }));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load profile information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { updateTenantSettings } = await import('@/services/api');

      // We only save the tenant settings here as profile info is usually separate
      // but we can extend this if needed.
      await updateTenantSettings({
        name: tenant.name,
        email: tenant.email,
        phone_number: tenant.phone_number,
        city: tenant.city,
        primary_color: tenant.primary_color,
        auto_campaign_we_miss_you: tenant.auto_campaign_we_miss_you,
        we_miss_you_discount_pct: tenant.we_miss_you_discount_pct,
        we_miss_you_days: tenant.we_miss_you_days,
      });

      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !tenant) {
    return (
      <AppLayout title="Settings">
        <div className="max-w-3xl space-y-6 animate-pulse">
          <div className="h-64 bg-white/50 rounded-xl" />
          <div className="h-48 bg-white/50 rounded-xl" />
          <div className="h-48 bg-white/50 rounded-xl" />
        </div>
      </AppLayout>
    );
  }

  const isValidHex = (hex: string) => {
    return /^#[0-9A-Fa-f]{6}$/.test(hex);
  };

  return (
    <AppLayout title="Settings" subtitle="Manage your account and preferences">
      <div className="max-w-3xl space-y-6 pb-12">
        {/* Personal Profile Settings */}
        <Card className="animate-fade-in shadow-sm border-chocolate-light/20">
          <CardHeader>
            <CardTitle className="font-display text-chocolate-dark">Personal Information</CardTitle>
            <CardDescription>Update your personal account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  defaultValue={user?.first_name}
                  className="bg-white border-chocolate-light/20 focus:border-caramel focus:ring-caramel/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  defaultValue={user?.last_name}
                  className="bg-white border-chocolate-light/20 focus:border-caramel focus:ring-caramel/20"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Work Email</Label>
              <Input
                id="email"
                type="email"
                defaultValue={user?.email}
                className="bg-white border-chocolate-light/20 focus:border-caramel focus:ring-caramel/20"
              />
              <p className="text-[10px] text-muted-foreground italic">Your login email</p>
            </div>
          </CardContent>
        </Card>

        {/* Business Information */}
        <Card className="animate-fade-in shadow-sm border-chocolate-light/20" style={{ animationDelay: '0.05s' }}>
          <CardHeader>
            <CardTitle className="font-display text-chocolate-dark">Business Details</CardTitle>
            <CardDescription>Information about your salon or spa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company">Business Name</Label>
              <Input
                id="company"
                value={tenant?.name || user?.company_name || ''}
                onChange={(e) => setTenant({ ...tenant, name: e.target.value })}
                className="bg-white border-chocolate-light/20 focus:border-caramel focus:ring-caramel/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessEmail">Public Business Email</Label>
              <Input
                id="businessEmail"
                type="email"
                value={tenant?.email || ''}
                onChange={(e) => setTenant({ ...tenant, email: e.target.value })}
                placeholder="hello@yourbusiness.com"
                className="bg-white border-chocolate-light/20 focus:border-caramel focus:ring-caramel/20"
              />
              <p className="text-[10px] text-muted-foreground italic">Email shown to customers on receipts and reminders</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessPhone">Business Phone</Label>
                <Input
                  id="businessPhone"
                  value={tenant?.phone_number || ''}
                  onChange={(e) => setTenant({ ...tenant, phone_number: e.target.value })}
                  className="bg-white border-chocolate-light/20 focus:border-caramel focus:ring-caramel/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={tenant?.city || ''}
                  onChange={(e) => setTenant({ ...tenant, city: e.target.value })}
                  className="bg-white border-chocolate-light/20 focus:border-caramel focus:ring-caramel/20"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Branding Settings */}
        <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <CardHeader>
            <CardTitle className="font-display">Custom Branding</CardTitle>
            <CardDescription>Customize how your business appears to customers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Business Logo</Label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-muted rounded flex items-center justify-center overflow-hidden border">
                  {tenant?.logo ? (
                    <img
                      src={tenant.logo.startsWith('http') ? tenant.logo : `http://localhost:8000${tenant.logo}`}
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">No Logo</span>
                  )}
                </div>
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    className="cursor-pointer"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const formData = new FormData();
                        formData.append('logo', file);
                        try {
                          const { updateTenantSettings } = await import('@/services/api');
                          const updated = await updateTenantSettings(formData);
                          setTenant(updated);
                          toast({ title: "Logo updated" });
                        } catch (e) {
                          toast({ title: "Failed to upload logo", variant: "destructive" });
                        }
                      }
                    }}
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Recommended: Square PNG or SVG with transparent background</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Brand Color</Label>
              <div className="flex gap-4 items-center">
                <Input
                  id="primaryColor"
                  type="color"
                  className="w-20 h-10 p-1 cursor-pointer"
                  value={isValidHex(tenant.primary_color) ? tenant.primary_color : '#D97706'}
                  onChange={(e) => setTenant({ ...tenant, primary_color: e.target.value })}
                />
                <Input
                  type="text"
                  value={tenant.primary_color ?? '#D97706'}
                  onChange={(e) => setTenant({ ...tenant, primary_color: e.target.value })}
                  className="w-32 font-mono"
                />
                <div
                  className="w-10 h-10 rounded-lg shadow-inner border"
                  style={{ backgroundColor: isValidHex(tenant.primary_color) ? tenant.primary_color : '#D97706' }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">This color will be used for buttons and accents in your Customer Portal</p>
            </div>
          </CardContent>
        </Card>

        {/* Automated Campaigns */}
        <Card className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <CardHeader>
            <CardTitle className="font-display">Automated Campaigns</CardTitle>
            <CardDescription>Set up automated marketing to retain customers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">"We Miss You" Campaign</p>
                <p className="text-sm text-muted-foreground">Automatically send a discount to customers who haven't visited in a while</p>
              </div>
              <Switch
                checked={tenant.auto_campaign_we_miss_you ?? false}
                onCheckedChange={(checked) => setTenant({ ...tenant, auto_campaign_we_miss_you: checked })}
              />
            </div>
            {tenant.auto_campaign_we_miss_you && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pl-6 border-l-2 border-amber-100 animate-in slide-in-from-left-2">
                <div className="space-y-2">
                  <Label>Send after (days of inactivity)</Label>
                  <Input
                    type="number"
                    value={tenant.we_miss_you_days ?? 30}
                    onChange={(e) => setTenant({ ...tenant, we_miss_you_days: parseInt(e.target.value) || 30 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Discount Percentage (%)</Label>
                  <Input
                    type="number"
                    value={tenant.we_miss_you_discount_pct ?? 10}
                    onChange={(e) => setTenant({ ...tenant, we_miss_you_discount_pct: parseInt(e.target.value) || 10 })}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <CardHeader>
            <CardTitle className="font-display">Notifications</CardTitle>
            <CardDescription>Configure how you receive updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive daily summary emails</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Follow-up Reminders</p>
                <p className="text-sm text-muted-foreground">Get notified about pending follow-ups</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={loadData}>Reset</Button>
          <Button variant="chocolate" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
