# Django Admin Multi-Tenant Guide

## 🎯 Overview

Your Django admin at `http://localhost:8000/admin` is now configured for **multi-tenant management**. This means:

- **Super Admins** can see and manage ALL tenants and ALL data
- **Tenant Admins** can ONLY see and manage their own tenant's data
- All models are automatically filtered by tenant

## 📋 What You See in the Admin

When you access `http://localhost:8000/admin`, you'll see these sections:

### CLIENTAPP Section (Your Main Models)

All these models support multi-tenancy:

1. **Bookings** - Customer appointments
   - Add new bookings
   - Change existing bookings
   - Filtered by tenant automatically

2. **Contact messages** ⭐ **HIGHLIGHTED**
   - Customer inquiries and messages
   - Add new messages
   - Change/view existing messages
   - **Easy access for super admin to manage customer communications**

3. **Customer rewards** - Loyalty rewards claimed by customers
   - Add new reward claims
   - Change reward status

4. **Customers** - Your customer database
   - Add new customers
   - Edit customer information
   - View visit history and points

5. **Notifications** - System notifications
   - Add new notifications
   - Manage existing notifications

6. **Rewards** - Loyalty program rewards
   - Add new rewards
   - Edit reward details

7. **Sales** - Sales transactions (backward compatibility)
   - Add new sales
   - View sales history

8. **Services** - Services offered (haircuts, massages, etc.)
   - Add new services
   - Edit service pricing and details

9. **Staff members** - Barbers, stylists, therapists
   - Add new staff
   - Manage staff information

10. **Tenants** - Business accounts (Super Admin only)
    - Add new tenants
    - Activate/deactivate tenants
    - View tenant statistics

11. **User profiles** - User account profiles
    - Manage user roles
    - Assign users to tenants

12. **Visits** - Customer visit records
    - Add new visits
    - Track services provided

## 🔐 Multi-Tenancy How It Works

### For Super Admins (is_superuser=True)

When you login as a super admin:

1. **Tenants List**: You see ALL tenants
   - Click on any tenant to view/edit
   - See inline sections for each tenant:
     - Contact Messages (at the top for easy access)
     - Bookings
     - Visits
     - Staff Members
     - Services
     - Rewards
     - Sales
     - Notifications

2. **All Models**: You see ALL data across ALL tenants
   - Each model shows a "Tenant" column
   - You can filter by tenant using the right sidebar
   - You can search across all tenants

3. **Special Actions**:
   - ✅ Activate selected tenants
   - ❌ Deactivate selected tenants
   - 📊 View statistics for selected tenants

### For Tenant Admins (role='tenant_admin')

When a tenant admin logs in:

1. **Limited View**: They ONLY see their own tenant's data
   - Bookings for their business only
   - Customers for their business only
   - Services for their business only
   - etc.

2. **No Tenant Selection**: The tenant field is hidden
   - Data is automatically assigned to their tenant
   - They cannot see or modify other tenants' data

3. **Contact Messages**: They can only see messages for their business

## 📊 Tenant Management Features

### Viewing a Tenant

When you click on a tenant in the admin, you'll see:

1. **Business Information**
   - Name
   - Business Type (Kinyozi, Salon, Spa)
   - City
   - Phone Number

2. **Status**
   - Active/Inactive toggle
   - Created date

3. **Inline Sections** (in this order):
   - **Contact Messages** (TOP - for easy access)
   - Bookings
   - Visits
   - Staff Members
   - Services
   - Rewards
   - Sales
   - Notifications

### Contact Messages Section

The Contact Messages inline shows:
- Customer name
- Email
- Phone
- Subject
- Message preview
- Date submitted

You can:
- View all messages
- Add new messages
- Edit message details
- Delete messages

## 🎨 Admin Customizations

### Custom Headers
- **Site Header**: "ClientPulse Administration"
- **Site Title**: "ClientPulse Admin Portal"
- **Index Title**: "Welcome to ClientPulse Platform Admin"

### Tenant List Display
Shows these columns:
- Name
- Business Type
- City
- Phone Number
- Active Status (editable inline)
- Created Date
- 📧 Contact Messages Count

### Admin Actions
Select one or more tenants and choose:
- ✅ **Activate selected tenants** - Make tenants active
- ❌ **Deactivate selected tenants** - Deactivate tenants
- 📊 **View statistics** - See quick stats

### Contact Messages Display
Shows these columns:
- Full Name
- Tenant
- Email
- Phone
- Subject
- Created Date
- Message Preview (first 50 characters)

## 🚀 How to Use

### 1. Access the Admin
```
http://localhost:8000/admin
```

