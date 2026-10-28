import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Layers,
  Edit,
  Trash2,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  Pin,
} from 'lucide-react';
import { api } from '../lib/api';
import type { Collection, Product } from '../types/api';
import { CollectionModal } from '../components/collections/CollectionModal';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Modal } from '../components/ui/modal';
import { toast } from 'sonner';

export const Collections: React.FC = () => {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. Fetch collections: GET /api/admin/collections
  const {
    data: collections = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery<Collection[]>({
    queryKey: ['admin-collections'],
    queryFn: async () => {
      const res = await api.get<Collection[]>('/api/admin/collections');
      return res || [];
    },
  });

  // 2. Fetch products for pinned presets
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

  const filteredCollections = collections.filter((c) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      (c.title || c.name || '').toLowerCase().includes(term) ||
      c.slug.toLowerCase().includes(term) ||
      (c.description || '').toLowerCase().includes(term)
    );
  });

  const handleOpenCreate = () => {
    setSelectedCollection(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (col: Collection) => {
    setSelectedCollection(col);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!collectionToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/admin/collections/${collectionToDelete.slug}`);
      toast.success(`Deleted collection "${collectionToDelete.title || collectionToDelete.name}"`);
      setCollectionToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['admin-collections'] });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete collection');
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
          <h1 className="text-2xl font-bold tracking-tight">Collections</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Organize the storefront into thematic drops, rule-based categories, and editorial edits.
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
            <span>Create Collection</span>
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-card p-3 rounded-xl border max-w-sm">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Search collections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {/* Collections Grid / List */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
          <div className="animate-spin h-7 w-7 border-2 border-primary border-t-transparent rounded-full mb-3" />
          <span className="text-xs uppercase tracking-wider font-mono">Loading collections...</span>
        </div>
      ) : filteredCollections.length === 0 ? (
        <div className="border border-dashed rounded-xl p-12 text-center">
          <Layers className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-semibold text-base">No collections found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto mb-4">
            Create dynamic collections with category, brand, or tag rules to curate pieces for buyers.
          </p>
          <Button size="sm" variant="default" onClick={handleOpenCreate} className="text-xs">
            <Plus className="h-3.5 w-3.5 mr-1" /> Create Collection
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCollections.map((col) => {
            const title = col.title || col.name || 'Untitled';
            const rulesCount = col.rules?.length || 0;
            const pinnedCount = col.pinnedProductIds?.length || 0;

            return (
              <div
                key={col.slug}
                className="border rounded-xl bg-card overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  {/* Hero Image or Placeholder */}
                  <div className="relative aspect-[16/9] w-full bg-muted overflow-hidden">
                    {col.heroImage ? (
                      <img
                        src={col.heroImage}
                        alt={title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                        <Layers className="h-8 w-8" />
                      </div>
                    )}

                    <div className="absolute top-2 left-2 flex gap-1">
                      {col.isCurated && (
                        <Badge variant="warning" className="text-[10px] font-mono shadow">
                          CURATED
                        </Badge>
                      )}
                    </div>

                    <div className="absolute bottom-2 right-2 bg-background/90 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-mono text-foreground font-semibold">
                      /{col.slug}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold text-base text-foreground line-clamp-1">
                      {title}
                    </h3>
                    {col.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {col.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 pt-2 border-t text-[11px] text-muted-foreground">
                      <span className="bg-muted px-2 py-0.5 rounded">
                        {rulesCount} matching {rulesCount === 1 ? 'rule' : 'rules'}
                      </span>
                      {pinnedCount > 0 && (
                        <span className="bg-muted px-2 py-0.5 rounded flex items-center gap-1">
                          <Pin className="h-2.5 w-2.5" />
                          <span>{pinnedCount} pinned</span>
                        </span>
                      )}
                      {typeof col.productCount === 'number' && (
                        <span className="bg-muted px-2 py-0.5 rounded font-mono">
                          {col.productCount} products
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-3 border-t bg-muted/20 flex items-center justify-between">
                  <a
                    href={`${storeUrl}/collections/${col.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>View Store</span>
                  </a>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(col)}
                      className="h-7 text-xs"
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCollectionToDelete(col)}
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

      {/* Create / Edit Modal */}
      <CollectionModal
        collection={selectedCollection}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['admin-collections'] })}
        allProducts={allProducts}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(collectionToDelete)}
        onClose={() => setCollectionToDelete(null)}
        title="Delete Collection"
        description="Are you sure you want to delete this collection?"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg text-red-900 dark:text-red-200 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold">{collectionToDelete?.title || collectionToDelete?.name}</p>
              <p className="mt-0.5">
                The collection page and rules will be deleted. Individual products linked to this collection
                will remain in the store catalog.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCollectionToDelete(null)}
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
              Delete Collection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
