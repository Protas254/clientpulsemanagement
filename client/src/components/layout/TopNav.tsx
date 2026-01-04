import { ReactNode } from 'react';
import { Bell, Search, User, Check, Clock, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead, Notification } from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { updateAdminProfile } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface TopNavProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  logo?: string;
}

export function TopNav({ title, subtitle, action, logo }: TopNavProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const { user, customerData, logout } = useAuthStore();
  const [editFirstName, setEditFirstName] = useState(user.first_name || '');
  const [editLastName, setEditLastName] = useState(user.last_name || '');
  const [editEmail, setEditEmail] = useState(user.email || '');
  const [editPhoto, setEditPhoto] = useState<File | null>(null);

  // Update local state when URL changes
  useEffect(() => {
    setSearchValue(searchParams.get('search') || '');
  }, [searchParams]);

  useEffect(() => {
    loadNotifications();
    // Poll for new notifications every minute
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      // Check if we are in customer portal or admin dashboard
      const customerId = customerData ? customerData.customer.id : undefined;

      const data = await fetchNotifications(customerId);
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const customerId = customerData ? customerData.customer.id : undefined;
      await markAllNotificationsAsRead(customerId);
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleSearch = (value: string) => {
    setSearchValue(value);
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set('search', value);
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const formData = new FormData();
      formData.append('first_name', editFirstName);
      formData.append('last_name', editLastName);
      formData.append('email', editEmail);
      if (editPhoto) {
        formData.append('photo', editPhoto);
      }

      const updatedUser = await updateAdminProfile(formData);

      // Update store
      useAuthStore.getState().setAuth(useAuthStore.getState().token!, { ...user!, ...updatedUser });

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      setIsEditModalOpen(false);
      setEditPhoto(null);

      // Refresh page to show changes
      window.location.reload();
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Could not update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {logo && (
          <div className="w-10 h-10 flex items-center justify-center overflow-hidden rounded bg-white p-1 border">
            <img
              src={logo.startsWith('http') ? logo : `http://localhost:8000${logo}`}
              alt="Logo"
              className="w-full h-full object-contain"
            />
          </div>
        )}
        <div>
          <h1 className="font-display text-xl font-semibold text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {action && <div className="ml-4">{action}</div>}
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="w-64 pl-10 bg-background"
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-caramel text-white text-[10px] flex items-center justify-center rounded-full border-2 border-card">
                  {unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0">
            <DropdownMenuLabel className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="h-8 text-xs text-caramel hover:text-caramel/80" onClick={handleMarkAllAsRead}>
                  Mark all as read
                </Button>
              )}
            </DropdownMenuLabel>
            <div className="max-h-[400px] overflow-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer relative group",
                      !notification.is_read && "bg-caramel/5"
                    )}
                    onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={cn("text-sm font-medium", !notification.is_read && "text-caramel")}>
                        {notification.title}
                      </h4>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 pr-4">
                      {notification.message}
                    </p>
                    {!notification.is_read && (
                      <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Check className="w-4 h-4 text-caramel" />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full overflow-hidden border border-border">
              {user.photo ? (
                <img
                  src={user.photo}
                  alt={user.full_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full gradient-chocolate flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-semibold">{user.full_name || user.username || 'My Account'}</span>
                <span className="text-xs text-muted-foreground font-normal">Administrator</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
              <User className="w-4 h-4 mr-2" />
              Edit Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              logout();
              window.location.href = '/login';
            }} className="text-destructive focus:text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Admin Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateProfile} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  placeholder="First Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  placeholder="Last Name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="Email Address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="photo">Profile Photo</Label>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={(e) => setEditPhoto(e.target.files ? e.target.files[0] : null)}
                className="cursor-pointer"
              />
              <p className="text-[10px] text-muted-foreground">Recommended: Square image, max 2MB</p>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating} className="bg-chocolate-dark hover:bg-chocolate-medium text-white">
                {isUpdating ? 'Updating...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </header>
  );
}