### 2. Login
- **Super Admin**: Use your superuser credentials
- **Tenant Admin**: Use your tenant admin credentials

### 3. Manage Tenants (Super Admin Only)

#### View All Tenants
1. Click on "Tenants" in the CLIENTAPP section
2. You'll see a list of all tenants
3. Use search to find specific tenants
4. Use filters on the right to filter by status or business type

#### View Tenant Details
1. Click on any tenant name
2. Scroll down to see inline sections
3. **Contact Messages** is at the top for easy access
4. View/edit bookings, customers, services, etc.

#### Activate/Deactivate Tenants
**Method 1**: Inline editing
- In the tenant list, toggle the "Active" checkbox
- Click "Save" at the bottom

**Method 2**: Bulk actions
- Select multiple tenants (checkboxes)
- Choose "Activate" or "Deactivate" from the action dropdown
- Click "Go"

### 4. Manage Contact Messages

#### View All Messages (Super Admin)
1. Click on "Contact messages" in CLIENTAPP section
2. See all messages across all tenants
3. Filter by tenant using the right sidebar
4. Search by name, email, or subject

#### View Messages for a Specific Tenant
1. Go to "Tenants"
2. Click on the tenant name
3. Scroll to "Contact Messages" section (at the top)
4. View all messages for that tenant

#### Add a New Message
1. Click "Add" next to "Contact messages"
2. Fill in the form:
   - Tenant (auto-filled for tenant admins)
   - Full Name
   - Email
   - Phone
   - Subject
   - Message
3. Click "Save"

### 5. Manage Other Models

All models work the same way:
- **Super Admin**: Sees all data, can filter by tenant
- **Tenant Admin**: Sees only their data, tenant auto-assigned

#### Example: Managing Bookings
1. Click "Bookings"
2. See all bookings (filtered by your tenant if you're a tenant admin)
3. Click "Add booking" to create new
4. Click on any booking to edit

#### Example: Managing Customers
1. Click "Customers"
2. See customer list with visit counts and points
3. Search by name, email, or phone
4. Click on a customer to see full details

## 🔍 Filtering and Searching

### Search
Every model has a search box at the top:
- **Tenants**: Search by name, city, phone
- **Contact Messages**: Search by name, email, subject, message
- **Customers**: Search by name, email, phone
- **Bookings**: Search by customer name, service name
- etc.

### Filters (Right Sidebar)
Most models have filters:
- **By Tenant** (super admin only)
- **By Date** (created date, booking date, etc.)
- **By Status** (active/inactive, booking status, etc.)
- **By Type** (business type, service category, etc.)

## 📱 Quick Reference

### Common Tasks

#### Task 1: View all contact messages for a tenant
1. Go to Tenants
2. Click on tenant name
3. See Contact Messages section at top

#### Task 2: Activate a new tenant
1. Go to Tenants
2. Find the tenant
3. Check the "Active" checkbox
4. Click Save

#### Task 3: Respond to a contact message
1. View the message in admin
2. Note the customer's email/phone
3. Contact them outside the system
4. (Future: Add reply feature)

#### Task 4: View tenant statistics
1. Go to Tenants
2. Select one or more tenants
3. Choose "View statistics" action
4. Click Go

## 🎯 Benefits of This Setup

1. **Multi-Tenancy**: Each tenant's data is isolated
2. **Easy Access**: Contact messages are prominently displayed
3. **Bulk Actions**: Manage multiple tenants at once
4. **Search & Filter**: Find data quickly
5. **Inline Editing**: Edit tenant data without leaving the page
6. **Role-Based Access**: Super admins see everything, tenant admins see only their data
7. **Professional Interface**: Clean, organized Django admin

## 🔧 Technical Details

### TenantAdminMixin
All tenant-aware models use this mixin:
```python
class TenantAdminMixin:
    def get_queryset(self, request):
        # Super admin sees all
        if request.user.is_superuser:
            return super().get_queryset(request)
        # Tenant admin sees only their data
        if hasattr(request.user, 'profile') and request.user.profile.tenant:
            return super().get_queryset(request).filter(
                tenant=request.user.profile.tenant
            )
        return super().get_queryset(request).none()
```

### Inline Ordering
Contact Messages are shown first in the tenant detail view:
```python
inlines = [
    ContactMessageInline,  # TOP - Easy access
    BookingInline,
    VisitInline,
    # ... others
]
```

## 🎉 You're All Set!

Your Django admin is fully configured for multi-tenant management with Contact Messages prominently displayed. Access it at:

```
http://localhost:8000/admin
```

**Need Help?** All models are properly configured with multi-tenancy support!
