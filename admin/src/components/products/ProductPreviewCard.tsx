import React from 'react';
import type { ProductFormValues } from '../../lib/products';
import { formatINR } from '../../lib/format';
import { Badge } from '../ui/badge';
import { ShoppingBag, ExternalLink, Image as ImageIcon } from 'lucide-react';

export interface ProductPreviewCardProps {
  product: Partial<ProductFormValues>;
}

export const ProductPreviewCard: React.FC<ProductPreviewCardProps> = ({ product }) => {
  const mainImage = product.images?.[0];
  const price = product.price || 0;
  const originalPrice = product.originalPrice;
  const hasDiscount = Boolean(originalPrice && originalPrice > price);
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice! - price) / originalPrice!) * 100)
    : 0;

  return (
    <div className="w-full max-w-xs mx-auto border rounded-xl overflow-hidden bg-card text-card-foreground shadow-sm transition-all hover:shadow-md">
      {/* Product Image Frame */}
      <div className="relative aspect-[3/4] w-full bg-muted overflow-hidden flex items-center justify-center">
        {mainImage ? (
          <img
            src={mainImage}
            alt={product.name || 'Product preview'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground/40 gap-2 p-4 text-center">
            <ImageIcon className="h-10 w-10 stroke-1" />
            <span className="text-xs font-mono">No Image Uploaded</span>
          </div>
        )}

        {/* Badges on image */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
          {product.isNew && (
            <Badge variant="default" className="text-[10px] uppercase font-mono tracking-wider">
              New Drop
            </Badge>
          )}
          {product.isEditorsPick && (
            <Badge variant="warning" className="text-[10px] font-mono tracking-wider">
              Editor's Pick
            </Badge>
          )}
          {product.isFeatured && (
            <Badge variant="secondary" className="text-[10px] font-mono tracking-wider">
              Featured
            </Badge>
          )}
        </div>

        {/* Purchase mode overlay badge */}
        <div className="absolute bottom-2 left-2 right-2">
          {product.purchaseMode === 'authorized_cod' ? (
            <div className="bg-background/90 backdrop-blur-sm px-2 py-1 rounded text-[11px] font-semibold text-foreground flex items-center gap-1.5 shadow-sm">
              <ShoppingBag className="h-3 w-3 text-emerald-600" />
              <span>Cash on Delivery</span>
            </div>
          ) : (
            <div className="bg-background/90 backdrop-blur-sm px-2 py-1 rounded text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5 shadow-sm">
              <ExternalLink className="h-3 w-3" />
              <span>Affiliate {product.retailer ? `via ${product.retailer}` : ''}</span>
            </div>
          )}
        </div>
      </div>

      {/* Product Metadata */}
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            {product.brand || 'OFFSCRIPT BRAND'}
          </span>
          {!product.inStock && (
            <span className="text-[10px] font-bold text-destructive uppercase tracking-wider">
              Out of stock
            </span>
          )}
        </div>

        <h4 className="font-medium text-sm text-foreground line-clamp-1">
          {product.name || 'Untitled Product'}
        </h4>

        {/* Pricing */}
        <div className="flex items-baseline gap-2 pt-1">
          <span className="font-mono font-bold text-base text-foreground">
            {formatINR(price)}
          </span>
          {hasDiscount && (
            <>
              <span className="font-mono text-xs text-muted-foreground line-through">
                {formatINR(originalPrice)}
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                {discountPercent}% OFF
              </span>
            </>
          )}
        </div>

        {/* Sizes and colors pills */}
        {(product.availableSizes?.length || 0) > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {product.availableSizes?.slice(0, 5).map((size) => (
              <span
                key={size}
                className="text-[10px] px-1.5 py-0.5 rounded border text-muted-foreground font-mono"
              >
                {size}
              </span>
            ))}
            {(product.availableSizes?.length || 0) > 5 && (
              <span className="text-[10px] text-muted-foreground pt-0.5">
                +{product.availableSizes!.length - 5}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
