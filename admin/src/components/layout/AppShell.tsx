import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  FileText,
  Mail,
  TrendingUp,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  ExternalLink,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { ApiSuccessResponse, Order } from '../../types/api';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

export const AppShell: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      localStorage.getItem('offscript_admin_theme') === 'dark' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  });

  const storeUrl = import.meta.env.VITE_STORE_URL || 'http://localhost:8080';

  // Synchronize dark mode class on root
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('offscript_admin_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('offscript_admin_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  // Poll pending orders count every 30s
  const { data: pendingData, isFetching: isRefreshingOrders } = useQuery({
    queryKey: ['pending-orders-count'],
    queryFn: async () => {
      // Backend: GET /api/admin/orders?status=pending&limit=1
      const res = await api.get<ApiSuccessResponse<Order[]>>('/api/admin/orders', {
        params: { status: 'pending', limit: 1 },
      });
      return (res as any)?.total ?? res?.meta?.total ?? res?.meta?.statusCounts?.pending ?? 0;
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  const pendingCount = pendingData ?? 0;

  const handleRefreshAll = () => {
    queryClient.invalidateQueries();
  };

  const navItems = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    {
      name: 'Orders',
      to: '/orders',
      icon: ShoppingBag,
      badge: pendingCount > 0 ? String(pendingCount) : undefined,
      badgeVariant: 'warning' as const,
    },
    { name: 'Products', to: '/products', icon: Package },
    { name: 'AI Studio', to: '/ai-studio', icon: Sparkles },
    { name: 'Collections', to: '/collections', icon: Layers },
    { name: 'Edits', to: '/edits', icon: FileText },
    { name: 'Inbox & CRM', to: '/inbox', icon: Mail },
    { name: 'Affiliate Stats', to: '/analytics', icon: TrendingUp },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between border-b px-4 py-3 bg-card sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="font-mono text-base font-bold tracking-widest uppercase">
            OFFSCRIPT
          </span>
          <span className="text-[10px] font-mono uppercase bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
            ADMIN
          </span>
        </div>

        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <Badge variant="warning" className="animate-pulse">
              {pendingCount} Pending
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-8 w-8"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="h-8 w-8"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Mobile Slide-out Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-64 max-w-[80vw] h-full bg-card p-5 flex flex-col border-r shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b">
              <span className="font-mono font-bold tracking-widest uppercase">OFFSCRIPT</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && <Badge variant={item.badgeVariant}>{item.badge}</Badge>}
                  </NavLink>
                );
              })}
            </nav>

            <div className="pt-4 border-t space-y-2">
              <a
                href={storeUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>View Storefront</span>
              </a>
              <div className="px-3 py-1 text-xs text-muted-foreground truncate">
                {user?.email}
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogout}
                className="w-full justify-start gap-2 text-xs"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r bg-card shrink-0 min-h-screen sticky top-0 h-screen">
        <div className="p-5 border-b flex items-center justify-between">
          <div>
            <div className="font-mono text-lg font-bold tracking-widest uppercase">OFFSCRIPT</div>
            <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
              Admin Console
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </div>
                {item.badge && <Badge variant={item.badgeVariant}>{item.badge}</Badge>}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t bg-muted/30 space-y-2">
          <div className="flex items-center justify-between px-2 text-xs text-muted-foreground">
            <span className="truncate max-w-[130px]" title={user?.email}>
              {user?.email}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefreshAll}
              disabled={isRefreshingOrders}
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              title="Refresh all data"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isRefreshingOrders && 'animate-spin')} />
            </Button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <a
              href={storeUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md border border-input text-xs font-medium text-foreground hover:bg-accent transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              <span>Store</span>
            </a>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="px-2.5 text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/30"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
