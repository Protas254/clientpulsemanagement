import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    fetchContactMessages,
    deleteContactMessage,
    markContactMessageAsRead,
    ContactMessage
} from '@/services/api';
import { format } from 'date-fns';
import { Mail, Phone, User, Calendar, Trash2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export default function ContactMessages() {
    const navigate = useNavigate();

    // Redirect to new Inbox
    useEffect(() => {
        navigate('/inbox');
    }, [navigate]);

    return null;
}
