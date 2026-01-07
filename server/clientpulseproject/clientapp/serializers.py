from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Customer, Sale, Reward, Service, Visit, StaffMember, Booking, 
    CustomerReward, ContactMessage, Notification, UserProfile, Tenant, 
    SubscriptionPlan, TenantSubscription, Review, Product, InventoryLog,
    ServiceProductConsumption, Expense, GalleryImage
)

User = get_user_model()

class ReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.ReadOnlyField(source='customer.name')
    visit_date = serializers.ReadOnlyField(source='visit.visit_date')
    reviewer_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Review
        fields = '__all__'
        extra_kwargs = {
            'customer': {'required': False},
            'tenant': {'required': False}
        }

    def get_reviewer_name(self, obj):
        if obj.customer:
            return obj.customer.name
        if obj.user:
            return obj.user.get_full_name() or obj.user.username
        return "Anonymous"

class TenantSerializer(serializers.ModelSerializer):
    owner_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Tenant
        fields = '__all__'
        
    def get_owner_name(self, obj):
        # Find the user profile linked to this tenant with role 'tenant_admin'
        # We use the reverse relationship from Tenant to UserProfile
        admin_profile = obj.userprofile_set.filter(role='tenant_admin').first()
        if admin_profile and admin_profile.user:
            return admin_profile.user.get_full_name() or admin_profile.user.username
        return "Unknown"

class UserProfileSerializer(serializers.ModelSerializer):
    tenant = TenantSerializer(read_only=True)
    class Meta:
        model = UserProfile
        fields = ['photo', 'tenant', 'role']

class UserSerializer(serializers.ModelSerializer):
    photo = serializers.ImageField(source='profile.photo', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'photo', 'first_name', 'last_name', 'profile']
        read_only_fields = ['profile']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'

class InventoryLogSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    created_by_name = serializers.ReadOnlyField(source='created_by.get_full_name')

    class Meta:
        model = InventoryLog
        fields = '__all__'

class ServiceProductConsumptionSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    
    class Meta:
        model = ServiceProductConsumption
        fields = ['id', 'product', 'product_name', 'quantity']
        extra_kwargs = {
             'id': {'read_only': False, 'required': False} # Allow updating existing
        }

class ServiceSerializer(serializers.ModelSerializer):
    """Serializer for salon/spa services"""
    product_consumption = ServiceProductConsumptionSerializer(many=True, required=False)

    class Meta:
        model = Service
        fields = '__all__'
    
    def create(self, validated_data):
        consumption_data = validated_data.pop('product_consumption', [])
        service = Service.objects.create(**validated_data)
        
        for item in consumption_data:
            ServiceProductConsumption.objects.create(service=service, **item)
            
        return service

    def update(self, instance, validated_data):
        consumption_data = validated_data.pop('product_consumption', None)
        
        # Update Service fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if consumption_data is not None:
            # Clear existing consumption and re-add (simple strategy)
            # Or handle updates intelligently
            instance.product_consumption.all().delete()
            for item in consumption_data:
                ServiceProductConsumption.objects.create(service=instance, **item)
                
        return instance


class StaffMemberSerializer(serializers.ModelSerializer):
    """Serializer for staff members (barbers, stylists, therapists)"""
    class Meta:
        model = StaffMember
        fields = '__all__'


class CustomerSerializer(serializers.ModelSerializer):
    favorite_services = ServiceSerializer(many=True, read_only=True)
    preferred_staff = StaffMemberSerializer(read_only=True)
    
    class Meta:
        model = Customer
        fields = '__all__'


class VisitSerializer(serializers.ModelSerializer):
    """Serializer for customer visits with services"""
    customer_name = serializers.ReadOnlyField(source='customer.name')
    services_detail = ServiceSerializer(source='services', many=True, read_only=True)
    staff_member_name = serializers.ReadOnlyField(source='staff_member.name')
    service_ids = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.all(),
        many=True,
        write_only=True,
        source='services'
    )
    
    has_review = serializers.SerializerMethodField()
    
    class Meta:
        model = Visit
        fields = '__all__'
        extra_kwargs = {
            'services': {'read_only': True},
            'review_request_sent': {'read_only': True}
        }

    def get_has_review(self, obj):
        return hasattr(obj, 'review')


class SaleSerializer(serializers.ModelSerializer):
    customer_name = serializers.ReadOnlyField(source='customer.name')

    class Meta:
        model = Sale
        fields = '__all__'


class RewardSerializer(serializers.ModelSerializer):
    applicable_services_detail = ServiceSerializer(source='applicable_services', many=True, read_only=True)
    
    class Meta:
        model = Reward
        fields = '__all__'


class BookingSerializer(serializers.ModelSerializer):
    customer_name = serializers.ReadOnlyField(source='customer.name')
    service_name = serializers.ReadOnlyField(source='service.name')
    staff_member_name = serializers.ReadOnlyField(source='staff_member.name')
    
    class Meta:
        model = Booking
        fields = '__all__'


class CustomerRewardSerializer(serializers.ModelSerializer):
    reward_name = serializers.ReadOnlyField(source='reward.name')
    reward_description = serializers.ReadOnlyField(source='reward.description')
    reward_value = serializers.ReadOnlyField(source='reward.value')
    customer_visit_count = serializers.ReadOnlyField(source='customer.visit_count')
    customer_name = serializers.ReadOnlyField(source='customer.name')
    
    class Meta:
        model = CustomerReward
        fields = '__all__'


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = '__all__'


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class BusinessRegistrationSerializer(serializers.Serializer):
    business_name = serializers.CharField(max_length=200)
    business_type = serializers.CharField(max_length=50)
    city = serializers.CharField(max_length=100)
    phone_number = serializers.CharField(max_length=20)
    
    owner_name = serializers.CharField(max_length=200)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords do not match")
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError("Email already registered")
        return data

class CustomerSignupSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=200)
    phone_number = serializers.CharField(max_length=20)
    email = serializers.EmailField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    tenant_id = serializers.UUIDField()
    
    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords do not match")
        return data

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    features_list = serializers.SerializerMethodField()
    
    class Meta:
        model = SubscriptionPlan
        fields = '__all__'
        
    def get_features_list(self, obj):
        return obj.get_features_list()

class TenantSubscriptionSerializer(serializers.ModelSerializer):
    plan_details = SubscriptionPlanSerializer(source='plan', read_only=True)
    tenant_name = serializers.ReadOnlyField(source='tenant.name')
    
    class Meta:
        model = TenantSubscription
        fields = '__all__'

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

class PasswordResetConfirmSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    token = serializers.CharField()
    uidb64 = serializers.CharField()

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords do not match")
        return data

class OTPRequestSerializer(serializers.Serializer):
    identifier = serializers.CharField(required=True, help_text="Email or Phone Number")

class OTPVerifySerializer(serializers.Serializer):
    identifier = serializers.CharField(required=True)
    otp = serializers.CharField(required=True, max_length=6)

class OTPPasswordResetSerializer(serializers.Serializer):
    identifier = serializers.CharField(required=True)
    otp = serializers.CharField(required=True, max_length=6)
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords do not match")
        return data

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = '__all__'
        read_only_fields = ['tenant']

class GalleryImageSerializer(serializers.ModelSerializer):
    staff_member_name = serializers.ReadOnlyField(source='staff_member.name')
    service_name = serializers.ReadOnlyField(source='service.name')
    
    class Meta:
        model = GalleryImage
        fields = '__all__'
        read_only_fields = ['tenant', 'staff_member_name', 'service_name']
