# 🎯 Quick Reference: Super Admin Dashboard

## 🚀 Getting Started

### Access the Dashboard
1. Login as a super admin user
2. Navigate to: `http://localhost:5173/super-admin`
3. You'll see all tenants across ClientPulse

### Main Features

#### 1️⃣ View All Tenants
- **Location:** `/super-admin`
- **What you see:**
  - List of all businesses using ClientPulse
  - Quick stats for each tenant
  - Search bar to filter tenants
  - Active/Inactive status badges

#### 2️⃣ Manage Specific Tenant
- **Location:** `/super-admin/tenant/:id`
- **How to access:** Click on any tenant card
- **What you see:**
  - **Overview Tab:** Quick statistics
  - **Bookings Tab:** All appointments
  - **Customers Tab:** Customer list with points
  - **Services Tab:** All services offered
  - **Contact Messages Tab:** Customer inquiries ⭐ NEW!

#### 3️⃣ Contact Messages
- **Location:** Tenant Management → Contact Messages tab
- **Features:**
  - View all customer messages
  - See full contact details
  - Filter by tenant
  - Respond via email/phone

## 📊 Statistics Available

For each tenant, you can see:
- 👥 **Total Customers** - Number of registered customers
- 📅 **Total Bookings** - All appointments (pending, confirmed, completed)
- ✂️ **Total Services** - Services offered
- 👨‍💼 **Total Staff** - Staff members
- 💬 **Contact Messages** - Customer inquiries

## 🔐 Access Levels

### Super Admin (You)
- ✅ See ALL tenants
- ✅ Access all tenant data
- ✅ View all contact messages
- ✅ Manage system settings

### Tenant Admin
- ❌ See only their tenant
- ❌ Access only their data
- ❌ View only their messages

## 🎨 UI Features

- **Search:** Type to filter tenants by name, city, or type
- **Badges:** Visual status indicators (Active/Inactive)
- **Stats Cards:** Real-time data from database
- **Tabs:** Organized data presentation
- **Responsive:** Works on all devices

## 📱 API Endpoints

### Tenants
```
GET    /api/tenants/              # List all tenants
GET    /api/tenants/:id/          # Get tenant details
GET    /api/tenants/:id/stats/    # Get statistics
PATCH  /api/tenants/:id/          # Update tenant
DELETE /api/tenants/:id/          # Delete tenant
```

### Contact Messages
```
GET    /api/contact-messages/           # List all messages
GET    /api/contact-messages/?tenant=:id # Filter by tenant
POST   /api/contact-messages/           # Create message
GET    /api/contact-messages/:id/       # Get message details
DELETE /api/contact-messages/:id/       # Delete message
```

### Customers (filtered by tenant)
```
GET    /api/customers/?tenant=:id       # Get tenant's customers
```

### Bookings (filtered by tenant)
```
GET    /api/bookings/?tenant=:id        # Get tenant's bookings
```

### Services (filtered by tenant)
```
GET    /api/services/?tenant=:id        # Get tenant's services
```

## 🎯 Common Tasks

### Task 1: Find a specific tenant
1. Go to `/super-admin`
2. Use the search bar
3. Type tenant name, city, or business type
4. Click on the tenant card

### Task 2: View customer messages
1. Click on a tenant card
2. Navigate to "Contact Messages" tab
3. View all messages with details
4. Contact customer via email/phone

### Task 3: Check tenant statistics
1. Click on a tenant card
2. Go to "Overview" tab
3. See all stats at a glance

### Task 4: Manage bookings
1. Click on a tenant card
2. Go to "Bookings" tab
3. View all appointments with status

### Task 5: View customer list
1. Click on a tenant card
2. Go to "Customers" tab
3. See all customers with visit counts and points

## 🔧 Troubleshooting

### Can't see any tenants?
- Make sure you're logged in as a super admin
- Check if there are any tenants in the database
- Verify the backend is running

### Contact messages not showing?
- Check if the tenant has any messages
- Verify the backend endpoint is working
- Look for console errors in browser

### Stats not loading?
- Ensure backend is running
- Check network tab for API errors
- Verify authentication token is valid

## 💡 Tips

1. **Use Search:** Quickly find tenants instead of scrolling
2. **Check Messages Regularly:** Stay on top of customer inquiries
3. **Monitor Stats:** Keep track of tenant growth
4. **Filter Data:** Use query parameters to filter data

## 🎉 You're All Set!

Your super admin dashboard is ready to use. Navigate to `/super-admin` and start managing your tenants!

---

**Need Help?** Check the `SUPER_ADMIN_README.md` for detailed documentation.
