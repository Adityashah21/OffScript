import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  ExternalLink,
  ShoppingBag,
  MousePointerClick,
  Store,
  RefreshCw,
} from 'lucide-react';
import { api } from '../lib/api';
import type { Product } from '../types/api';
import { StatCard } from '../components/dashboard/StatCard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface AffiliateStatsResponse {
  totalClicks: number;
  byProduct: { productSlug: string; retailer: string; clicks: number }[];
  byDay: { date: string; clicks: number }[];
}

export const Analytics: React.FC = () => {
  // 1. Fetch affiliate stats: GET /api/admin/stats/affiliate-clicks
  const {
    data: stats,
    isLoading: isLoadingStats,
    isFetching: isFetchingStats,
    refetch: refetchStats,
  } = useQuery<AffiliateStatsResponse>({
    queryKey: ['admin-affiliate-stats'],
    queryFn: async () => {
      const res = await api.get<AffiliateStatsResponse>('/api/admin/stats/affiliate-clicks');
      return res;
    },
  });

  // 2. Fetch products to resolve names and imagery
  const { data: productsData } = useQuery<{ items: Product[] }>({
    queryKey: ['products-catalog-brief'],
    queryFn: async () => {
      const res = await api.get<{ items: Product[] }>('/api/admin/products', {
        params: { limit: 100 },
      });
      return res;
    },
  });

  const productsMap = useMemo(() => {
    const map = new Map<string, Product>();
    productsData?.items?.forEach((p) => map.set(p.slug, p));
    return map;
  }, [productsData]);

  const totalClicks = stats?.totalClicks || 0;
  const byProduct = stats?.byProduct || [];
  const byDay = stats?.byDay || [];

  // Top retailer computation
  const topRetailer = useMemo(() => {
    if (byProduct.length === 0) return '—';
    const counts: Record<string, number> = {};
    byProduct.forEach((p) => {
      const ret = p.retailer || 'Unknown';
      counts[ret] = (counts[ret] || 0) + p.clicks;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || '—';
  }, [byProduct]);

  // Formatted chart data
  const chartData = useMemo(() => {
    return byDay.map((d) => {
      const dateParts = d.date.split('-');
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
      const month = monthNames[parseInt(dateParts[1], 10) - 1] || dateParts[1];
      const day = dateParts[2];

      return {
        date: d.date,
        label: `${day} ${month}`,
        clicks: d.clicks,
      };
    });
  }, [byDay]);

  const storeUrl = import.meta.env.VITE_STORE_URL || 'http://localhost:8080';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Affiliate Performance</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track customer outbound referral clicks and partner retailer demand.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchStats()}
            disabled={isFetchingStats}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetchingStats ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Affiliate Referrals"
          value={totalClicks}
          icon={MousePointerClick}
          subtitle="Outbound clicks to partner stores"
          isLoading={isLoadingStats}
        />

        <StatCard
          title="Top Partner Retailer"
          value={topRetailer}
          icon={Store}
          subtitle="Highest referrer volume"
          isLoading={isLoadingStats}
        />

        <StatCard
          title="Active Tracked Pieces"
          value={byProduct.length}
          icon={TrendingUp}
          subtitle="Products receiving buyer interest"
          isLoading={isLoadingStats}
        />
      </div>

      {/* 30-Day Click Trend Bar Chart */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2 border-b">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> 30-Day Outbound Referral Activity
          </CardTitle>
          <CardDescription className="text-xs">
            Daily outbound customer clicks from product recommendation cards
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoadingStats ? (
            <div className="h-56 flex items-center justify-center text-xs text-muted-foreground font-mono">
              Loading click metrics...
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-center text-xs text-muted-foreground">
              <MousePointerClick className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <span>No affiliate click activity recorded in the last 30 days.</span>
            </div>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
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
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-popover border p-2.5 rounded-lg shadow-lg text-xs space-y-1">
                            <p className="font-semibold">{label}</p>
                            <p className="text-muted-foreground">
                              Clicks: <span className="font-bold text-foreground font-mono">{payload[0].value}</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="clicks" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Clicked Affiliate Products Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Top Clicked Affiliate Products
          </CardTitle>
          <CardDescription className="text-xs">
            Ranked by total customer outbound clicks to merchant checkout
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingStats ? (
            <div className="py-12 text-center text-xs text-muted-foreground font-mono">
              Loading rankings...
            </div>
          ) : byProduct.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No product referral clicks recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3 w-10 text-center">Rank</th>
                    <th className="p-3">Product</th>
                    <th className="p-3">Brand & Retailer</th>
                    <th className="p-3 text-right">Referral Clicks</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {byProduct.map((item, idx) => {
                    const resolved = productsMap.get(item.productSlug);
                    const name = resolved?.name || item.productSlug;
                    const brand = resolved?.brand || '—';
                    const mainImg = resolved?.images?.[0];

                    return (
                      <tr key={item.productSlug} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 text-center font-mono font-bold text-muted-foreground">
                          #{idx + 1}
                        </td>

                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-12 rounded border bg-muted overflow-hidden shrink-0">
                              {mainImg ? (
                                <img
                                  src={mainImg}
                                  alt={name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                                  <ShoppingBag className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-foreground line-clamp-1">{name}</div>
                              <div className="font-mono text-[10px] text-muted-foreground lowercase">
                                /{item.productSlug}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="font-medium text-foreground">{brand}</div>
                          <Badge variant="secondary" className="text-[10px] px-1 py-0 mt-0.5">
                            {item.retailer}
                          </Badge>
                        </td>

                        <td className="p-3 text-right">
                          <div className="font-mono font-bold text-sm text-foreground">
                            {item.clicks}
                          </div>
                          <div className="text-[10px] text-muted-foreground">outbound visits</div>
                        </td>

                        <td className="p-3 text-right">
                          <a
                            href={`${storeUrl}/products/${item.productSlug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>View</span>
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
