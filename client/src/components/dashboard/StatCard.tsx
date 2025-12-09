import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'accent';
}

export function StatCard({ title, value, icon, trend, variant = 'default' }: StatCardProps) {
  return (
    <div 
      className={cn(
        "p-6 rounded-xl border transition-all duration-300 hover:shadow-chocolate animate-fade-in",
        variant === 'default' && "bg-card border-border",
        variant === 'primary' && "gradient-chocolate text-primary-foreground border-transparent",
        variant === 'accent' && "bg-caramel/10 border-caramel/20"
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={cn(
            "text-sm font-medium mb-1",
            variant === 'primary' ? "text-primary-foreground/80" : "text-muted-foreground"
          )}>
            {title}
          </p>
          <p className={cn(
            "text-3xl font-display font-semibold",
            variant === 'primary' ? "text-primary-foreground" : "text-foreground"
          )}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {trend && (
            <p className={cn(
              "text-sm mt-2 flex items-center gap-1",
              trend.isPositive ? "text-success" : "text-destructive",
              variant === 'primary' && (trend.isPositive ? "text-success-foreground" : "text-destructive-foreground")
            )}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}% from last month</span>
            </p>
          )}
        </div>
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          variant === 'primary' ? "bg-primary-foreground/10" : "bg-secondary"
        )}>
          {icon}
        </div>
      </div>
    </div>
  );
}
