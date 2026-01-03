import React, { useState, useEffect } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    parseISO
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchBookings, Booking } from '@/services/api';
import { Badge } from '@/components/ui/badge';

export const CalendarView = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());

    useEffect(() => {
        loadBookings();
    }, [currentMonth]);

    const loadBookings = async () => {
        setLoading(true);
        try {
            const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
            const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
            const data = await fetchBookings({ start_date: start, end_date: end });
            setBookings(data);
        } catch (error) {
            console.error('Failed to load bookings for calendar', error);
        } finally {
            setLoading(false);
        }
    };

    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between px-2 mb-4">
                <h3 className="text-lg font-bold text-amber-900">
                    {format(currentMonth, 'MMMM yyyy')}
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        className="p-2 hover:bg-amber-100 rounded-full transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-amber-700" />
                    </button>
                    <button
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        className="p-2 hover:bg-amber-100 rounded-full transition-colors"
                    >
                        <ChevronRight className="w-5 h-5 text-amber-700" />
                    </button>
                </div>
            </div>
        );
    };

    const renderDays = () => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return (
            <div className="grid grid-cols-7 mb-2">
                {days.map(day => (
                    <div key={day} className="text-center text-xs font-semibold text-amber-600 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const calendarDays = eachDayOfInterval({
            start: startDate,
            end: endDate,
        });

        return (
            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map(day => {
                    const dayBookings = bookings.filter(b => isSameDay(parseISO(b.booking_date), day));
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    const isSelected = isSameDay(day, selectedDate);

                    return (
                        <div
                            key={day.toString()}
                            onClick={() => setSelectedDate(day)}
                            className={`min-h-[80px] p-1 border rounded-lg transition-all cursor-pointer relative ${!isCurrentMonth ? 'bg-gray-50 text-gray-400 border-transparent' :
                                    isSelected ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-500' : 'border-amber-100 hover:border-amber-300 bg-white'
                                }`}
                        >
                            <span className={`text-xs font-medium ${isSelected ? 'text-amber-900' : ''}`}>
                                {format(day, 'd')}
                            </span>
                            <div className="mt-1 space-y-1">
                                {dayBookings.slice(0, 2).map(booking => (
                                    <div
                                        key={booking.id}
                                        className="text-[10px] p-1 rounded bg-amber-600 text-white truncate shadow-sm"
                                        title={`${booking.customer_name} - ${booking.service_name}`}
                                    >
                                        {booking.service_name}
                                    </div>
                                ))}
                                {dayBookings.length > 2 && (
                                    <div className="text-[9px] text-amber-700 font-bold pl-1">
                                        +{dayBookings.length - 2} more
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const selectedDateBookings = bookings.filter(b => isSameDay(parseISO(b.booking_date), selectedDate));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-amber-200 shadow-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                    <CardTitle className="flex items-center gap-2 text-amber-900">
                        <CalendarIcon className="w-5 h-5" />
                        Interactive Booking Calendar
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                    {renderHeader()}
                    {renderDays()}
                    {renderCells()}
                </CardContent>
            </Card>

            <Card className="border-orange-200 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
                    <CardTitle className="text-amber-900 text-lg">
                        Bookings for {format(selectedDate, 'MMM d, yyyy')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                        {selectedDateBookings.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                <Clock className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                <p>No bookings for this day</p>
                            </div>
                        ) : (
                            selectedDateBookings.map(booking => (
                                <div key={booking.id} className="p-3 rounded-xl bg-gradient-to-br from-white to-amber-50 border border-amber-100 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'} className={booking.status === 'confirmed' ? 'bg-green-500' : ''}>
                                            {booking.status}
                                        </Badge>
                                        <span className="text-xs font-bold text-amber-700">
                                            {format(parseISO(booking.booking_date), 'HH:mm')}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-amber-900 mb-1">{booking.service_name}</h4>
                                    <div className="flex items-center gap-2 text-sm text-amber-700">
                                        <User className="w-3 h-3" />
                                        <span>{booking.customer_name}</span>
                                    </div>
                                    {booking.staff_member_name && (
                                        <div className="mt-2 pt-2 border-t border-amber-100 text-xs text-amber-600 italic">
                                            Staff: {booking.staff_member_name}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
