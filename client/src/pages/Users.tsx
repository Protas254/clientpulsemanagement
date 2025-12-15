import { useState, useEffect } from "react";
import { fetchUsers } from "../services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { AppLayout } from "@/components/layout/AppLayout";

interface User {
    id: number;
    username: string;
    email: string;
}

const Users = () => {
    const [users, setUsers] = useState<User[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await fetchUsers();
            setUsers(data);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load users",
                variant: "destructive",
            });
        }
    };

    return (
        <AppLayout title="Users" subtitle="View registered users">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {users.map((user) => (
                        <Card key={user.id}>
                            <CardHeader>
                                <CardTitle>{user.username}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-500 mb-2">{user.email}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
};

export default Users;
