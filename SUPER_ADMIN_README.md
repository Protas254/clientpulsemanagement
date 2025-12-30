# Super Admin Dashboard

## Overview
The Super Admin Dashboard allows platform administrators to manage all tenants across ClientPulse. This includes viewing tenant statistics, managing contact messages, and accessing tenant-specific data.

## Features

### 1. **Super Admin Dashboard** (`/super-admin`)
- View all tenants across the platform
- See quick statistics for each tenant:
  - Total customers
  - Total bookings
  - Total services
  - Total staff members
  - Pending contact messages
- Search tenants by name, city, or business type
- Click on any tenant to view detailed information

### 2. **Tenant Management** (`/super-admin/tenant/:tenantId`)
- Comprehensive view of a specific tenant's data
- Tabbed interface with:
  - **Overview**: Quick stats dashboard
  - **Bookings**: All bookings for the tenant
  - **Customers**: Customer list with visit counts and points
  - **Services**: All services offered by the tenant
  - **Contact Messages**: Messages from customers (NEW!)

### 3. **Contact Messages**
- View all contact messages from customers
- Filter by tenant
- See message details including:
  - Full name
  - Email
  - Phone number
  - Subject
  - Message content
  - Date submitted

## API Endpoints

### Tenants
- `GET /api/tenants/` - List all tenants (super admin only)
- `GET /api/tenants/:id/` - Get tenant details
- `GET /api/tenants/:id/stats/` - Get tenant statistics
- `PATCH /api/tenants/:id/` - Update tenant
- `DELETE /api/tenants/:id/` - Delete tenant

### Contact Messages
- `GET /api/contact-messages/` - List all contact messages
- `GET /api/contact-messages/?tenant=:id` - Filter by tenant
- `POST /api/contact-messages/` - Create new message
- `GET /api/contact-messages/:id/` - Get message details
- `DELETE /api/contact-messages/:id/` - Delete message

## Access Control

### Super Admin
- Can view ALL tenants
- Can access all tenant data
- Can manage contact messages across all tenants

### Tenant Admin
- Can only view their own tenant
- Can only access their own tenant's data
- Can only see contact messages for their tenant

## Usage

1. **Login as Super Admin**
   - Use your super admin credentials
   - Navigate to `/super-admin`

2. **View All Tenants**
   - See the list of all tenants with their stats
   - Use the search bar to filter tenants

3. **Manage a Specific Tenant**
   - Click on any tenant card
   - Navigate through the tabs to view different data
   - Check the "Contact Messages" tab to see customer inquiries

4. **Respond to Contact Messages**
   - View message details
   - Contact customers via email or phone
   - Mark messages as resolved (future feature)

## Design Features

- **Premium UI**: Modern, beautiful design with amber/gold color scheme
- **Responsive**: Works on all screen sizes
- **Real-time Stats**: Live data from the backend
- **Search & Filter**: Easy to find specific tenants or messages
- **Tabbed Interface**: Organized data presentation

## Future Enhancements

- [ ] Mark contact messages as read/unread
- [ ] Reply to messages directly from the dashboard
- [ ] Export tenant data
- [ ] Tenant analytics and reports
- [ ] Bulk actions for tenants
- [ ] Email notifications for new messages
