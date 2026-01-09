# Implementation Plan: Real-Time Features & Analytics

## Status: Ready for Implementation

This document outlines the implementation plan for Real-Time Features and Advanced Analytics & Reporting for ClientPulse.

---

## 1. REAL-TIME FEATURES ⚡

### Current State
- WebSocket infrastructure exists in Django Channels
- Basic WebSocket connection setup
- Underutilized for real-time updates

### Implementation Tasks

#### A. Live Booking Notifications for Staff
**Priority: HIGH**

**Backend Changes:**
1. Update `clientapp/consumers.py`:
   - Add `booking_created` event handler
   - Add `booking_updated` event handler
   - Add `booking_cancelled` event handler
   
2. Modify `clientapp/views/bookings.py`:
   - After creating booking, send WebSocket message:
     ```python
     from channels.layers import get_channel_layer
     from asgiref.sync import async_to_sync
     
     channel_layer = get_channel_layer()
     async_to_sync(channel_layer.group_send)(
         f"tenant_{tenant_id}",
         {
             "type": "booking_notification",
             "message": {
                 "type": "new_booking",
                 "booking_id": str(booking.id),
                 "customer_name": booking.customer.name,
                 "service_name": booking.service.name,
                 "booking_date": booking.booking_date.isoformat(),
             }
         }
     )
     ```

**Frontend Changes:**
1. Create `client/src/hooks/useWebSocket.ts`:
   ```typescript
   export const useWebSocket = (tenantId: string) => {
     const [socket, setSocket] = useState<WebSocket | null>(null);
     const [notifications, setNotifications] = useState<any[]>([]);
     
     useEffect(() => {
       const ws = new WebSocket(`ws://localhost:8000/ws/tenant/${tenantId}/`);
       
       ws.onmessage = (event) => {
         const data = JSON.parse(event.data);
         setNotifications(prev => [data, ...prev]);
         // Show toast notification
       };
       
       setSocket(ws);
       return () => ws.close();
     }, [tenantId]);
     
     return { socket, notifications };
   };
   ```

2. Update `client/src/pages/Dashboard.tsx`:
   - Add `useWebSocket` hook
   - Display real-time notifications
   - Auto-refresh booking list on new booking

**Files to Modify:**
- `server/clientpulseproject/clientapp/consumers.py`
- `server/clientpulseproject/clientapp/views/bookings.py`
- `client/src/hooks/useWebSocket.ts` (NEW)
- `client/src/pages/Dashboard.tsx`
- `client/src/components/layout/TopNav.tsx` (for notification bell)

---

#### B. Real-Time Availability Updates
**Priority: MEDIUM**

**Implementation:**
1. Track staff availability in real-time
2. When a booking is made, update available time slots
3. Broadcast availability changes to all connected clients

**Backend:**
```python
# In bookings view after creating booking
async_to_sync(channel_layer.group_send)(
    f"tenant_{tenant_id}",
    {
        "type": "availability_update",
        "message": {
            "staff_id": str(staff_id),
            "date": booking_date,
            "unavailable_slots": get_unavailable_slots(staff_id, booking_date)
        }
    }
)
```

**Frontend:**
- Update `CustomerPortal.tsx` booking calendar
- Disable booked time slots in real-time
- Show "Just booked!" indicator

---

#### C. Live Chat Support
**Priority: MEDIUM-LOW**

**Implementation:**
1. Create chat consumer in Django Channels
2. Build chat UI component
3. Store chat history in database

**New Files:**
- `server/clientpulseproject/clientapp/models.py` - Add `ChatMessage` model
- `server/clientpulseproject/clientapp/consumers.py` - Add `ChatConsumer`
- `client/src/components/chat/LiveChat.tsx` (NEW)
- `client/src/components/chat/ChatWidget.tsx` (NEW)

**Features:**
- Customer-to-business chat
- Typing indicators
- Read receipts
- Chat history
- File attachments

---

#### D. Dashboard Auto-Refresh
**Priority: HIGH**

**Implementation:**
1. Use WebSocket to push updates instead of polling
2. Update dashboard stats in real-time
3. Refresh charts and tables automatically

**Code Example:**
```typescript
// In Dashboard.tsx
const { notifications } = useWebSocket(tenantId);

