import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  FileText,
  Edit as EditIcon,
  Trash2,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  Calendar,
  Package,
} from 'lucide-react';
import { api } from '../lib/api';
import type { Edit, Product } from '../types/api';
import { formatDateIST } from '../lib/format';
import { EditModal } from '../components/edits/EditModal';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Modal } from '../components/ui/modal';
import { toast } from 'sonner';

export const Edits: React.FC = () => {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEdit, setSelectedEdit] = useState<Edit | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editToDelete, setEditToDelete] = useState<Edit | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. Fetch edits: GET /api/admin/edits
  const {
    data: edits = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery<Edit[]>({
    queryKey: ['admin-edits'],
    queryFn: async () => {
      const res = await api.get<Edit[]>('/api/admin/edits');
      return res || [];
    },
  });

  // 2. Fetch products for brief presets
  const { data: productsData } = useQuery<{ items: Product[] }>({
    queryKey: ['products-list-brief'],
    queryFn: async () => {
      const res = await api.get<{ items: Product[] }>('/api/admin/products', {
        params: { limit: 50 },
      });
      return res;
    },
  });
  const allProducts = productsData?.items || [];

  const filteredEdits = edits.filter((e) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      e.title.toLowerCase().includes(term) ||
      e.slug.toLowerCase().includes(term) ||
      (e.subtitle || '').toLowerCase().includes(term)
    );
  });

  const handleOpenCreate = () => {
    setSelectedEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Edit) => {
    setSelectedEdit(item);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!editToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/admin/edits/${editToDelete.slug}`);
      toast.success(`Deleted editorial "${editToDelete.title}"`);
      setEditToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['admin-edits'] });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete editorial');
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
          <h1 className="text-2xl font-bold tracking-tight">Editorial Drops & Edits</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Publish brand stories, styling guides, lookbooks, and curated editorial articles.
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

          <Button
            variant="default"
            size="sm"
            onClick={handleOpenCreate}
            className="gap-1.5 text-xs font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>New Editorial Drop</span>
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-card p-3 rounded-xl border max-w-sm">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Search edits and articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {/* Edits Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
          <div className="animate-spin h-7 w-7 border-2 border-primary border-t-transparent rounded-full mb-3" />
          <span className="text-xs uppercase tracking-wider font-mono">Loading articles...</span>
        </div>
      ) : filteredEdits.length === 0 ? (
        <div className="border border-dashed rounded-xl p-12 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-semibold text-base">No editorial articles found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto mb-4">
            Publish stories that inspire your audience with styling context and featured clothing pieces.
          </p>
          <Button size="sm" variant="default" onClick={handleOpenCreate} className="text-xs">
            <Plus className="h-3.5 w-3.5 mr-1" /> Create First Drop
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEdits.map((item) => {
            const productCount = item.productIds?.length || 0;

            return (
              <div
                key={item.slug}
                className="border rounded-xl bg-card overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  {/* Cover Image */}
                  <div className="relative aspect-[16/9] w-full bg-muted overflow-hidden">
                    {item.coverImage ? (
                      <img
                        src={item.coverImage}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                        <FileText className="h-8 w-8" />
                      </div>
                    )}

                    <div className="absolute bottom-2 right-2 bg-background/90 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-mono text-foreground font-semibold">
                      /{item.slug}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold text-base text-foreground line-clamp-1">
                      {item.title}
                    </h3>
                    {item.subtitle && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.subtitle}</p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDateIST(item.publishedAt || item.createdAt)}</span>
                      </span>

                      <span className="bg-muted px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                        <Package className="h-3 w-3" />
                        <span>{productCount} items</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-3 border-t bg-muted/20 flex items-center justify-between">
                  <a
                    href={`${storeUrl}/edits/${item.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>View Article</span>
                  </a>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(item)}
                      className="h-7 text-xs"
                    >
                      <EditIcon className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditToDelete(item)}
                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      <EditModal
        edit={selectedEdit}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['admin-edits'] })}
        allProducts={allProducts}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(editToDelete)}
        onClose={() => setEditToDelete(null)}
        title="Delete Editorial"
        description="Are you sure you want to permanently delete this article?"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg text-red-900 dark:text-red-200 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold">{editToDelete?.title}</p>
              <p className="mt-0.5">
                This will unpublish the editorial article and lookbook layout from the storefront.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              isLoading={isDeleting}
            >
              Delete Editorial
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
