import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Copy,
  Edit,
  Trash2,
  ExternalLink,
  Package,
  ShoppingBag,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../lib/api';
import type { Product } from '../types/api';
import { formatINR } from '../lib/format';
import { PRODUCT_CATEGORIES, PRODUCT_GENDERS } from '../lib/products';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Modal } from '../components/ui/modal';
import { toast } from 'sonner';

export const Products: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [selectedMode, setSelectedMode] = useState<string>('all');
  const [selectedStock, setSelectedStock] = useState<string>('all');
  const [page, setPage] = useState(1);
  const limit = 25;

  // Delete modal state
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch products from backend: GET /api/admin/products
  const { data, isLoading, isFetching, refetch } = useQuery<{
    items: Product[];
    total: number;
    page: number;
    limit: number;
  }>({
    queryKey: ['products', selectedCategory, selectedStock, searchTerm, page],
    queryFn: async () => {
      const params: Record<string, any> = {
        page,
        limit,
      };
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (selectedStock === 'in_stock') params.inStock = 'true';
      if (selectedStock === 'out_of_stock') params.inStock = 'false';
      if (searchTerm.trim()) params.q = searchTerm.trim();

      const res = await api.get<{
        items: Product[];
        total: number;
        page: number;
        limit: number;
      }>('/api/admin/products', { params });
      return res;
    },
  });

  const products = data?.items || [];
  const totalCount = data?.total || 0;
  const totalPages = Math.ceil(totalCount / limit) || 1;

  // Apply client-side filters for gender and purchase mode if set
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedGender !== 'all' && p.gender !== selectedGender) return false;
      if (selectedMode !== 'all' && p.purchaseMode !== selectedMode) return false;
      return true;
    });
  }, [products, selectedGender, selectedMode]);

  // Inline optimistic in-stock toggle mutation: PATCH /api/admin/products/bulk-stock
  const toggleStockMutation = useMutation({
    mutationFn: async ({ slug, inStock }: { slug: string; inStock: boolean }) => {
      return api.patch<{ success: boolean }>('/api/admin/products/bulk-stock', {
        slugs: [slug],
        inStock,
      });
    },
    onMutate: async ({ slug, inStock }) => {
      await queryClient.cancelQueries({ queryKey: ['products'] });
      const previousData = queryClient.getQueryData(['products']);

      queryClient.setQueriesData({ queryKey: ['products'] }, (old: any) => {
        if (!old?.items) return old;
        return {
          ...old,
          items: old.items.map((item: Product) =>
            item.slug === slug ? { ...item, inStock } : item
          ),
        };
      });

      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['products'], context.previousData);
      }
      toast.error('Failed to update stock status');
    },
    onSuccess: (_, { inStock }) => {
      toast.success(`Product marked as ${inStock ? 'In Stock' : 'Out of Stock'}`);
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/admin/products/${productToDelete.slug}`);
      toast.success(`Deleted product "${productToDelete.name}"`);
      setProductToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  const storeUrl = import.meta.env.VITE_STORE_URL || 'http://localhost:8080';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your fashion catalog, affiliate links, and cash-on-delivery authorized inventory.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Link to="/products/new">
            <Button variant="default" size="sm" className="gap-1.5 text-xs font-medium">
              <Plus className="h-4 w-4" />
              <span>Add Product</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-card p-3 rounded-xl border">
        {/* Search */}
        <div className="relative lg:col-span-1">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Search name, brand, slug..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="pl-9 text-xs"
          />
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All Categories</option>
            {PRODUCT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Gender Filter */}
        <div>
          <select
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All Genders</option>
            {PRODUCT_GENDERS.map((g) => (
              <option key={g} value={g}>
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Purchase Mode */}
        <div>
          <select
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All Purchase Modes</option>
            <option value="authorized_cod">Cash on Delivery (COD)</option>
            <option value="affiliate">Affiliate Link</option>
          </select>
        </div>

        {/* Stock Filter */}
        <div>
          <select
            value={selectedStock}
            onChange={(e) => {
              setSelectedStock(e.target.value);
              setPage(1);
            }}
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All Stock Statuses</option>
            <option value="in_stock">In Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
          <div className="animate-spin h-7 w-7 border-2 border-primary border-t-transparent rounded-full mb-3" />
          <span className="text-xs uppercase tracking-wider font-mono">Loading catalog...</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="border border-dashed rounded-xl p-12 text-center">
          <Package className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-semibold text-base">No products found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto mb-4">
            Try resetting your filters or add a new piece to the collection.
          </p>
          <Link to="/products/new">
            <Button size="sm" variant="default" className="text-xs">
              <Plus className="h-3.5 w-3.5 mr-1" /> Add First Product
            </Button>
          </Link>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b text-muted-foreground font-semibold">
              <tr>
                <th className="p-3 w-14">Image</th>
                <th className="p-3">Product Name & Brand</th>
                <th className="p-3">Category</th>
                <th className="p-3">Price (INR)</th>
                <th className="p-3">Purchase Mode</th>
                <th className="p-3 text-center">In Stock</th>
                <th className="p-3">Highlights</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredProducts.map((product) => {
                const mainImg = product.images?.[0];
                const isCOD = product.purchaseMode === 'authorized_cod';

                return (
                  <tr key={product.slug} className="hover:bg-muted/30 transition-colors">
                    {/* Thumbnail */}
                    <td className="p-3">
                      <div className="w-10 h-13 rounded border bg-muted overflow-hidden shrink-0">
                        {mainImg ? (
                          <img
                            src={mainImg}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                            <Package className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Name & Brand */}
                    <td className="p-3">
                      <div className="font-medium text-foreground text-sm line-clamp-1">
                        {product.name}
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground uppercase flex items-center gap-2 mt-0.5">
                        <span>{product.brand}</span>
                        <span>•</span>
                        <span className="text-[10px] lowercase text-muted-foreground/70">
                          /{product.slug}
                        </span>
                      </div>
                    </td>

                    {/* Category & Gender */}
                    <td className="p-3">
                      <div className="text-foreground">{product.category}</div>
                      <div className="text-[11px] text-muted-foreground capitalize">
                        {product.gender} • {product.subcategory}
                      </div>
                    </td>

                    {/* Price & Strikethrough */}
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-mono font-bold text-foreground">
                        {formatINR(product.price)}
                      </div>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <div className="font-mono text-[10px] text-muted-foreground line-through">
                          {formatINR(product.originalPrice)}
                        </div>
                      )}
                    </td>

                    {/* Purchase Mode */}
                    <td className="p-3 whitespace-nowrap">
                      {isCOD ? (
                        <Badge variant="success" className="text-[10px] flex items-center gap-1 w-fit">
                          <ShoppingBag className="h-3 w-3" /> COD Authorized
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] flex items-center gap-1 w-fit">
                          <ExternalLink className="h-3 w-3" /> Affiliate ({product.retailer})
                        </Badge>
                      )}
                    </td>

                    {/* In-Stock Optimistic Toggle */}
                    <td className="p-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() =>
                          toggleStockMutation.mutate({
                            slug: product.slug,
                            inStock: !product.inStock,
                          })
                        }
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          product.inStock ? 'bg-emerald-600' : 'bg-stone-300 dark:bg-stone-700'
                        }`}
                        title={product.inStock ? 'Click to mark out of stock' : 'Click to mark in stock'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            product.inStock ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </td>

                    {/* Flags / Highlights */}
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {product.isNew && (
                          <Badge variant="default" className="text-[9px] px-1 py-0">
                            NEW
                          </Badge>
                        )}
                        {product.isEditorsPick && (
                          <Badge variant="warning" className="text-[9px] px-1 py-0">
                            PICK
                          </Badge>
                        )}
                        {product.isFeatured && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0">
                            FEATURED
                          </Badge>
                        )}
                        {!product.isNew && !product.isEditorsPick && !product.isFeatured && (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {/* Duplicate */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/products/new?duplicateFrom=${product.slug}`)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="Duplicate Product"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>

                        {/* Edit */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/products/${product.slug}/edit`)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="Edit Product"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>

                        {/* Storefront View */}
                        <a
                          href={`${storeUrl}/products/${product.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded text-muted-foreground hover:text-foreground inline-flex items-center"
                          title="View on Storefront"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>

                        {/* Delete */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setProductToDelete(product)}
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          title="Delete Product"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t text-xs">
          <span className="text-muted-foreground">
            Showing page {page} of {totalPages} ({totalCount} total catalog items)
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="h-8 text-xs"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="h-8 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        title="Delete Product"
        description="Are you sure you want to permanently delete this product?"
      >
        <div className="space-y-4">
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg text-xs text-red-900 dark:text-red-200 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold">{productToDelete?.name}</p>
              <p className="mt-0.5">
                This action cannot be undone. Any customer links or collections referencing this product
                slug will no longer display it.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setProductToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteProduct}
              isLoading={isDeleting}
            >
              Delete Product
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
