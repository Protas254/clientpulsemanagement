from rest_framework import serializers
from django.contrib.auth.models import User
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Customer, Sale, Reward, Service, Visit, StaffMember, Booking, CustomerReward, ContactMessage, Notification, UserProfile, Tenant, SubscriptionPlan, TenantSubscription

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


class ServiceSerializer(serializers.ModelSerializer):
    """Serializer for salon/spa services"""
    class Meta:
        model = Service
        fields = '__all__'


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
    
    class Meta:
        model = Visit
        fields = '__all__'
        extra_kwargs = {
            'services': {'read_only': True}
        }


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
    email = serializers.EmailField(required=False)
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    tenant_id = serializers.IntegerField()
    
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

