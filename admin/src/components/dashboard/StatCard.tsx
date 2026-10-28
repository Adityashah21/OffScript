import React from 'react';
import { Card, CardContent } from '../ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  variant?: 'default' | 'warning' | 'alert' | 'success';
  isLoading?: boolean;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  subtitle,
  variant = 'default',
  isLoading = false,
  onClick,
}) => {
  const iconVariants = {
    default: 'bg-primary/10 text-primary',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    alert: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  };

  return (
    <Card
      onClick={onClick}
      className={cn(
        'transition-all shadow-sm',
        onClick && 'cursor-pointer hover:border-primary/50 hover:shadow-md'
      )}
    >
      <CardContent className="p-5 flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          {isLoading ? (
            <div className="h-8 w-24 bg-muted animate-pulse rounded" />
          ) : (
            <div className="text-2xl font-mono font-bold text-foreground tracking-tight">
              {value}
            </div>
          )}
          {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
        </div>

        <div className={cn('p-2.5 rounded-xl shrink-0', iconVariants[variant])}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
};
