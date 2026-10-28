import React, { useState, useEffect } from 'react';
import type { Collection, CollectionRule, Product } from '../../types/models';
import { slugify } from '../../lib/products';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ImageUploadField } from '../products/ImageUploadField';
import { VariantChipsInput } from '../products/VariantChipsInput';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { toast } from 'sonner';

export interface CollectionModalProps {
  collection: Collection | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  allProducts: Product[];
}

export const CollectionModal: React.FC<CollectionModalProps> = ({
  collection,
  isOpen,
  onClose,
  onSuccess,
  allProducts,
}) => {
  const isEditing = Boolean(collection);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [heroImage, setHeroImage] = useState('');
  const [isCurated, setIsCurated] = useState(false);
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [rules, setRules] = useState<CollectionRule[]>([]);
  const [pinnedProductIds, setPinnedProductIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (collection) {
      setTitle(collection.title || collection.name || '');
      setSlug(collection.slug);
      setDescription(collection.description || '');
      setHeroImage(collection.heroImage || '');
      setIsCurated(collection.isCurated || false);
      setSortOrder(collection.sortOrder || 0);
      setRules(collection.rules || []);
      setPinnedProductIds(collection.pinnedProductIds || []);
    } else {
      setTitle('');
      setSlug('');
      setDescription('');
      setHeroImage('');
      setIsCurated(false);
      setSortOrder(0);
      setRules([]);
      setPinnedProductIds([]);
    }
  }, [collection, isOpen]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing) {
      setSlug(slugify(val));
    }
  };

  const handleAddRule = () => {
    setRules([...rules, { field: 'category', operator: 'eq', value: 'Tops' }]);
  };

  const handleRemoveRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const handleRuleChange = (index: number, key: keyof CollectionRule, val: any) => {
    const updated = [...rules];
    updated[index] = { ...updated[index], [key]: val };
    setRules(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) {
      toast.error('Title and slug are required');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      description: description.trim() || undefined,
      heroImage: heroImage.trim() || undefined,
      isCurated,
      sortOrder: Number(sortOrder) || 0,
      rules,
      pinnedProductIds,
    };

    try {
      if (isEditing) {
        await api.put(`/api/admin/collections/${collection!.slug}`, payload);
        toast.success(`Updated collection "${title}"`);
      } else {
        await api.post('/api/admin/collections', payload);
        toast.success(`Created collection "${title}"`);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save collection');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Collection' : 'Create Collection'}
      description="Configure dynamic matching rules, editorial placements, and display metadata."
      className="max-w-2xl max-h-[90vh] overflow-y-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="font-semibold uppercase tracking-wider text-muted-foreground">
              Collection Title *
            </label>
            <Input
              placeholder="e.g. Minimalist Summer Essentials"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold uppercase tracking-wider text-muted-foreground">
              URL Slug *
            </label>
            <Input
              placeholder="minimalist-summer-essentials"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              disabled={isEditing}
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-semibold uppercase tracking-wider text-muted-foreground">
            Description
          </label>
          <textarea
            rows={2}
            placeholder="Editorial blurb about this curated drop or collection..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        {/* Hero Image */}
        <div className="space-y-1">
          <label className="font-semibold uppercase tracking-wider text-muted-foreground">
            Hero Cover Image (URL or Upload)
          </label>
          <ImageUploadField
            images={heroImage ? [heroImage] : []}
            onChange={(imgs) => setHeroImage(imgs[0] || '')}
          />
        </div>

        {/* Rules Builder */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold uppercase tracking-wider text-muted-foreground">
                Automatic Matching Rules
              </span>
              <p className="text-[11px] text-muted-foreground">
                Products matching these rules are automatically indexed in this collection.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddRule}
              className="text-xs h-7 gap-1"
            >
              <Plus className="h-3 w-3" /> Add Rule
            </Button>
          </div>

          {rules.length === 0 ? (
            <div className="p-3 border border-dashed rounded-lg text-center text-muted-foreground">
              No automatic rules configured. Collection will only display manually pinned products.
            </div>
          ) : (
            <div className="space-y-2">
              {rules.map((rule, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 border rounded-lg bg-muted/20"
                >
                  <select
                    value={rule.field}
                    onChange={(e) => handleRuleChange(idx, 'field', e.target.value)}
                    className="h-8 rounded border border-input bg-background px-2 text-xs"
                  >
                    <option value="category">Category</option>
                    <option value="brand">Brand</option>
                    <option value="gender">Gender</option>
                    <option value="tags">Tags</option>
                    <option value="price">Price</option>
                  </select>

                  <select
                    value={rule.operator}
                    onChange={(e) => handleRuleChange(idx, 'operator', e.target.value)}
                    className="h-8 rounded border border-input bg-background px-2 text-xs"
                  >
                    <option value="eq">Equals (=)</option>
                    <option value="ne">Not Equals (≠)</option>
                    <option value="in">In List</option>
                    <option value="gte">At least (≥)</option>
                    <option value="lte">At most (≤)</option>
                  </select>

                  <Input
                    placeholder="Value (e.g. Tops, Zara, 2000)"
                    value={Array.isArray(rule.value) ? rule.value.join(', ') : rule.value}
                    onChange={(e) => handleRuleChange(idx, 'value', e.target.value)}
                    className="h-8 text-xs flex-1"
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveRule(idx)}
                    className="h-8 w-8 text-destructive shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pinned Products */}
        <div className="space-y-1.5 pt-2 border-t">
          <label className="font-semibold uppercase tracking-wider text-muted-foreground block">
            Pinned Product Slugs (Prioritized at Top)
          </label>
          <VariantChipsInput
            label=""
            placeholder="Add product slug and press Enter..."
            values={pinnedProductIds}
            onChange={setPinnedProductIds}
            presets={allProducts.slice(0, 5).map((p) => ({
              label: p.name.slice(0, 15),
              items: [p.slug],
            }))}
          />
        </div>

        {/* Settings: isCurated & sortOrder */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
          <label className="flex items-center gap-2 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={isCurated}
              onChange={(e) => setIsCurated(e.target.checked)}
              className="rounded border-input h-4 w-4 text-primary"
            />
            <div>
              <span className="font-semibold text-foreground">Featured Curated Drop</span>
              <p className="text-[11px] text-muted-foreground">
                Display prominently in the storefront collections shelf
              </p>
            </div>
          </label>

          <div className="space-y-1">
            <label className="font-semibold uppercase tracking-wider text-muted-foreground">
              Display Sort Order
            </label>
            <Input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              placeholder="0"
              className="h-8"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="default" isLoading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Create Collection'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
