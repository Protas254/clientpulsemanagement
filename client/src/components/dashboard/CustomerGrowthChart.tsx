import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { customerGrowthData } from '@/data/mockData';

export function CustomerGrowthChart() {
  return (
    <div className="bg-card rounded-xl border border-border p-6 animate-fade-in">
      <div className="mb-6">
        <h3 className="font-display text-lg font-semibold text-foreground">Customer Growth</h3>
        <p className="text-sm text-muted-foreground">Distribution by status</p>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={customerGrowthData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 20%, 88%)" />
            <XAxis 
              dataKey="month" 
              stroke="hsl(25, 15%, 45%)" 
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="hsl(25, 15%, 45%)" 
              fontSize={12}
              tickLine={false}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(30, 20%, 99%)',
                border: '1px solid hsl(30, 20%, 88%)',
                borderRadius: '8px',
                boxShadow: '0 4px 20px -4px hsl(25, 50%, 18% / 0.15)'
              }}
            />
            <Legend />
            <Bar dataKey="active" fill="hsl(25, 45%, 25%)" radius={[4, 4, 0, 0]} name="Active" />
            <Bar dataKey="vip" fill="hsl(35, 60%, 50%)" radius={[4, 4, 0, 0]} name="VIP" />
            <Bar dataKey="inactive" fill="hsl(30, 30%, 75%)" radius={[4, 4, 0, 0]} name="Inactive" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
