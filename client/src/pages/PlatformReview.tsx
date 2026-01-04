import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star, CheckCircle2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PlatformReview() {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8000/api/reviews/', {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    rating,
                    comment,
                    reviewer_type: 'business_owner',
                    is_public: true,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to submit review');
            }

            toast({
                title: 'Review Submitted',
                description: 'Thank you for your feedback! Your testimonial will help other business owners.',
            });

            // Redirect to dashboard after 1 second
            setTimeout(() => {
                navigate('/dashboard');
            }, 1000);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to submit review. Please try again.',
                variant: 'destructive',
            });
            setSubmitting(false);
        }
    };

    return (
        <AppLayout
            title="⭐ Review ClientPulse"
            subtitle="Share your experience with our platform to help other business owners"
        >
            <div className="max-w-3xl mx-auto">
                <Card className="border-amber-100 shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-8 text-white">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                <Sparkles className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Share Your Success Story</h2>
                                <p className="text-amber-100 mt-1">
                                    Help other business owners discover how ClientPulse can transform their business
                                </p>
                            </div>
                        </div>
                    </div>

                    <CardContent className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Rating */}
                            <div className="text-center">
                                <Label className="text-lg font-semibold mb-4 block">
                                    How would you rate ClientPulse?
                                </Label>
                                <div className="flex justify-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            className="transition-transform hover:scale-110 focus:outline-none"
                                        >
                                            <Star
                                                className={`w-12 h-12 ${star <= rating
                                                    ? 'fill-amber-500 text-amber-500'
                                                    : 'text-amber-200'
                                                    }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                                <p className="mt-4 font-medium text-amber-700">
                                    {rating === 5 && "Excellent! We're thrilled to hear that!"}
                                    {rating === 4 && "Great! We're glad you're satisfied."}
                                    {rating === 3 && "Good, we appreciate your feedback."}
                                    {rating === 2 && "We'd love to hear how we can improve."}
                                    {rating === 1 && "We're sorry to hear that. Please let us know what went wrong."}
                                </p>
                            </div>

                            {/* Comment */}
                            <div className="space-y-3">
                                <Label htmlFor="comment" className="text-lg font-semibold">
                                    Tell us about your experience
                                </Label>
                                <Textarea
                                    id="comment"
                                    placeholder="How has ClientPulse helped your business? What features do you love? What impact has it made on your revenue or customer retention?"
                                    className="min-h-[200px] text-lg border-amber-100 focus:ring-amber-500"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    required
                                />
                                <p className="text-sm text-gray-500">
                                    💡 Tip: Specific details about results (e.g., "Increased repeat customers by 30%") help other business owners understand the value.
                                </p>
                            </div>

                            {/* Public Notice */}
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                    <div className="text-sm text-amber-900">
                                        <p className="font-semibold mb-1">Your review will be public</p>
                                        <p>
                                            Your testimonial will appear on our landing page to help other business owners
                                            make informed decisions about using ClientPulse. Your business name will be displayed.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={submitting || !comment.trim()}
                                className="w-full h-14 text-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl shadow-lg transition-all"
                            >
                                {submitting ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Submitting...
                                    </span>
                                ) : (
                                    'Submit Review'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

            </div>
        </AppLayout>
    );
}
