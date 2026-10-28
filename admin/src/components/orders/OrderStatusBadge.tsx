import React from 'react';
import type { OrderStatus } from '../../types/models';
import { ORDER_STATUS_LABELS } from '../../lib/orders';
import { cn } from '../../lib/utils';

export interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
  showDot?: boolean;
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({
  status,
  className,
  showDot = true,
}) => {
  const styles: Record<OrderStatus, { bg: string; dot: string }> = {
    pending: {
      bg: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800',
      dot: 'bg-amber-500 animate-pulse',
    },
    confirmed: {
      bg: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-800',
      dot: 'bg-blue-500',
    },
    shipped: {
      bg: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/60 dark:text-purple-200 dark:border-purple-800',
      dot: 'bg-purple-500',
    },
    delivered: {
      bg: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800',
      dot: 'bg-emerald-500',
    },
    cancelled: {
      bg: 'bg-red-100 text-red-900 border-red-300 dark:bg-red-950/60 dark:text-red-200 dark:border-red-800',
      dot: 'bg-red-500',
    },
    rto: {
      bg: 'bg-stone-200 text-stone-900 border-stone-300 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700',
      dot: 'bg-stone-500',
    },
  };

  const current = styles[status] || styles.pending;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border select-none',
        current.bg,
        className
      )}
    >
      {showDot && <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', current.dot)} />}
      <span>{ORDER_STATUS_LABELS[status] || status}</span>
    </span>
  );
};
