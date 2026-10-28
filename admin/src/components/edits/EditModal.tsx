import React, { useState, useEffect } from 'react';
import type { Edit, Product } from '../../types/models';
import { slugify } from '../../lib/products';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ImageUploadField } from '../products/ImageUploadField';
import { VariantChipsInput } from '../products/VariantChipsInput';
import { api } from '../../lib/api';
import { toast } from 'sonner';

export interface EditModalProps {
  edit: Edit | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  allProducts: Product[];
}

export const EditModal: React.FC<EditModalProps> = ({
  edit,
  isOpen,
  onClose,
  onSuccess,
  allProducts,
}) => {
  const isEditing = Boolean(edit);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [slug, setSlug] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [bodyMarkdown, setBodyMarkdown] = useState('');
  const [productIds, setProductIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (edit) {
      setTitle(edit.title);
      setSubtitle(edit.subtitle || '');
      setSlug(edit.slug);
      setCoverImage(edit.coverImage || '');
      setBodyMarkdown(edit.bodyMarkdown || '');
      setProductIds(edit.productIds || []);
    } else {
      setTitle('');
      setSubtitle('');
      setSlug('');
      setCoverImage('');
      setBodyMarkdown('');
      setProductIds([]);
    }
  }, [edit, isOpen]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing) {
      setSlug(slugify(val));
    }
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
      subtitle: subtitle.trim() || undefined,
      slug: slug.trim(),
      coverImage: coverImage.trim() || undefined,
      bodyMarkdown: bodyMarkdown.trim() || undefined,
      productIds,
      publishedAt: new Date().toISOString(),
    };

    try {
      if (isEditing) {
        await api.put(`/api/admin/edits/${edit!.slug}`, payload);
        toast.success(`Updated editorial "${title}"`);
      } else {
        await api.post('/api/admin/edits', payload);
        toast.success(`Created editorial "${title}"`);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save editorial');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Editorial Drop' : 'Create Editorial Drop'}
      description="Publish curated lookbooks, fashion commentary, and seasonal drops."
      className="max-w-2xl max-h-[90vh] overflow-y-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="font-semibold uppercase tracking-wider text-muted-foreground">
              Editorial Title *
            </label>
            <Input
              placeholder="e.g. Modern Tailoring for Warm Climates"
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
              placeholder="modern-tailoring-warm-climates"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              disabled={isEditing}
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-semibold uppercase tracking-wider text-muted-foreground">
            Subtitle / Deck
          </label>
          <Input
            placeholder="A contemporary study in relaxed silhouettes and unlined linens..."
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
          />
        </div>

        {/* Cover Image */}
        <div className="space-y-1">
          <label className="font-semibold uppercase tracking-wider text-muted-foreground">
            Cover / Hero Image
          </label>
          <ImageUploadField
            images={coverImage ? [coverImage] : []}
            onChange={(imgs) => setCoverImage(imgs[0] || '')}
          />
        </div>

        {/* Body Markdown */}
        <div className="space-y-1">
          <label className="font-semibold uppercase tracking-wider text-muted-foreground">
            Editorial Article Content (Markdown)
          </label>
          <textarea
            rows={6}
            placeholder="Write your editorial article here using Markdown (# headers, **bold**, paragraphs)..."
            value={bodyMarkdown}
            onChange={(e) => setBodyMarkdown(e.target.value)}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-sm font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        {/* Linked Products */}
        <div className="space-y-1.5 pt-2 border-t">
          <label className="font-semibold uppercase tracking-wider text-muted-foreground block">
            Featured Products in this Editorial
          </label>
          <VariantChipsInput
            label=""
            placeholder="Add product slug and press Enter..."
            values={productIds}
            onChange={setProductIds}
            presets={allProducts.slice(0, 5).map((p) => ({
              label: p.name.slice(0, 15),
              items: [p.slug],
            }))}
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="default" isLoading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Publish Editorial'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
