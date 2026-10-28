import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { DayDataPoint } from '../../lib/dashboard';
import { formatINR } from '../../lib/format';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { TrendingUp } from 'lucide-react';

export interface OrdersChartProps {
  data: DayDataPoint[];
  isLoading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const orders = payload.find((p: any) => p.dataKey === 'ordersCount')?.value ?? 0;
    const amount = payload.find((p: any) => p.dataKey === 'codAmount')?.value ?? 0;

    return (
      <div className="bg-popover border border-border p-3 rounded-lg shadow-xl text-xs space-y-1">
        <p className="font-semibold text-foreground">{label}</p>
        <p className="text-muted-foreground flex items-center justify-between gap-4">
          <span>Orders:</span>
          <span className="font-mono font-bold text-foreground">{orders}</span>
        </p>
        <p className="text-muted-foreground flex items-center justify-between gap-4">
          <span>COD Value:</span>
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {formatINR(amount)}
          </span>
        </p>
      </div>
    );
  }
  return null;
};

export const OrdersChart: React.FC<OrdersChartProps> = ({ data, isLoading }) => {
  const totalPeriodOrders = data.reduce((sum, d) => sum + d.ordersCount, 0);
  const totalPeriodRevenue = data.reduce((sum, d) => sum + d.codAmount, 0);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b">
        <div>
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> 14-Day Orders & Revenue Trend
          </CardTitle>
          <CardDescription className="text-xs">
            Daily order volume and cash-on-delivery demand in Indian Standard Time
          </CardDescription>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div>
            <span className="text-muted-foreground">Period Orders: </span>
            <span className="font-bold text-foreground">{totalPeriodOrders}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Period COD: </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {formatINR(totalPeriodRevenue)}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground text-xs font-mono">
            Loading trend data...
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#888888"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="ordersCount"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#ordersGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
