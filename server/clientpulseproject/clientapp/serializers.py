from rest_framework import serializers
from django.contrib.auth.models import User
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Customer, Sale, Reward, Service, Visit, StaffMember, Booking, CustomerReward

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']
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
