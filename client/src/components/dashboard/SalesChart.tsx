import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { monthlySalesData } from '@/data/mockData';

export function SalesChart() {
  return (
    <div className="bg-card rounded-xl border border-border p-6 animate-fade-in">
      <div className="mb-6">
        <h3 className="font-display text-lg font-semibold text-foreground">Monthly Sales</h3>
        <p className="text-sm text-muted-foreground">Revenue trend over the year</p>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={monthlySalesData}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(35, 60%, 50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(35, 60%, 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
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
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(30, 20%, 99%)',
                border: '1px solid hsl(30, 20%, 88%)',
                borderRadius: '8px',
                boxShadow: '0 4px 20px -4px hsl(25, 50%, 18% / 0.15)'
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Sales']}
            />
            <Area 
              type="monotone" 
              dataKey="sales" 
              stroke="hsl(35, 60%, 50%)" 
              strokeWidth={2}
              fill="url(#salesGradient)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