useEffect(() => {
  notifications.forEach(notification => {
    if (notification.type === 'new_booking') {
      // Increment booking count
      setStats(prev => ({
        ...prev,
        totalBookings: prev.totalBookings + 1
      }));
      // Refresh booking list
      loadBookings();
    }
  });
}, [notifications]);
```

---

#### E. Staff Activity Tracking
**Priority: LOW**

**Implementation:**
1. Track when staff members log in/out
2. Show "online" status
3. Track active sessions
4. Log activity for reports

**Database Changes:**
```python
class StaffActivity(models.Model):
    staff_member = models.ForeignKey(StaffMember, on_delete=models.CASCADE)
    action = models.CharField(max_length=50)  # login, logout, booking_created, etc.
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True)
    user_agent = models.TextField(null=True)
```

---

## 2. ANALYTICS & REPORTING 📊

### Implementation Tasks

#### A. Revenue Analytics

**New API Endpoints:**
```python
# In views/reports.py
class RevenueAnalyticsViewSet(viewsets.ViewSet):
    @action(detail=False, methods=['get'])
    def daily_revenue(self, request):
        # Return daily revenue for last 30 days
        pass
    
    @action(detail=False, methods=['get'])
    def weekly_revenue(self, request):
        # Return weekly revenue for last 12 weeks
        pass
    
    @action(detail=False, methods=['get'])
    def monthly_revenue(self, request):
        # Return monthly revenue for last 12 months
        pass
    
    @action(detail=False, methods=['get'])
    def service_performance(self, request):
        # Return revenue by service
        pass
    
    @action(detail=False, methods=['get'])
    def staff_performance(self, request):
        # Return revenue by staff member
        pass
```

**Frontend Components:**
```typescript
// client/src/pages/Reports.tsx
import { Line, Bar, Pie } from 'recharts';

// Revenue Trend Chart (Line)
<LineChart data={dailyRevenue}>
  <Line dataKey="revenue" stroke="#D97700" />
  <XAxis dataKey="date" />
  <YAxis />
</LineChart>

// Service Performance (Bar)
<BarChart data={servicePerformance}>
  <Bar dataKey="revenue" fill="#D97700" />
  <XAxis dataKey="service_name" />
  <YAxis />
</BarChart>

// Revenue by Category (Pie)
<PieChart>
  <Pie data={categoryRevenue} dataKey="value" nameKey="name" />
</PieChart>
```

---

#### B. Customer Analytics

**Metrics to Track:**
1. **Retention Rate:**
   ```sql
   SELECT 
     COUNT(DISTINCT customer_id) as returning_customers,
     (COUNT(DISTINCT customer_id) * 100.0 / total_customers) as retention_rate
   FROM bookings
   WHERE customer_id IN (
     SELECT customer_id FROM bookings
     GROUP BY customer_id HAVING COUNT(*) > 1
   )
   ```

2. **Customer Lifetime Value (CLV):**
   ```python
   def calculate_clv(customer_id):
       total_spent = Booking.objects.filter(
           customer_id=customer_id,
           status='completed'
       ).aggregate(total=Sum('service__price'))['total'] or 0
       
       visit_count = Booking.objects.filter(
           customer_id=customer_id
       ).count()
       
       avg_per_visit = total_spent / visit_count if visit_count > 0 else 0
       
       return {
           'total_spent': total_spent,
           'visit_count': visit_count,
           'avg_per_visit': avg_per_visit,
           'clv': total_spent  # Can add predictive model here
       }
   ```

3. **Visit Frequency Patterns:**
   - Average days between visits
   - Peak booking days/times
   - Seasonal trends

**New API Endpoints:**
```python
@action(detail=False, methods=['get'])
def customer_retention(self, request):
    # Calculate retention rate
    pass

@action(detail=False, methods=['get'])
def customer_lifetime_value(self, request):
    # Calculate CLV for all customers
    pass

@action(detail=False, methods=['get'])
def visit_patterns(self, request):
    # Analyze visit frequency
    pass
```

---

#### C. Operational Metrics

**1. Booking Conversion Rate:**
```python
def get_conversion_rate(start_date, end_date):
    total_inquiries = ContactMessage.objects.filter(
        created_at__range=[start_date, end_date]
    ).count()
    
    total_bookings = Booking.objects.filter(
        created_at__range=[start_date, end_date]
    ).count()
    
    conversion_rate = (total_bookings / total_inquiries * 100) if total_inquiries > 0 else 0
    
    return {
        'total_inquiries': total_inquiries,
        'total_bookings': total_bookings,
        'conversion_rate': conversion_rate
    }
