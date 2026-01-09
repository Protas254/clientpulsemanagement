from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models import ChatSession, ChatMessage, Tenant, Customer
from ..serializers import ChatSessionSerializer, ChatMessageSerializer
from django.db.models import Q
import uuid

class ChatViewSet(viewsets.ModelViewSet):
    queryset = ChatSession.objects.all()
    serializer_class = ChatSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'profile') and user.profile.tenant:
            # Tenant sees all chats for their tenant
            return ChatSession.objects.filter(tenant=user.profile.tenant).order_by('-updated_at')
        elif hasattr(user, 'customer_profile'):
            # Customer sees only their chats
            return ChatSession.objects.filter(customer=user.customer_profile).order_by('-updated_at')
        return ChatSession.objects.none()

    @action(detail=False, methods=['post'])
    def start_session(self, request):
        """
        Start or get an active chat session.
        Expects 'tenant_id' in body.
        """
        tenant_id = request.data.get('tenant_id')
        if not tenant_id:
            return Response({'error': 'Tenant ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Check if user is a customer
            if not hasattr(request.user, 'customer_profile'):
                # Check if we can auto-create a customer profile for this user?
                # Or require them to be a customer. 
                # For now, simplistic check.
                return Response({'error': 'Only customers can start chats'}, status=status.HTTP_403_FORBIDDEN)
            
            customer = request.user.customer_profile
            tenant = Tenant.objects.get(id=tenant_id)
            
            # Find active session
            session, created = ChatSession.objects.get_or_create(
                tenant=tenant,
                customer=customer,
                defaults={'is_active': True}
            )
            
            # If session was closed/inactive, reactivate it? 
            # Or just return it. For now, assume single persistent session per tenant-customer pair.
            if not session.is_active:
                session.is_active = True
                session.save()
            
            serializer = self.get_serializer(session)
            return Response(serializer.data)
            
        except Tenant.DoesNotExist:
            return Response({'error': 'Tenant not found'}, status=status.HTTP_404_NOT_FOUND)
            
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        session = self.get_object()
        messages = session.messages.all().order_by('created_at')
        serializer = ChatMessageSerializer(messages, many=True, context={'request': request})
        return Response(serializer.data)
