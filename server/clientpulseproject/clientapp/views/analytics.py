from django.http import HttpResponse
import csv
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count, Avg, Q, F
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth, ExtractHour
from django.utils import timezone
from datetime import timedelta, datetime
from decimal import Decimal
from ..models import Booking, Visit, Service, StaffMember, Customer
from ..serializers import BookingSerializer


class AnalyticsViewSet(viewsets.ViewSet):
    """Analytics and reporting endpoints"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_tenant(self):
        """Get the current user's tenant"""
        if self.request.user.is_superuser:
            return None
        if hasattr(self.request.user, 'profile'):
            return self.request.user.profile.tenant
        return None
    
    @action(detail=False, methods=['get'])
    def revenue_analytics(self, request):
        """Get comprehensive revenue analytics"""
        tenant = self.get_tenant()
        if not tenant and not request.user.is_superuser:
            return Response({'error': 'Permission denied'}, status=403)

        period = request.query_params.get('period', 'monthly')  # daily, weekly, monthly
        
        # Base queryset
        visits = Visit.objects.all()
        if tenant:
            visits = visits.filter(tenant=tenant)
        
        # Get date range
        end_date = timezone.now()
        if period == 'daily':
            start_date = end_date - timedelta(days=30)
            trunc_func = TruncDate
        elif period == 'weekly':
            start_date = end_date - timedelta(weeks=12)
            trunc_func = TruncWeek
        else:  # monthly
            start_date = end_date - timedelta(days=365)
            trunc_func = TruncMonth
        
        visits = visits.filter(visit_date__gte=start_date)
        
        # Revenue over time
        revenue_data = visits.annotate(
            period=trunc_func('visit_date')
        ).values('period').annotate(
            revenue=Sum('total_amount'),
            visit_count=Count('id'),
            avg_ticket=Avg('total_amount')
        ).order_by('period')
        
        # Service performance
        service_performance = visits.values(
            'services__name', 'services__category'
        ).annotate(
            revenue=Sum('total_amount'),
            count=Count('id')
        ).order_by('-revenue')[:10]
        
        # Staff performance
        staff_performance = visits.filter(
            staff_member__isnull=False
        ).values(
            'staff_member__name', 'staff_member__id'
        ).annotate(
            revenue=Sum('total_amount'),
            visit_count=Count('id'),
            avg_ticket=Avg('total_amount')
        ).order_by('-revenue')[:10]
        
        # Total revenue
        total_stats = visits.aggregate(
            total_revenue=Sum('total_amount'),
            total_visits=Count('id'),
            avg_ticket=Avg('total_amount')
        )
        
        return Response({
            'period': period,
            'date_range': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat()
            },
            'total_stats': {
                'revenue': float(total_stats['total_revenue'] or 0),
                'visits': total_stats['total_visits'],
                'avg_ticket': float(total_stats['avg_ticket'] or 0)
            },
            'revenue_trend': [
                {
                    'date': item['period'].isoformat() if item['period'] else None,
                    'revenue': float(item['revenue'] or 0),
                    'visits': item['visit_count'],
                    'avg_ticket': float(item['avg_ticket'] or 0)
                }
                for item in revenue_data
            ],
            'service_performance': [
                {
                    'service_name': item['services__name'],
                    'category': item['services__category'],
                    'revenue': float(item['revenue'] or 0),
                    'count': item['count']
                }
                for item in service_performance if item['services__name']
            ],
            'staff_performance': [
                {
                    'staff_id': item['staff_member__id'],
                    'staff_name': item['staff_member__name'],
                    'revenue': float(item['revenue'] or 0),
                    'visits': item['visit_count'],
                    'avg_ticket': float(item['avg_ticket'] or 0)
                }
                for item in staff_performance
            ]
        })
    
    @action(detail=False, methods=['get'])
    def customer_analytics(self, request):
        """Get customer analytics including retention, CLV, and visit patterns"""
        tenant = self.get_tenant()
        if not tenant and not request.user.is_superuser:
            return Response({'error': 'Permission denied'}, status=403)
        
        # Base queryset
        customers = Customer.objects.all()
        if tenant:
            customers = customers.filter(tenant=tenant)
        
        # Total customers
        total_customers = customers.count()
        
        # New customers (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        new_customers = customers.filter(created_at__gte=thirty_days_ago).count()
        
        # Returning customers (customers with more than 1 visit)
        returning_customers = customers.annotate(
            visit_count=Count('visit')
        ).filter(visit_count__gt=1).count()
        
        # Retention rate
        retention_rate = (returning_customers / total_customers * 100) if total_customers > 0 else 0
        
        # Customer Lifetime Value
        clv_data = customers.annotate(
            total_spent=Sum('visit__total_amount'),
            visit_count=Count('visit')
        ).aggregate(
            avg_clv=Avg('total_spent'),
            avg_visits=Avg('visit_count')
        )
        
        # Visit frequency patterns
        visits = Visit.objects.all()
        if tenant:
            visits = visits.filter(tenant=tenant)
        
        # Peak days
        peak_days = visits.annotate(
            day_of_week=F('visit_date__week_day')
        ).values('day_of_week').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Peak hours
        peak_hours = visits.annotate(
            hour=ExtractHour('visit_date')
        ).values('hour').annotate(
            count=Count('id')
        ).order_by('-count')[:5]
        
        # Top customers by spend
        top_customers = customers.annotate(
            total_spent=Sum('visit__total_amount'),
            visit_count=Count('visit')
        ).filter(total_spent__isnull=False).order_by('-total_spent')[:10]
        
        day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        
        return Response({
            'overview': {
                'total_customers': total_customers,
                'new_customers_30d': new_customers,
                'returning_customers': returning_customers,
                'retention_rate': round(retention_rate, 2)
            },
            'lifetime_value': {
                'avg_clv': float(clv_data['avg_clv'] or 0),
                'avg_visits_per_customer': round(clv_data['avg_visits'] or 0, 2)
            },
            'visit_patterns': {
                'peak_days': [
                    {
                        'day': day_names[item['day_of_week'] - 2] if item['day_of_week'] >= 2 else day_names[item['day_of_week'] + 5],
                        'visits': item['count']
                    }
                    for item in peak_days
                ],
                'peak_hours': [
                    {
                        'hour': f"{item['hour']}:00",
                        'visits': item['count']
                    }
                    for item in peak_hours
                ]
            },
            'top_customers': [
                {
                    'id': str(customer.id),
                    'name': customer.name,
                    'total_spent': float(customer.total_spent or 0),
                    'visits': customer.visit_count,
                    'avg_per_visit': float(customer.total_spent / customer.visit_count) if customer.visit_count > 0 else 0
                }
                for customer in top_customers
            ]
        })
    
    @action(detail=False, methods=['get'])
    def operational_metrics(self, request):
        """Get operational metrics like conversion rates, no-shows, etc."""
        tenant = self.get_tenant()
        if not tenant and not request.user.is_superuser:
            return Response({'error': 'Permission denied'}, status=403)
        
        # Date range
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        
        # Bookings
        bookings = Booking.objects.filter(created_at__gte=start_date)
        if tenant:
            bookings = bookings.filter(tenant=tenant)
        
        total_bookings = bookings.count()
        confirmed_bookings = bookings.filter(status='confirmed').count()
        cancelled_bookings = bookings.filter(status='cancelled').count()
        completed_bookings = bookings.filter(status='completed').count()
        pending_bookings = bookings.filter(status='pending').count()
        
        # Conversion rate (pending -> confirmed)
        conversion_rate = (confirmed_bookings / total_bookings * 100) if total_bookings > 0 else 0
        
        # Cancellation rate
        cancellation_rate = (cancelled_bookings / total_bookings * 100) if total_bookings > 0 else 0
        
        # Completion rate
        completion_rate = (completed_bookings / total_bookings * 100) if total_bookings > 0 else 0
        
        # Average booking lead time
        lead_times = bookings.filter(status__in=['confirmed', 'completed']).annotate(
            lead_time=F('booking_date') - F('created_at')
        ).values_list('lead_time', flat=True)
        
        avg_lead_time_seconds = sum([lt.total_seconds() for lt in lead_times if lt]) / len(lead_times) if lead_times else 0
        avg_lead_time_days = avg_lead_time_seconds / 86400  # Convert to days
        
        # Booking status distribution
        status_distribution = bookings.values('status').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Busiest times
        booking_by_hour = bookings.annotate(
            hour=ExtractHour('booking_date')
        ).values('hour').annotate(
            count=Count('id')
        ).order_by('-count')[:5]
        
        return Response({
            'period_days': days,
            'booking_stats': {
                'total': total_bookings,
                'confirmed': confirmed_bookings,
                'cancelled': cancelled_bookings,
                'completed': completed_bookings,
                'pending': pending_bookings
            },
            'rates': {
                'conversion_rate': round(conversion_rate, 2),
                'cancellation_rate': round(cancellation_rate, 2),
                'completion_rate': round(completion_rate, 2)
            },
            'avg_lead_time_days': round(avg_lead_time_days, 2),
            'status_distribution': [
                {
                    'status': item['status'],
                    'count': item['count'],
                    'percentage': round(item['count'] / total_bookings * 100, 2) if total_bookings > 0 else 0
                }
                for item in status_distribution
            ],
            'busiest_hours': [
                {
                    'hour': f"{item['hour']}:00",
                    'bookings': item['count']
                }
                for item in booking_by_hour
            ]
        })
    
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """Get quick dashboard statistics"""
        tenant = self.get_tenant()
        if not tenant and not request.user.is_superuser:
            return Response({'error': 'Permission denied'}, status=403)
        
        
        # Today's stats
        today = timezone.now().date()
        
        # Bookings today
        bookings_today = Booking.objects.filter(booking_date__date=today)
        if tenant:
            bookings_today = bookings_today.filter(tenant=tenant)
        
        # Revenue today
        visits_today = Visit.objects.filter(visit_date__date=today)
        if tenant:
            visits_today = visits_today.filter(tenant=tenant)
        
        revenue_today = visits_today.aggregate(total=Sum('total_amount'))['total'] or 0
        
        # This month stats
        month_start = today.replace(day=1)
        visits_this_month = Visit.objects.filter(visit_date__gte=month_start)
        if tenant:
            visits_this_month = visits_this_month.filter(tenant=tenant)
        
        revenue_this_month = visits_this_month.aggregate(total=Sum('total_amount'))['total'] or 0
        
        # Last month for comparison
        last_month_start = (month_start - timedelta(days=1)).replace(day=1)
        last_month_end = month_start - timedelta(days=1)
        visits_last_month = Visit.objects.filter(
            visit_date__gte=last_month_start,
            visit_date__lte=last_month_end
        )
        if tenant:
            visits_last_month = visits_last_month.filter(tenant=tenant)
        
        revenue_last_month = visits_last_month.aggregate(total=Sum('total_amount'))['total'] or 0
        
        # Calculate growth
        revenue_growth = 0
        if revenue_last_month > 0:
            revenue_growth = ((revenue_this_month - revenue_last_month) / revenue_last_month) * 100
        
        # Pending bookings
        pending_bookings = Booking.objects.filter(status='pending')
        if tenant:
            pending_bookings = pending_bookings.filter(tenant=tenant)
        
        return Response({
            'today': {
                'bookings': bookings_today.count(),
                'revenue': float(revenue_today)
            },
            'this_month': {
                'revenue': float(revenue_this_month),
                'visits': visits_this_month.count(),
                'growth_percentage': round(revenue_growth, 2)
            },
            'pending_bookings': pending_bookings.count()
        })

    @action(detail=False, methods=['get'])
    def referral_analytics(self, request):
        """Get analytics for the referral program"""
        tenant = self.get_tenant()
        if not tenant and not request.user.is_superuser:
            return Response({'error': 'Permission denied'}, status=403)
            
        customers = Customer.objects.all()
        if tenant:
            customers = customers.filter(tenant=tenant)
            
        # Top referrers
        top_referrers = customers.annotate(
            referral_count=Count('referrals')
        ).filter(referral_count__gt=0).order_by('-referral_count')[:10]
        
        # Stats
        total_referrals = customers.filter(referred_by__isnull=False).count()
        active_referrers = customers.annotate(rc=Count('referrals')).filter(rc__gt=0).count()
        
        return Response({
            'total_referrals': total_referrals,
            'active_referrers': active_referrers,
            'referral_leaderboard': [
                {
                    'id': str(c.id),
                    'name': c.name,
                    'count': c.referral_count,
                    'points': c.points
                }
                for c in top_referrers
            ]
        })
    
    @action(detail=False, methods=['get'])
    def export_report(self, request):
        """Export analytics data to CSV"""
        tenant = self.get_tenant()
        if not tenant and not request.user.is_superuser:
            return Response({'error': 'Permission denied'}, status=403)
            
        report_type = request.query_params.get('type', 'revenue') # revenue, customers, bookings
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{report_type}_report_{timezone.now().date()}.csv"'
        
        writer = csv.writer(response)
        
        if report_type == 'revenue':
            writer.writerow(['Date', 'Customer', 'Staff Member', 'Amount', 'Payment Status'])
            visits = Visit.objects.filter(visit_date__gte=start_date).order_by('-visit_date')
            if tenant:
                visits = visits.filter(tenant=tenant)
            
            for visit in visits:
                writer.writerow([
                    visit.visit_date.strftime('%Y-%m-%d %H:%M'),
                    visit.customer.name,
                    visit.staff_member.name if visit.staff_member else 'N/A',
                    visit.total_amount,
                    visit.payment_status
                ])
                
        elif report_type == 'customers':
            writer.writerow(['Name', 'Email', 'Phone', 'Visit Count', 'Total Spent', 'Points', 'Referral Code', 'Referred By', 'Joined Date'])
            customers = Customer.objects.all()
            if tenant:
                customers = customers.filter(tenant=tenant)
            
            customers = customers.annotate(
                total_spent=Sum('visit__total_amount')
            ).order_by('-total_spent')
            
            for customer in customers:
                writer.writerow([
                    customer.name,
                    customer.email or 'N/A',
                    customer.phone or 'N/A',
                    customer.visit_count,
                    customer.total_spent or 0,
                    customer.points,
                    customer.referral_code,
                    customer.referred_by.name if customer.referred_by else 'Direct',
                    customer.created_at.strftime('%Y-%m-%d')
                ])
                
        elif report_type == 'bookings':
            writer.writerow(['Booking Date', 'Customer', 'Service', 'Staff Member', 'Status', 'Created At'])
            bookings = Booking.objects.filter(booking_date__gte=start_date).order_by('-booking_date')
            if tenant:
                bookings = bookings.filter(tenant=tenant)
                
            for b in bookings:
                writer.writerow([
                    b.booking_date.strftime('%Y-%m-%d %H:%M'),
                    b.customer.name,
                    b.service.name,
                    b.staff_member.name if b.staff_member else 'N/A',
                    b.status,
                    b.created_at.strftime('%Y-%m-%d %H:%M')
                ])

        elif report_type == 'referrals':
            writer.writerow(['Referrer', 'Referred Customer', 'Date Joined', 'Points Awarded'])
            referrals = Customer.objects.filter(referred_by__isnull=False, created_at__gte=start_date).order_by('-created_at')
            if tenant:
                referrals = referrals.filter(tenant=tenant)
            
            for ref in referrals:
                writer.writerow([
                    ref.referred_by.name,
                    ref.name,
                    ref.created_at.strftime('%Y-%m-%d %H:%M'),
                    50 # Fixed bonus points
                ])
        
        return response
