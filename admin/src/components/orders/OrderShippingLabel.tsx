import React from 'react';
import type { Order } from '../../types/models';
import { formatINR, formatDateTimeIST } from '../../lib/format';

export interface OrderShippingLabelProps {
  order: Order;
}

export const OrderShippingLabel: React.FC<OrderShippingLabelProps> = ({ order }) => {
  return (
    <div
      id="shipping-label-printable"
      className="hidden print:block font-sans text-black p-4 max-w-[105mm] border-2 border-black mx-auto bg-white"
      style={{ minHeight: '148mm' }}
    >
      {/* Label Header */}
      <div className="flex items-start justify-between border-b-2 border-black pb-2 mb-2">
        <div>
          <h1 className="font-mono text-xl font-extrabold tracking-widest uppercase">
            OFFSCRIPT
          </h1>
          <p className="text-[9px] uppercase tracking-wider text-neutral-600">
            Express Courier Dispatch
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-mono font-bold uppercase border border-black px-1.5 py-0.5 rounded">
            COD SHIPMENT
          </div>
          <div className="font-mono text-[9px] mt-0.5">{order.ref}</div>
        </div>
      </div>

      {/* COD Collection Amount Callout */}
      <div className="border-2 border-black p-2 my-2 text-center bg-neutral-100">
        <div className="text-[10px] font-bold uppercase tracking-wider">
          COLLECT CASH ON DELIVERY (INR)
        </div>
        <div className="text-2xl font-black font-mono tracking-tight">
          {formatINR(order.total)}
        </div>
        <div className="text-[8px] text-neutral-600">Exact cash to be collected by delivery agent</div>
      </div>

      {/* Recipient / Delivery Address */}
      <div className="border border-black p-2.5 my-2">
        <div className="text-[9px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
          SHIP TO / DELIVERY ADDRESS:
        </div>
        <div className="text-sm font-bold">{order.customer.name}</div>
        <div className="text-xs font-semibold my-0.5">📞 {order.customer.phone}</div>
        <div className="text-xs leading-relaxed mt-1">
          <div>{order.deliveryAddress.line1}</div>
          {order.deliveryAddress.line2 && <div>{order.deliveryAddress.line2}</div>}
          {order.deliveryAddress.landmark && (
            <div className="text-[10px] italic">Landmark: {order.deliveryAddress.landmark}</div>
          )}
          <div className="font-bold text-sm mt-1">
            {order.deliveryAddress.city}, {order.deliveryAddress.state} -{' '}
            <span className="font-mono underline">{order.deliveryAddress.pincode}</span>
          </div>
        </div>
      </div>

      {/* Items Summary */}
      <div className="border border-black my-2">
        <div className="bg-neutral-200 text-[9px] font-bold px-2 py-1 border-b border-black uppercase">
          Package Contents ({order.items.length} {order.items.length === 1 ? 'item' : 'items'})
        </div>
        <div className="p-1.5 space-y-1">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center text-[10px] leading-tight">
              <div>
                <span className="font-bold">{item.title}</span>
                <span className="text-neutral-600"> ({item.brand})</span>
                {(item.selectedSize || item.selectedColor) && (
                  <div className="text-[9px] text-neutral-700">
                    {item.selectedSize && `Size: ${item.selectedSize} `}
                    {item.selectedColor && `Color: ${item.selectedColor}`}
                  </div>
                )}
              </div>
              <div className="font-mono font-bold shrink-0 ml-2">Qty: {item.quantity}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer instructions if any */}
      {order.notes && (
        <div className="border border-dashed border-black p-1.5 my-1 text-[9px]">
          <span className="font-bold">Instructions: </span>
          <span>{order.notes}</span>
        </div>
      )}

      {/* Return Address & Footer */}
      <div className="border-t border-black pt-1.5 mt-2 text-[8px] text-neutral-600 flex justify-between items-end">
        <div>
          <div className="font-bold text-[9px] text-black uppercase">Return Address:</div>
          <div>OFFSCRIPT Logistics Hub</div>
          <div>Bangalore, Karnataka - 560001</div>
        </div>
        <div className="text-right">
          <div>Date: {formatDateTimeIST(order.createdAt)}</div>
          <div className="font-mono text-[7px] text-neutral-500">REF: {order.ref}</div>
        </div>
      </div>
    </div>
  );
};
