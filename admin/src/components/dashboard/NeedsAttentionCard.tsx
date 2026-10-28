import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Order } from '../../types/models';
import { formatINR, getWhatsAppLink } from '../../lib/format';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { AlertCircle, CheckCircle2, Phone, MessageCircle, ArrowRight, Clock } from 'lucide-react';

export interface NeedsAttentionCardProps {
  orders: Order[];
  isLoading?: boolean;
}

export const NeedsAttentionCard: React.FC<NeedsAttentionCardProps> = ({
  orders,
  isLoading,
}) => {
  const navigate = useNavigate();

  return (
    <Card className="shadow-sm border-amber-200 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10">
      <CardHeader className="pb-3 border-b flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-200 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            Needs Attention ({orders.length})
          </CardTitle>
          <CardDescription className="text-xs text-amber-800/80 dark:text-amber-400/80">
            Pending COD orders placed over 24 hours ago awaiting owner confirmation
          </CardDescription>
        </div>

        {orders.length > 0 && (
          <Link to="/orders?status=pending">
            <Button variant="ghost" size="sm" className="text-xs h-7 gap-1 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40">
              <span>View All Pending</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        )}
      </CardHeader>

      <CardContent className="pt-3">
        {isLoading ? (
          <div className="py-6 text-center text-xs text-muted-foreground">Checking overdue orders...</div>
        ) : orders.length === 0 ? (
          <div className="py-6 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 mb-2" />
            <p className="text-xs font-semibold text-foreground">All caught up!</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              No orders are waiting past the 24-hour confirmation window.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {orders.slice(0, 4).map((order) => {
              const elapsedHours = Math.floor(
                (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60)
              );

              return (
                <div
                  key={order._id}
                  onClick={() => navigate(`/orders/${order.ref}`)}
                  className="p-3 rounded-lg border bg-card hover:bg-muted/40 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs">{order.ref}</span>
                      <Badge variant="warning" className="text-[10px] px-1.5 py-0 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        <span>Pending {elapsedHours}h</span>
                      </Badge>
                    </div>

                    <div className="text-xs font-medium text-foreground truncate">
                      {order.customer.name} • <span className="font-mono">{formatINR(order.total)}</span>
                    </div>

                    <div className="text-[11px] text-muted-foreground truncate">
                      {order.items[0]?.title}
                      {order.items.length > 1 && ` (+${order.items.length - 1} more)`}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={`tel:${order.customer.phone}`}
                      className="p-1.5 rounded-full bg-muted text-muted-foreground hover:text-foreground"
                      title="Call customer"
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </a>
                    <a
                      href={getWhatsAppLink(order.customer.phone)}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                      title="Chat on WhatsApp"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                    </a>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/orders/${order.ref}`)}
                      className="h-7 text-xs ml-1"
                    >
                      Process
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
