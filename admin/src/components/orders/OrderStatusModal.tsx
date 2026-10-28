import React, { useState } from 'react';
import type { Order, OrderStatus } from '../../types/models';
import { getNextAllowedStatuses, ORDER_STATUS_LABELS } from '../../lib/orders';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { OrderStatusBadge } from './OrderStatusBadge';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';

export interface OrderStatusModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedOrder: Order) => void;
}

export const OrderStatusModal: React.FC<OrderStatusModalProps> = ({
  order,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDestructive, setConfirmDestructive] = useState(false);

  if (!order) return null;

  const allowedStatuses = getNextAllowedStatuses(order.status);
  const isDestructive = selectedStatus === 'cancelled' || selectedStatus === 'rto';

  const handleStatusSelect = (status: OrderStatus) => {
    setSelectedStatus(status);
    setConfirmDestructive(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStatus) {
      toast.error('Please select a new status');
      return;
    }

    if (isDestructive && !confirmDestructive) {
      setConfirmDestructive(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.patch<{ data: Order }>(`/api/admin/orders/${order._id}/status`, {
        status: selectedStatus,
        note: note.trim() || undefined,
      });

      toast.success(`Order ${order.ref} updated to ${ORDER_STATUS_LABELS[selectedStatus]}`);
      onSuccess(response.data);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update order status');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Update Order Status`}
      description={`Reference: ${order.ref}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
            Current Status
          </label>
          <OrderStatusBadge status={order.status} />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
            Select Next Status
          </label>
          {allowedStatuses.length === 0 ? (
            <div className="p-3 bg-muted rounded-lg text-xs text-muted-foreground">
              This order is in terminal status ({ORDER_STATUS_LABELS[order.status]}). No further status
              transitions are allowed.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {allowedStatuses.map((st) => (
                <button
                  type="button"
                  key={st}
                  onClick={() => handleStatusSelect(st)}
                  className={`p-3 rounded-lg border text-sm font-medium flex items-center justify-between transition-all ${
                    selectedStatus === st
                      ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20'
                      : 'border-input hover:bg-muted/50 text-foreground'
                  }`}
                >
                  <span>{ORDER_STATUS_LABELS[st]}</span>
                  {selectedStatus === st && <span className="text-xs">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedStatus && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Transition Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Courier tracking AWB #123456 or Customer requested cancellation"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        )}

        {isDestructive && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <p className="font-semibold">
                Confirm {ORDER_STATUS_LABELS[selectedStatus]}
              </p>
              <p className="mt-0.5 text-amber-800 dark:text-amber-300">
                Marking an order as {ORDER_STATUS_LABELS[selectedStatus]} is a terminal state.
                Please ensure this is intentional before applying.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant={isDestructive ? 'destructive' : 'default'}
            disabled={!selectedStatus || allowedStatuses.length === 0 || isSubmitting}
            isLoading={isSubmitting}
          >
            {isDestructive && !confirmDestructive
              ? `Confirm ${ORDER_STATUS_LABELS[selectedStatus]}`
              : 'Save Status'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
