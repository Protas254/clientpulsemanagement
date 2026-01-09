import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { checkRewards, fetchServices, fetchBookings, updateCustomerProfile, createBooking, redeemReward, sendContactMessage, fetchGallery, addChild } from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/hooks/use-toast';

export const useCustomerPortal = () => {
    const { customerData, setCustomerData, user } = useAuthStore();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const identifier = customerData?.customer?.email || customerData?.customer?.phone || user?.email || user?.username;

    // Fetch Portal Data (Customer, Statistics, Purchases, Visits, Rewards, Redemptions)
    const portalQuery = useQuery({
        queryKey: ['portalData', identifier],
        queryFn: () => checkRewards(identifier!),
        enabled: !!identifier,
    });

    // Sync portal data to Auth Store
    useEffect(() => {
        if (portalQuery.data && (!customerData || portalQuery.data.customer.id !== customerData.customer?.id)) {
            setCustomerData(portalQuery.data);
        }
    }, [portalQuery.data, customerData, setCustomerData]);

    // Fetch Services
    const servicesQuery = useQuery({
        queryKey: ['services'],
        queryFn: fetchServices,
        staleTime: 1000 * 60 * 10, // 10 minutes
    });

    // Fetch Bookings
    const bookingsQuery = useQuery({
        queryKey: ['bookings', customerData?.customer?.id],
        queryFn: () => fetchBookings({ customer: customerData?.customer?.id }),
        enabled: !!customerData?.customer?.id,
    });

    // Fetch Gallery
    const galleryQuery = useQuery({
        queryKey: ['gallery', customerData?.customer?.tenant_id],
        queryFn: () => fetchGallery({ tenant: customerData?.customer?.tenant_id }),
        enabled: !!customerData?.customer?.tenant_id,
        staleTime: 1000 * 60 * 10, // 10 minutes
    });

    const updateProfileMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: FormData }) => updateCustomerProfile(id, data),
        onSuccess: (updatedCustomer) => {
            const newCustomerData = { ...customerData, customer: updatedCustomer };
            setCustomerData(newCustomerData);
            queryClient.setQueryData(['portalData', identifier], newCustomerData);
            toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
        },
        onError: () => {
            toast({ title: "Update Failed", description: "Could not update profile. Please try again.", variant: "destructive" });
        }
    });

    const bookingMutation = useMutation({
        mutationFn: createBooking,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            toast({ title: "Booking Confirmed", description: "Your appointment has been scheduled successfully." });
        },
        onError: (error: any) => {
            toast({ title: "Booking Failed", description: error.message || "Could not complete booking.", variant: "destructive" });
        }
    });

    const redeemMutation = useMutation({
        mutationFn: redeemReward,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['portalData'] });
            toast({ title: "Reward Redeemed!", description: "Your reward has been claimed successfully." });
        },
        onError: (error: any) => {
            toast({ title: "Redemption Failed", description: error.message || "Could not redeem reward.", variant: "destructive" });
        }
    });

    const contactMutation = useMutation({
        mutationFn: sendContactMessage,
        onSuccess: () => {
            toast({
                title: "Message Sent",
                description: "Your message has been sent to the business owner.",
                className: "bg-green-50 border-green-200 text-green-800"
            });
        },
        onError: () => {
            toast({ title: "Failed to Send", description: "Could not send message. Please try again.", variant: "destructive" });
        }
    });
    const addChildMutation = useMutation({
        mutationFn: addChild,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['portalData'] });
            toast({ title: "Profile Added", description: "Child profile has been added successfully." });
        },
        onError: (error: any) => {
            toast({ title: "Failed to Add", description: error.message || "Could not add child profile.", variant: "destructive" });
        }
    });

    return {
        portalData: portalQuery.data,
        isLoading: portalQuery.isLoading || servicesQuery.isLoading || bookingsQuery.isLoading,
        isError: portalQuery.isError,
        services: servicesQuery.data || [],
        bookings: bookingsQuery.data || [],
        gallery: galleryQuery.data || [],
        updateProfile: updateProfileMutation.mutate,
        isUpdating: updateProfileMutation.isPending,
        confirmBooking: bookingMutation.mutate,
        isBookingLoading: bookingMutation.isPending,
        redeemReward: redeemMutation.mutate,
        sendContact: contactMutation.mutate,
        isContactLoading: contactMutation.isPending,
        addChild: addChildMutation.mutate,
        isAddingChild: addChildMutation.isPending,
        refreshPortal: () => queryClient.invalidateQueries({ queryKey: ['portalData'] }),
    };
};
