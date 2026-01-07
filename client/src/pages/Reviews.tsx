import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, MessageSquare, User, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { fetchReviews, Review } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function Reviews() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadReviews();
    }, []);

    const loadReviews = async () => {
        try {
            const data = await fetchReviews();
            setReviews(data);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load reviews',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    //     if (loading) {
    //         return (
    //             <AppLayout title="Customer Reviews" subtitle="Loading...">
    //                 <div className="flex items-center justify-center h-64">
    //                     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
    //                 </div>
    //             </AppLayout>
    //         );
    //     }

    return (
        <AppLayout
            title="⭐ Customer Reviews"
            subtitle="Manage and view feedback from your clients"
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-amber-50 border-amber-100">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-amber-600">Average Rating</p>
                                <p className="text-3xl font-bold text-amber-900">
                                    {reviews.length > 0
                                        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
                                        : '0.0'}
                                </p>
                            </div>
                            <Star className="w-10 h-10 text-amber-500 fill-amber-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-blue-50 border-blue-100">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-600">Total Reviews</p>
                                <p className="text-3xl font-bold text-blue-900">{reviews.length}</p>
                            </div>
                            <MessageSquare className="w-10 h-10 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-100">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-600">Public Reviews</p>
                                <p className="text-3xl font-bold text-green-900">
                                    {reviews.filter(r => r.is_public).length}
                                </p>
                            </div>
                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                {reviews.length > 0 ? (
                    reviews.map((review) => (
                        <Card key={review.id} className="overflow-hidden border-gray-100 hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="flex">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star
                                                        key={star}
                                                        className={`w-4 h-4 ${star <= review.rating ? 'fill-amber-500 text-amber-500' : 'text-gray-200'}`}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                                {review.reviewer_type === 'business_owner' ? 'Business Owner' : 'Customer'}
                                            </span>
                                        </div>
                                        <p className="text-gray-800 italic mb-4">"{review.comment || 'No comment provided.'}"</p>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <User className="w-4 h-4" />
                                                {review.reviewer_name}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                {format(new Date(review.created_at), 'MMM d, yyyy')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col justify-center items-end gap-2">
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${review.is_public ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {review.is_public ? 'Public on Landing Page' : 'Private'}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No reviews received yet.</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