```

**2. No-Show Rate:**
```python
def get_noshow_rate(start_date, end_date):
    total_bookings = Booking.objects.filter(
        booking_date__range=[start_date, end_date]
    ).count()
    
    noshows = Booking.objects.filter(
        booking_date__range=[start_date, end_date],
        status='cancelled',
        notes__icontains='no-show'
    ).count()
    
    noshow_rate = (noshows / total_bookings * 100) if total_bookings > 0 else 0
    
    return {
        'total_bookings': total_bookings,
        'noshows': noshows,
        'noshow_rate': noshow_rate
    }
```

**3. Peak Hours Analysis:**
```python
def get_peak_hours():
    bookings_by_hour = Booking.objects.annotate(
        hour=ExtractHour('booking_date')
    ).values('hour').annotate(
        count=Count('id')
    ).order_by('-count')
    
    return bookings_by_hour
```

---

#### D. Export to Excel/PDF

**Install Dependencies:**
```bash
pip install openpyxl reportlab
```

**Excel Export:**
```python
from openpyxl import Workbook
from django.http import HttpResponse

@action(detail=False, methods=['get'])
def export_excel(self, request):
    wb = Workbook()
    ws = wb.active
    ws.title = "Revenue Report"
    
    # Headers
    ws.append(['Date', 'Revenue', 'Bookings', 'Customers'])
    
    # Data
    for row in revenue_data:
        ws.append([row['date'], row['revenue'], row['bookings'], row['customers']])
    
    response = HttpResponse(
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = 'attachment; filename=revenue_report.xlsx'
    wb.save(response)
    return response
```

**PDF Export:**
```python
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

@action(detail=False, methods=['get'])
def export_pdf(self, request):
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = 'attachment; filename="report.pdf"'
    
    p = canvas.Canvas(response, pagesize=letter)
    p.drawString(100, 750, "Revenue Report")
    # Add more content
    p.showPage()
    p.save()
    return response
```

---

## Implementation Timeline

### Week 1: Real-Time Features Foundation
- Day 1-2: WebSocket infrastructure improvements
- Day 3-4: Live booking notifications
- Day 5: Dashboard auto-refresh

### Week 2: Real-Time Features Completion
- Day 1-2: Real-time availability updates
- Day 3-5: Live chat support (if prioritized)

### Week 3: Analytics Backend
- Day 1-2: Revenue analytics endpoints
- Day 3-4: Customer analytics endpoints
- Day 5: Operational metrics endpoints

### Week 4: Analytics Frontend & Export
- Day 1-3: Charts and visualizations
- Day 4: Excel/PDF export
- Day 5: Testing and polish

---

## Testing Checklist

### Real-Time Features
- [ ] Multiple users see booking notifications simultaneously
- [ ] Availability updates correctly across sessions
- [ ] Chat messages deliver in real-time
- [ ] Dashboard refreshes without page reload
- [ ] WebSocket reconnects after disconnect

### Analytics
- [ ] Revenue calculations are accurate
- [ ] Charts render correctly with data
- [ ] Date range filters work
- [ ] Export generates valid files
- [ ] Performance with large datasets

---

## Dependencies to Install

```bash
# Backend
pip install channels-redis  # For WebSocket scaling
pip install openpyxl  # Excel export
pip install reportlab  # PDF export
pip install pandas  # Data analysis

# Frontend
npm install recharts  # Charts
npm install date-fns  # Date formatting
npm install xlsx  # Client-side Excel generation
```

---

## Database Migrations Needed

```bash
# After adding new models
python manage.py makemigrations
python manage.py migrate
```

---

## Configuration Changes

### settings.py
```python
# Add to INSTALLED_APPS
INSTALLED_APPS = [
    ...
    'channels',
]

# Channel Layers
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('127.0.0.1', 6379)],
        },
    },
}
```

### routing.py
```python
from django.urls import path
from clientapp import consumers

websocket_urlpatterns = [
    path('ws/tenant/<str:tenant_id>/', consumers.TenantConsumer.as_asgi()),
    path('ws/chat/<str:room_name>/', consumers.ChatConsumer.as_asgi()),
]
```

---

## Next Steps

1. Review this implementation plan
2. Prioritize features based on business needs
3. Set up development environment (Redis for WebSockets)
4. Start with Real-Time Booking Notifications (highest impact)
5. Implement analytics incrementally
6. Test thoroughly before production deployment

---

## Notes

- Real-time features require Redis server running
- Consider WebSocket scaling for production (use Redis backend)
- Analytics queries may be slow with large datasets - consider caching
- Export features should have file size limits
- Implement rate limiting for WebSocket connections
