from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from ..models import Sale, PaymentTransaction, Booking, Visit, create_notification
from ..serializers import SaleSerializer
from django_daraja.mpesa.core import MpesaClient

class SaleListCreate(generics.ListCreateAPIView):
    serializer_class = SaleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Sale.objects.all()
        if not self.request.user.is_superuser:
            if hasattr(self.request.user, 'profile') and self.request.user.profile.tenant:
                queryset = queryset.filter(customer__tenant=self.request.user.profile.tenant)
            else:
                queryset = queryset.none()
        return queryset

    def perform_create(self, serializer):
        sale = serializer.save()
        customer = sale.customer
        # Add points: 1 point per currency unit
        customer.points += int(sale.amount)
        customer.last_purchase = sale.date
        customer.save()

class SaleDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SaleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Sale.objects.all()
        if not self.request.user.is_superuser:
            if hasattr(self.request.user, 'profile') and self.request.user.profile.tenant:
                queryset = queryset.filter(customer__tenant=self.request.user.profile.tenant)
            else:
                queryset = queryset.none()
        return queryset

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def initiate_stk_push(request):
    phone_number = request.data.get('phone_number')
    amount = request.data.get('amount')
    account_reference = request.data.get('account_reference', 'Payment')
    transaction_desc = request.data.get('transaction_desc', 'Payment Description')

    if not phone_number or not amount:
        return Response({"error": "Phone number and amount are required"}, status=400)

    cl = MpesaClient()
    response = cl.stk_push(phone_number, amount, account_reference, transaction_desc)
    
    if response and response.get('ResponseCode') == '0':
        checkout_request_id = response.get('CheckoutRequestID')
        
        # Create PaymentTransaction
        tenant = None
        if request.user.is_authenticated and hasattr(request.user, 'profile'):
            tenant = request.user.profile.tenant
        elif request.user.is_authenticated and hasattr(request.user, 'customer_profile'):
            tenant = request.user.customer_profile.tenant
        
        booking_id = request.data.get('booking_id')
        visit_id = request.data.get('visit_id')
        
        if not tenant and booking_id:
            try:
                booking = Booking.objects.get(id=booking_id)
                tenant = booking.tenant
            except Booking.DoesNotExist:
                pass
        
        if not tenant and visit_id:
            try:
                visit = Visit.objects.get(id=visit_id)
                tenant = visit.tenant
            except Visit.DoesNotExist:
                pass

        if tenant:
            PaymentTransaction.objects.create(
                tenant=tenant,
                amount=amount,
                checkout_request_id=checkout_request_id,
                payment_method='M-Pesa',
                status='pending',
                booking_id=booking_id,
                visit_id=visit_id
            )

    return Response(response)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def mpesa_callback(request):
    data = request.data
    
    try:
        body = data.get('Body', {})
        stk_callback = body.get('stkCallback', {})
        
        checkout_request_id = stk_callback.get('CheckoutRequestID')
        result_code = stk_callback.get('ResultCode')
        result_desc = stk_callback.get('ResultDesc')
        
        transaction = PaymentTransaction.objects.filter(checkout_request_id=checkout_request_id).first()
        
        if transaction:
            if result_code == 0:
                # Success
                callback_metadata = stk_callback.get('CallbackMetadata', {}).get('Item', [])
                mpesa_receipt_number = next((item.get('Value') for item in callback_metadata if item.get('Name') == 'MpesaReceiptNumber'), None)
                
                transaction.status = 'paid'
                transaction.reference_number = mpesa_receipt_number
                transaction.save()
                
                # Update Booking or Visit
                if transaction.booking:
                    transaction.booking.status = 'confirmed' # Or whatever status implies paid/confirmed
                    transaction.booking.save()
                    
                    # Notify Customer
                    create_notification(
                        title="Payment Received",
                        message=f"Payment of {transaction.amount} received for your booking.",
                        recipient_type='customer',
                        customer=transaction.booking.customer,
                        send_email=True
                    )
                    
                if transaction.visit:
                    transaction.visit.payment_status = 'paid'
                    transaction.visit.save()
            else:
                # Failed/Cancelled
                transaction.status = 'failed'
                transaction.save()
                
        return Response({"ResultCode": 0, "ResultDesc": "Accepted"})
    except Exception as e:
        print(f"Error processing M-Pesa callback: {e}")
        return Response({"ResultCode": 1, "ResultDesc": "Failed"}, status=500)
