import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Save,
  ShoppingBag,
  ExternalLink,
  Info,
  AlertCircle,
  Eye,
  Sparkles,
} from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { Product, Collection } from '../types/api';
import {
  PRODUCT_CATEGORIES,
  PRODUCT_GENDERS,
  SIZE_PRESETS,
  COLOR_PRESETS,
  slugify,
  productFormSchema,
  type ProductFormValues,
} from '../lib/products';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { ImageUploadField } from '../components/products/ImageUploadField';
import { VariantChipsInput } from '../components/products/VariantChipsInput';
import { ProductPreviewCard } from '../components/products/ProductPreviewCard';
import { AiModelStudioModal } from '../components/products/AiModelStudioModal';
import { AiModelTryonSection } from '../components/products/AiModelTryonSection';
import { toast } from 'sonner';

export const ProductForm: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // in routes: /products/:id/edit
  const [searchParams] = useSearchParams();
  const duplicateFromSlug = searchParams.get('duplicateFrom');

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isEditMode = Boolean(id);
  const targetSlug = id || duplicateFromSlug;

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEditMode);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isAiStudioOpen, setIsAiStudioOpen] = useState(false);

  // Fetch available collections for multi-select
  const { data: collections = [] } = useQuery<Collection[]>({
    queryKey: ['admin-collections'],
    queryFn: async () => {
      const res = await api.get<Collection[]>('/api/admin/collections');
      return res || [];
    },
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    watch,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      category: 'Tops',
      subcategory: '',
      gender: 'unisex',
      retailer: 'OFFSCRIPT',
      brand: 'OFFSCRIPT',
      price: 1499,
      originalPrice: undefined,
      currency: 'INR',
      images: [],
      availableSizes: ['S', 'M', 'L'],
      availableColors: ['Black'],
      tags: [],
      collectionIds: [],
      affiliateUrl: null,
      purchaseMode: 'affiliate',
      codEnabled: false,
      shippingCharge: 0,
      inStock: true,
      isFeatured: false,
      isNew: true,
      isEditorsPick: false,
      material: '',
      fit: '',
      lastUpdatedAt: new Date().toISOString(),
    },
  });

  const watchedValues = watch();
  const watchedPurchaseMode = watch('purchaseMode');
  const watchedName = watch('name');

  // Auto-generate slug from name if not manually edited and not edit mode
  useEffect(() => {
    if (!slugManuallyEdited && !isEditMode && watchedName) {
      setValue('slug', slugify(watchedName), { shouldValidate: true });
    }
  }, [watchedName, slugManuallyEdited, isEditMode, setValue]);

  // Check for prefilled images from AI Studio
  useEffect(() => {
    if (!isEditMode) {
      try {
        const prefilled = sessionStorage.getItem('offscript_prefill_images');
        if (prefilled) {
          const urls = JSON.parse(prefilled);
          if (Array.isArray(urls) && urls.length > 0) {
            setValue('images', urls, { shouldDirty: true, shouldValidate: true });
            sessionStorage.removeItem('offscript_prefill_images');
            toast.success(`Loaded ${urls.length} model angle(s) from AI Studio!`);
          }
        }
      } catch {}
    }
  }, [isEditMode, setValue]);

  // Load existing product if edit mode or duplicate mode
  const { data: existingProduct, isLoading: isLoadingProduct } = useQuery<Product>({
    queryKey: ['product', targetSlug],
    queryFn: async () => {
      const res = await api.get<Product>(`/api/admin/products/${targetSlug}`);
      return res;
    },
    enabled: Boolean(targetSlug),
  });

  useEffect(() => {
    if (existingProduct) {
      reset({
        name: duplicateFromSlug ? `${existingProduct.name} (Copy)` : existingProduct.name,
        slug: duplicateFromSlug ? '' : existingProduct.slug,
        description: existingProduct.description,
        category: existingProduct.category,
        subcategory: existingProduct.subcategory,
        gender: existingProduct.gender,
        retailer: existingProduct.retailer,
        brand: existingProduct.brand,
        price: existingProduct.price,
        originalPrice: existingProduct.originalPrice || undefined,
        currency: 'INR',
        images: existingProduct.images || [],
        availableSizes: existingProduct.availableSizes || [],
        availableColors: existingProduct.availableColors || [],
        tags: existingProduct.tags || [],
        collectionIds: existingProduct.collectionIds || [],
        affiliateUrl: existingProduct.affiliateUrl || null,
        purchaseMode: existingProduct.purchaseMode,
        codEnabled: existingProduct.codEnabled,
        shippingCharge: existingProduct.shippingCharge || 0,
        inStock: existingProduct.inStock,
        isFeatured: existingProduct.isFeatured || false,
        isNew: existingProduct.isNew || false,
        isEditorsPick: existingProduct.isEditorsPick || false,
        material: existingProduct.material || '',
        fit: existingProduct.fit || '',
        lastUpdatedAt: new Date().toISOString(),
      });
      if (duplicateFromSlug) {
        setSlugManuallyEdited(false);
      }
    }
  }, [existingProduct, duplicateFromSlug, reset]);

  // Switch purchase mode handler enforcing invariant
  const handlePurchaseModeChange = (mode: 'affiliate' | 'authorized_cod') => {
    setValue('purchaseMode', mode, { shouldValidate: true, shouldDirty: true });
    setValue('codEnabled', mode === 'authorized_cod', { shouldValidate: true, shouldDirty: true });
  };

  // Warn on unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const storeUrl = import.meta.env.VITE_STORE_URL || 'http://localhost:8080';

  const onSubmit = async (values: ProductFormValues) => {
    setApiError(null);

    // Invariant guard check
    const payload = {
      ...values,
      codEnabled: values.purchaseMode === 'authorized_cod',
      lastUpdatedAt: new Date().toISOString(),
    };

    try {
      if (isEditMode) {
        // PUT /api/admin/products/:slug
        await api.put(`/api/admin/products/${id}`, payload);
        toast.success(
          <span>
            Product updated!{' '}
            <a
              href={`${storeUrl}/products/${values.slug}`}
              target="_blank"
              rel="noreferrer"
              className="underline font-semibold ml-1"
            >
              View on store
            </a>
          </span>
        );
      } else {
        // POST /api/admin/products
        await api.post('/api/admin/products', payload);
        toast.success(
          <span>
            Product created!{' '}
            <a
              href={`${storeUrl}/products/${values.slug}`}
              target="_blank"
              rel="noreferrer"
              className="underline font-semibold ml-1"
            >
              View on store
            </a>
          </span>
        );
      }

      queryClient.invalidateQueries({ queryKey: ['products'] });
      navigate('/products');
    } catch (err: any) {
      if (err instanceof ApiError && err.statusCode === 409) {
        setApiError(`The slug "${values.slug}" is already in use by another product.`);
        toast.error('Slug collision: Please change the product slug.');
      } else {
        setApiError(err?.message || 'Failed to save product.');
        toast.error(err?.message || 'Error saving product');
      }
    }
  };

  if (isLoadingProduct) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-muted-foreground">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mb-3" />
        <span className="font-mono text-xs uppercase tracking-wider">Loading product data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div>
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Products
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditMode ? `Edit Product: ${existingProduct?.name || ''}` : 'Add New Product'}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure product catalog entry, imagery, pricing invariants, and fulfillment modes.
          </p>
        </div>
      </div>

      {apiError && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      {/* AI Try-On Studio Top Spotlight Station */}
      <div className="p-4 rounded-xl border-2 border-amber-500/50 bg-gradient-to-r from-amber-500/10 via-primary/5 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-1.5">
                AI Virtual Model Try-On Studio
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold border border-amber-500/30">
                Gemini 2.0 + Imagen 3
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Have your own model's picture? Upload it alongside your garment flatlay to auto-generate 4 high-fashion catalog angles (Front, 45° Side, Back, Detail).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const el = document.getElementById('ai-model-studio-card');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className="text-xs font-mono gap-1.5 border-amber-500/40 text-foreground hover:bg-amber-500/10"
          >
            Scroll to Studio ↓
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => setIsAiStudioOpen(true)}
            className="text-xs font-mono gap-1.5 bg-amber-500 hover:bg-amber-600 text-black font-semibold shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Launch Studio Modal
          </Button>
        </div>
      </div>

      {/* Main Form + Live Preview Grid */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Form Sections */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Basics */}
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Product Name *
                    </label>
                    <Input
                      placeholder="e.g. Oversized Linen Camp Shirt"
                      {...register('name')}
                      error={errors.name?.message}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      URL Slug *
                    </label>
                    <Input
                      placeholder="oversized-linen-camp-shirt"
                      {...register('slug', {
                        onChange: () => setSlugManuallyEdited(true),
                      })}
                      error={errors.slug?.message}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Brand *
                    </label>
                    <Input
                      placeholder="e.g. OFFSCRIPT Studio, Zara, etc."
                      {...register('brand')}
                      error={errors.brand?.message}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Retailer / Source *
                    </label>
                    <Input
                      placeholder="e.g. OFFSCRIPT, Farfetch, Myntra"
                      {...register('retailer')}
                      error={errors.retailer?.message}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Description *
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Editorial product description, styling notes, and highlights..."
                    {...register('description')}
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  {errors.description && (
                    <p className="text-xs text-destructive">{errors.description.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 2. Classification */}
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Classification & Gender
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Category *
                    </label>
                    <select
                      {...register('category')}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {PRODUCT_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="text-xs text-destructive">{errors.category.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Subcategory *
                    </label>
                    <Input
                      placeholder="e.g. Linen Shirts, Sneakers"
                      {...register('subcategory')}
                      error={errors.subcategory?.message}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Gender *
                    </label>
                    <select
                      {...register('gender')}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {PRODUCT_GENDERS.map((g) => (
                        <option key={g} value={g}>
                          {g.charAt(0).toUpperCase() + g.slice(1)}
                        </option>
                      ))}
                    </select>
                    {errors.gender && (
                      <p className="text-xs text-destructive">{errors.gender.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3. Pricing */}
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Pricing (INR)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Selling Price (₹) *
                    </label>
                    <Input
                      type="number"
                      placeholder="1499"
                      {...register('price')}
                      error={errors.price?.message}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Original Price (₹ Optional - must be &gt; Price)
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g. 2999"
                      {...register('originalPrice')}
                      error={errors.originalPrice?.message}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 4. Purchase Mode & Fulfillment */}
            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Purchase Mode & Fulfillment (Strict Invariant)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {/* Mode Radios */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    onClick={() => handlePurchaseModeChange('affiliate')}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${
                      watchedPurchaseMode === 'affiliate'
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-input hover:bg-muted/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="mode-select"
                      checked={watchedPurchaseMode === 'affiliate'}
                      onChange={() => handlePurchaseModeChange('affiliate')}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <ExternalLink className="h-3.5 w-3.5" /> Affiliate Link
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Redirects customers to the brand or external marketplace. COD is disabled.
                      </p>
                    </div>
                  </label>

                  <label
                    onClick={() => handlePurchaseModeChange('authorized_cod')}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${
                      watchedPurchaseMode === 'authorized_cod'
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-input hover:bg-muted/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="mode-select"
                      checked={watchedPurchaseMode === 'authorized_cod'}
                      onChange={() => handlePurchaseModeChange('authorized_cod')}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <ShoppingBag className="h-3.5 w-3.5 text-emerald-600" /> Cash on Delivery (Authorised)
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Allows customers to submit COD order requests handled directly by OFFSCRIPT.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Conditional Fields */}
                {watchedPurchaseMode === 'affiliate' ? (
                  <div className="space-y-1.5 pt-2 border-t">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Affiliate Link URL *
                    </label>
                    <Input
                      placeholder="https://retailer.com/product-link?ref=offscript"
                      {...register('affiliateUrl')}
                      error={errors.affiliateUrl?.message}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Must begin with http:// or https://. The buy button on the storefront will open this URL.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 pt-2 border-t">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      COD Shipping Charge (₹)
                    </label>
                    <Input
                      type="number"
                      placeholder="0 for Free Shipping"
                      {...register('shippingCharge')}
                      error={errors.shippingCharge?.message}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Set 0 to provide free cash-on-delivery shipping to customers.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 5. AI Virtual Model Try-On Studio */}
            <AiModelTryonSection
              productName={watch('name')}
              category={watch('category')}
              currentImages={watch('images') || []}
              onAddImages={(newUrls) => {
                const current = getValues('images') || [];
                setValue('images', [...current, ...newUrls], {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
            />

            {/* 6. Product Images Gallery */}
            <Card>
              <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Product Images Gallery *
                  </CardTitle>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAiStudioOpen(true)}
                  className="gap-1.5 border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 text-xs font-mono font-semibold"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  Launch Studio Modal
                </Button>
              </CardHeader>
              <CardContent className="pt-4">
                <Controller
                  name="images"
                  control={control}
                  render={({ field }) => (
                    <ImageUploadField
                      images={field.value || []}
                      onChange={field.onChange}
                      error={errors.images?.message}
                      onOpenAiStudio={() => setIsAiStudioOpen(true)}
                    />
                  )}
                />
              </CardContent>
            </Card>

            {/* AI Model Studio Modal */}
            <AiModelStudioModal
              isOpen={isAiStudioOpen}
              onClose={() => setIsAiStudioOpen(false)}
              productName={watch('name')}
              category={watch('category')}
              existingImages={watch('images')}
              onApplyImages={(newUrls) => {
                const current = getValues('images') || [];
                setValue('images', [...current, ...newUrls], {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
            />

            {/* 6. Variants (Sizes & Colors) */}
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Variants & Specifications
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <Controller
                  name="availableSizes"
                  control={control}
                  render={({ field }) => (
                    <VariantChipsInput
                      label="Available Sizes"
                      placeholder="Type size and press Enter (e.g. M)..."
                      values={field.value}
                      onChange={field.onChange}
                      presets={[
                        { label: 'Apparel (XS-XXL)', items: SIZE_PRESETS.apparel },
                        { label: 'Waist (28-36)', items: SIZE_PRESETS.waist },
                        { label: 'Footwear (UK 5-10)', items: SIZE_PRESETS.footwear },
                      ]}
                      clearOptionLabel="No Sizes (Accessories)"
                    />
                  )}
                />

                <Controller
                  name="availableColors"
                  control={control}
                  render={({ field }) => (
                    <VariantChipsInput
                      label="Available Colors"
                      placeholder="Type color and press Enter (e.g. Olive)..."
                      values={field.value}
                      onChange={field.onChange}
                      presets={[{ label: 'Popular Colors', items: COLOR_PRESETS }]}
                      clearOptionLabel="Clear Colors"
                    />
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Material (Optional)
                    </label>
                    <Input placeholder="e.g. 100% French Linen" {...register('material')} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Fit (Optional)
                    </label>
                    <Input placeholder="e.g. Relaxed Boxy Fit" {...register('fit')} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 7. Tags & Linked Collections */}
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Tags & Collections
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <Controller
                  name="tags"
                  control={control}
                  render={({ field }) => (
                    <VariantChipsInput
                      label="Product Tags"
                      placeholder="Add tag and press Enter (e.g. summer, minimal)..."
                      values={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />

                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                    Link to Collections
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
                    {collections.map((col) => {
                      const isSelected = watchedValues.collectionIds?.includes(col.slug);
                      return (
                        <button
                          type="button"
                          key={col.slug}
                          onClick={() => {
                            const current = watchedValues.collectionIds || [];
                            const next = isSelected
                              ? current.filter((s) => s !== col.slug)
                              : [...current, col.slug];
                            setValue('collectionIds', next, { shouldDirty: true });
                          }}
                          className={`text-xs p-2 rounded border text-left flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary font-medium'
                              : 'border-input hover:bg-muted text-muted-foreground'
                          }`}
                        >
                          <span className="truncate">{col.title || col.name}</span>
                          {isSelected && <span>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 8. Visibility & Flags */}
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Status & Editorial Flags
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('inStock')}
                      className="rounded border-input h-4 w-4 text-primary"
                    />
                    <span className="text-xs font-medium">In Stock</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('isNew')}
                      className="rounded border-input h-4 w-4 text-primary"
                    />
                    <span className="text-xs font-medium">New Drop</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('isEditorsPick')}
                      className="rounded border-input h-4 w-4 text-primary"
                    />
                    <span className="text-xs font-medium">Editor's Pick</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('isFeatured')}
                      className="rounded border-input h-4 w-4 text-primary"
                    />
                    <span className="text-xs font-medium">Featured</span>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right 1 Col: Live Storefront Preview */}
          <div className="space-y-4">
            <div className="sticky top-20 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" /> Live Storefront Preview
                </span>
                <span className="text-[10px] text-muted-foreground">Updates in real time</span>
              </div>

              <ProductPreviewCard product={watchedValues} />

              <div className="p-3 bg-muted/40 rounded-lg border text-xs text-muted-foreground leading-relaxed">
                <div className="font-semibold text-foreground flex items-center gap-1.5 mb-1">
                  <Info className="h-3.5 w-3.5" /> Editorial Invariant Rule
                </div>
                Cash on delivery is strictly toggled with purchase mode. Setting mode to COD creates
                an authorized order flow; affiliate links redirect directly to retailer product pages.
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Save Bar at the Bottom */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t p-3 sm:px-8 shadow-2xl">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              {isDirty ? (
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  ● Unsaved changes
                </span>
              ) : (
                <span>All changes saved</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate('/products')}
                disabled={isSubmitting}
                className="text-xs"
              >
                Discard
              </Button>

              <Button
                type="submit"
                variant="default"
                size="sm"
                isLoading={isSubmitting}
                className="text-xs font-semibold gap-1.5"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{isEditMode ? 'Update Product' : 'Create Product'}</span>
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
