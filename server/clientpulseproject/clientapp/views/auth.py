from django.shortcuts import render
from django.db.models import Q
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth import authenticate, get_user_model
from ..models import Customer, StaffMember, UserProfile, Tenant, OTP, create_notification
from ..serializers import (
    UserSerializer, CustomerSignupSerializer, BusinessRegistrationSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer,
    OTPRequestSerializer, OTPVerifySerializer, OTPPasswordResetSerializer,
    CustomerSerializer, TenantSerializer
)
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import random
import string
from rest_framework.authtoken.models import Token

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

class BusinessRegistrationView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_scope = 'signup'
    
    def post(self, request):
        serializer = BusinessRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            
            # Create Tenant (Inactive)
            tenant = Tenant.objects.create(
                name=data['business_name'],
                business_type=data['business_type'],
                city=data['city'],
                phone_number=data['phone_number'],
                email=data['email'],
                is_active=True
            )
            
            # Create User (Owner)
            if User.objects.filter(username=data['email']).exists():
                 return Response({'error': 'A user with this email already exists'}, status=status.HTTP_400_BAD_REQUEST)

            user = User.objects.create_user(
                username=data['email'],
                email=data['email'],
                password=data['password'],
                first_name=data['owner_name'].split(' ')[0],
                last_name=' '.join(data['owner_name'].split(' ')[1:]) if ' ' in data['owner_name'] else ''
            )
            
            # Update Profile
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.tenant = tenant
            profile.role = 'tenant_admin'
            profile.save()
            
            # Notify Tenant Admin (Application Received)
            create_notification(
                title="Application Received",
                message=f"Hello {data['owner_name']}, your application for '{data['business_name']}' has been received and is under review. You will be notified once approved.",
                recipient_type='admin',
                user=user,
                send_email=True
            )
            
            return Response({'message': 'Application submitted successfully. Pending review.'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_scope = 'login'

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        # Resolve username if email or customer name is provided
        if username:
            # 1. Check if it's an email
            if '@' in username:
                user_obj = User.objects.filter(email=username).first()
                if user_obj:
                    username = user_obj.username
            else:
                # 2. Check if it's a Customer Name or Phone Number
                customer = Customer.objects.filter(Q(name__iexact=username) | Q(phone=username)).first()
                if customer and customer.user:
                    username = customer.user.username
                else:
                    # 3. Check if it's a Staff Phone Number
                    staff = StaffMember.objects.filter(phone=username).first()
                    if staff and staff.user:
                        username = staff.user.username
                    
        user = authenticate(username=username, password=password)
        if user:
            token, _ = Token.objects.get_or_create(user=user)
            full_name = user.get_full_name() or user.username
            photo_url = None
            if hasattr(user, 'profile') and user.profile.photo:
                photo_url = request.build_absolute_uri(user.profile.photo.url)
            
            role = 'admin' if user.is_superuser else 'staff'
            tenant_id = None
            tenant_name = None
            
            if hasattr(user, 'profile'):
                role = user.profile.role
                if user.is_superuser:
                    role = 'admin'
                if user.profile.tenant:
                    # Check if tenant is active (approved)
                    if role == 'tenant_admin' and not user.profile.tenant.is_active:
                        return Response(
                            {'error': 'Your business account is pending approval. You will be notified once approved.'}, 
                            status=status.HTTP_403_FORBIDDEN
                        )
                    
                    tenant_id = user.profile.tenant.id
                    tenant_name = user.profile.tenant.name
            
            return Response({
                'token': token.key, 
                'user_id': user.id, 
                'username': user.username, 
                'full_name': full_name,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'photo': photo_url,
                'is_superuser': user.is_superuser,
                'role': role,
                'tenant_id': tenant_id,
                'tenant_name': tenant_name
            })
        return Response({'error': 'Invalid Credentials'}, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user = User.objects.filter(email=email).first()
            if user:
                token = default_token_generator.make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                # In production, use the frontend URL from settings
                reset_link = f"http://localhost:8080/forgot-password?token={token}&uid={uid}"
                
                # Send email
                try:
                    send_mail(
                        'Password Reset Request',
                        f'Click the link to reset your password: {reset_link}',
                        settings.DEFAULT_FROM_EMAIL,
                        [email],
                        fail_silently=False,
                    )
                except Exception as e:
                    print(f"Error sending email: {e}")
            
            return Response({'message': 'If an account exists with this email, a reset link has been sent.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            token = serializer.validated_data['token']
            uidb64 = serializer.validated_data['uidb64']
            password = serializer.validated_data['password']
            
            try:
                uid = force_str(urlsafe_base64_decode(uidb64))
                user = User.objects.get(pk=uid)
            except (TypeError, ValueError, OverflowError, User.DoesNotExist):
                user = None
            
            if user and default_token_generator.check_token(user, token):
                user.set_password(password)
                user.save()
                return Response({'message': 'Password has been reset successfully.'})
            else:
                return Response({'error': 'Invalid token or user ID'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RequestOTPView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_scope = 'login'

    def post(self, request):
        serializer = OTPRequestSerializer(data=request.data)
        if serializer.is_valid():
            identifier = serializer.validated_data['identifier']
            user = None
            
            # 1. Try Email
            if '@' in identifier:
                user = User.objects.filter(email=identifier).first()
            else:
                # 2. Try Phone (Customer)
                customer = Customer.objects.filter(phone=identifier).first()
                if customer and customer.user:
                    user = customer.user
                else:
                    # 3. Try Phone (Staff)
                    staff = StaffMember.objects.filter(phone=identifier).first()
                    if staff and staff.user:
                        user = staff.user
            
            if user:
                # Generate OTP
                code = ''.join(random.choices(string.digits, k=6))
                expiry = timezone.now() + timedelta(minutes=10)
                
                # Invalidate old OTPs
                OTP.objects.filter(user=user, is_used=False).update(is_used=True)
                
                OTP.objects.create(user=user, code=code, expires_at=expiry)
                
                # Send OTP
                if '@' in identifier:
                    # Send via Email
                    try:
                        send_mail(
                            'Password Reset OTP',
                            f'Your OTP is: {code}',
                            settings.DEFAULT_FROM_EMAIL,
                            [user.email],
                            fail_silently=False,
                        )
                    except Exception as e:
                        print(f"Error sending email OTP: {e}")
                else:
                    # Send via SMS (Mock for now)
                    print(f"========================================")
                    print(f"SMS OTP for {identifier}: {code}")
                    print(f"========================================")
                    # TODO: Integrate SMS Gateway here
            
            # Always return success
            return Response({'message': 'If an account exists, an OTP has been sent.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyOTPView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_scope = 'login'

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        if serializer.is_valid():
            identifier = serializer.validated_data['identifier']
            otp_code = serializer.validated_data['otp']
            
            user = None
            if '@' in identifier:
                user = User.objects.filter(email=identifier).first()
            else:
                customer = Customer.objects.filter(phone=identifier).first()
                if customer and customer.user:
                    user = customer.user
                else:
                    staff = StaffMember.objects.filter(phone=identifier).first()
                    if staff and staff.user:
                        user = staff.user
            
            if user:
                otp_record = OTP.objects.filter(
                    user=user, 
                    code=otp_code, 
                    is_used=False,
                    expires_at__gt=timezone.now()
                ).first()
                
                if otp_record:
                    return Response({'message': 'OTP verified successfully'})
            
            return Response({'error': 'Invalid or expired OTP'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ResetPasswordOTPView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_scope = 'login'

    def post(self, request):
        serializer = OTPPasswordResetSerializer(data=request.data)
        if serializer.is_valid():
            identifier = serializer.validated_data['identifier']
            otp_code = serializer.validated_data['otp']
            password = serializer.validated_data['password']
            
            user = None
            if '@' in identifier:
                user = User.objects.filter(email=identifier).first()
            else:
                customer = Customer.objects.filter(phone=identifier).first()
                if customer and customer.user:
                    user = customer.user
                else:
                    staff = StaffMember.objects.filter(phone=identifier).first()
                    if staff and staff.user:
                        user = staff.user
            
            if user:
                otp_record = OTP.objects.filter(
                    user=user, 
                    code=otp_code, 
                    is_used=False,
                    expires_at__gt=timezone.now()
                ).first()
                
                if otp_record:
                    # Reset Password
                    user.set_password(password)
                    user.save()
                    
                    # Mark OTP as used
                    otp_record.is_used = True
                    otp_record.save()
                    
                    return Response({'message': 'Password has been reset successfully.'})
            
            return Response({'error': 'Invalid or expired OTP'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CustomerSignupView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_scope = 'signup'
    
    def post(self, request):
        serializer = CustomerSignupSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            
            try:
                tenant = Tenant.objects.get(id=data['tenant_id'])
            except Tenant.DoesNotExist:
                return Response({'error': 'Invalid Tenant ID'}, status=400)
                
            if data.get('email') and User.objects.filter(email=data.get('email')).exists():
                 return Response({'error': 'Email already registered'}, status=400)

            # Create User
            username = data.get('email') or data['phone_number']
            
            if User.objects.filter(username=username).exists():
                 return Response({'error': 'Username or Email already registered'}, status=status.HTTP_400_BAD_REQUEST)
            
            if Customer.objects.filter(phone=data['phone_number'], tenant=tenant).exists():
                 return Response({'error': 'Phone number already registered with this business'}, status=status.HTTP_400_BAD_REQUEST)

            user = User.objects.create_user(
                username=username,
                email=data.get('email', ''),
                password=data['password'],
                first_name=data['full_name'].split(' ')[0],
                last_name=' '.join(data['full_name'].split(' ')[1:]) if ' ' in data['full_name'] else ''
            )
            
            # Handle Referral
            referred_by = None
            if data.get('referral_code'):
                referred_by = Customer.objects.filter(referral_code__iexact=data['referral_code']).first()

            # Create Customer Profile
            customer = Customer.objects.create(
                user=user,
                tenant=tenant,
                name=data['full_name'],
                phone=data['phone_number'],
                email=data.get('email', ''),
                status='ACTIVE',
                is_registered=True,
                referred_by=referred_by,
                points=50 if referred_by else 0 # Bonus for being referred
            )

            # Reward the referrer
            if referred_by:
                referred_by.points += 50
                referred_by.save()
                
                # Notify Referrer
                create_notification(
                    title="Referral Reward!",
                    message=f"You've earned 50 points because {data['full_name']} signed up using your code!",
                    recipient_type='customer',
                    customer=referred_by,
                    send_email=True
                )
            
            # Update UserProfile (for role)
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.role = 'customer'
            profile.tenant = tenant
            profile.save()
            
            return Response({'message': 'Account created successfully'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CustomerProfileUpdateView(APIView):
    permission_classes = [permissions.AllowAny]

    def patch(self, request, pk):
        try:
            customer = Customer.objects.get(pk=pk)
        except Customer.DoesNotExist:
            return Response({'error': 'Customer not found'}, status=404)
        
        # For the portal, we allow updates if they provide the correct ID.
        # The frontend will send the data.
        serializer = CustomerSerializer(customer, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

class AdminProfileUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        serializer = UserSerializer(user)
        data = serializer.data
        if hasattr(user, 'profile') and user.profile.photo:
            data['photo'] = request.build_absolute_uri(user.profile.photo.url)
        data['full_name'] = user.get_full_name() or user.username
        
        # Add tenant info if available
        if hasattr(user, 'profile') and user.profile.tenant:
             data['company_name'] = user.profile.tenant.name
             data['tenant'] = TenantSerializer(user.profile.tenant).data
             
        return Response(data)

    def patch(self, request):
        user = request.user
        
        # Update User fields
        if 'first_name' in request.data:
            user.first_name = request.data['first_name']
        if 'last_name' in request.data:
            user.last_name = request.data['last_name']
        if 'email' in request.data:
            user.email = request.data['email']
        user.save()
        
        # Update Profile photo
        if 'photo' in request.FILES:
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.photo = request.FILES['photo']
            profile.save()
            
        # Return updated user data
        serializer = UserSerializer(user)
        data = serializer.data
        if hasattr(user, 'profile') and user.profile.photo:
            data['photo'] = request.build_absolute_uri(user.profile.photo.url)
        
        return Response(data)
