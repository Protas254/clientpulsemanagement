import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star, CheckCircle2, Scissors, Calendar, User } from 'lucide-react';
import { fetchVisit, createReview, Visit } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export default function ReviewPage() {
    const { visitId } = useParams<{ visitId: string }>();
    const [visit, setVisit] = useState<Visit | null>(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        if (visitId) {
            loadVisit();
        }
    }, [visitId]);

    const loadVisit = async () => {
        try {
            if (!visitId) return;
            const foundVisit = await fetchVisit(visitId);
            if (foundVisit) {
                setVisit(foundVisit);
            } else {
                toast({
                    title: 'Error',
                    description: 'Visit not found or you do not have permission to review it.',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Failed to load visit', error);
            toast({
                title: 'Error',
                description: 'Failed to load visit details.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!visitId) return;

        setSubmitting(true);
        try {
            await createReview({
                visit: visitId,
                rating,
                comment,
                is_public: true
            });
            setSubmitted(true);
            toast({
                title: 'Review Submitted',
                description: 'Thank you for your feedback!',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to submit review. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="max-w-md w-full text-center p-8 border-amber-100 shadow-xl">
                    <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
                    <h1 className="text-3xl font-display font-bold text-amber-900 mb-4">Thank You!</h1>
                    <p className="text-lg text-muted-foreground mb-8">
                        Your feedback helps us improve our services and helps other customers know what to expect.
                    </p>
                    <Button
                        onClick={() => navigate('/')}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                    >
                        Return Home
                    </Button>
                </Card>
            </div>
        );
    }

    if (!visit) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="max-w-md w-full text-center p-8 border-red-100 shadow-xl">
                    <h1 className="text-2xl font-display font-bold text-red-900 mb-4">Invalid Review Link</h1>
                    <p className="text-muted-foreground mb-8">
                        This review link is invalid or has expired.
                    </p>
                    <Button onClick={() => navigate('/')} variant="outline" className="w-full">
                        Return Home
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50 to-background py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-display font-bold text-amber-900 mb-2">Share Your Experience</h1>
                    <p className="text-lg text-amber-700/70">How was your visit to ClientPulse?</p>
                </div>

                <Card className="border-amber-100 shadow-2xl overflow-hidden">
                    <div className="bg-amber-600 p-6 text-white">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                <Scissors className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">
                                    {visit.services_detail?.map(s => s.name).join(', ') || 'Service'}
                                </h2>
                                <div className="flex items-center gap-4 text-amber-100 text-sm mt-1">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(visit.visit_date).toLocaleDateString()}
                                    </span>
                                    {visit.staff_member_name && (
                                        <span className="flex items-center gap-1">
                                            <User className="w-4 h-4" />
                                            {visit.staff_member_name}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <CardContent className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="text-center">
                                <Label className="text-lg font-semibold mb-4 block">Rate your experience</Label>
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
                                    {rating === 5 && "Excellent! Couldn't be better."}
                                    {rating === 4 && "Great! I'm very satisfied."}
                                    {rating === 3 && "Good, but there's room for improvement."}
                                    {rating === 2 && "Not what I expected."}
                                    {rating === 1 && "Very disappointed."}
                                </p>
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="comment" className="text-lg font-semibold">Tell us more (optional)</Label>
                                <Textarea
                                    id="comment"
                                    placeholder="What did you like? What can we improve?"
                                    className="min-h-[150px] text-lg border-amber-100 focus:ring-amber-500"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={submitting}
                                className="w-full h-14 text-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl shadow-lg transition-all"
                            >
                                {submitting ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Submitting...
                                    </span>
                                ) : (
                                    "Submit Review"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
