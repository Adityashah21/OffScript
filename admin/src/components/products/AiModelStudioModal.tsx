import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Camera,
  Check,
  Copy,
  ExternalLink,
  Key,
  Layers,
  Maximize2,
  RefreshCw,
  Upload,
  User,
  X,
  ChevronDown,
  ChevronUp,
  Cloud,
  CheckCircle2,
} from 'lucide-react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { api } from '../../lib/api';
import { toast } from 'sonner';

export interface GeneratedAngle {
  angleId: 'front' | 'side_45' | 'back' | 'detail';
  angleName: string;
  cameraAngle: string;
  description: string;
  imageUrl: string;
  promptUsed: string;
}

export interface PresetModel {
  id: string;
  name: string;
  description: string;
  gender: 'male' | 'female' | 'unisex';
  thumbnailUrl: string;
}

export interface AiModelStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  category: string;
  existingImages?: string[];
  onApplyImages?: (newUrls: string[]) => void;
}

const AESTHETIC_STYLES = [
  {
    id: 'brutalist-concrete',
    label: 'Concrete Brutalist Studio',
    desc: 'Architectural cast concrete walls, moody directional shadows, raw minimalist lookbook',
  },
  {
    id: 'moody-editorial',
    label: 'Moody High-Fashion Editorial',
    desc: 'Charcoal backdrop, high contrast rim lighting, Balenciaga runway aesthetic',
  },
  {
    id: 'cyber-street',
    label: 'Cyber Brutalist Street',
    desc: 'Wet asphalt reflections, subtle monochromatic neo-noir ambient glow',
  },
  {
    id: 'daylight-minimalist',
    label: 'Daylight Warehouse Loft',
    desc: 'Natural diffused daylight, raw industrial brick & steel framing',
  },
];

const DEFAULT_PRESET_MODELS: PresetModel[] = [
  {
    id: 'preset-kai-male',
    name: 'Kai — Brutalist Male',
    description: "6'1 athletic boxy frame, fade haircut, raw architectural streetwear pose",
    gender: 'male',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 'preset-elena-female',
    name: 'Elena — Editorial Female',
    description: "5'10 high-fashion frame, slicked-back hair, striking cheekbones, architectural stance",
    gender: 'female',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 'preset-rei-unisex',
    name: 'Rei — Minimalist Unisex',
    description: 'Contemporary androgynous streetwear build, bleached crop, relaxed slouch silhouette',
    gender: 'unisex',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 'preset-marcus-heavyweight',
    name: 'Marcus — Oversized Athletic',
    description: 'Broad-shouldered masculine build, sculpted profile, styled for heavyweight drops',
    gender: 'male',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=700&q=80',
  },
];

const ANGLE_CONFIG = [
  { id: 'front' as const, label: 'Angle 1: Front Full View', desc: 'Direct eye-level frontal studio shot' },
  { id: 'side_45' as const, label: 'Angle 2: 45° Editorial Turn', desc: 'Sleeve drape & side silhouette' },
  { id: 'back' as const, label: 'Angle 3: Back View', desc: 'Back panel graphics & rear cut' },
  { id: 'detail' as const, label: 'Angle 4: Fabric Macro Detail', desc: '500 GSM weave & seam texture' },
];

export const AiModelStudioModal: React.FC<AiModelStudioModalProps> = ({
  isOpen,
  onClose,
  productName,
  category,
  existingImages = [],
  onApplyImages,
}) => {
  // Preset models & storage status
  const [presetModels, setPresetModels] = useState<PresetModel[]>(DEFAULT_PRESET_MODELS);
  const [selectedModelId, setSelectedModelId] = useState<string>('preset-kai-male');
  const [customModelUrl, setCustomModelUrl] = useState<string>('');
  const [isUploadingModel, setIsUploadingModel] = useState(false);

  // Garment image
  const [productImageUrl, setProductImageUrl] = useState<string>(existingImages[0] || '');
  const [isUploadingGarment, setIsUploadingGarment] = useState(false);

  // Settings
  const [aesthetic, setAesthetic] = useState<string>(AESTHETIC_STYLES[0].label);
  const [selectedAngles, setSelectedAngles] = useState<('front' | 'side_45' | 'back' | 'detail')[]>([
    'front',
    'side_45',
    'back',
    'detail',
  ]);

  // Gemini API Key management
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return localStorage.getItem('offscript_gemini_api_key') || '';
  });
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [hasServerKey, setHasServerKey] = useState(false);
  const [storageProvider, setStorageProvider] = useState<'cloudinary' | 'local'>('cloudinary');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [generatedImages, setGeneratedImages] = useState<GeneratedAngle[]>([]);
  const [selectedToApply, setSelectedToApply] = useState<Record<string, boolean>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Fetch presets & backend status on open
  useEffect(() => {
    if (!isOpen) return;

    if (existingImages.length > 0 && !productImageUrl) {
      setProductImageUrl(existingImages[0]);
    }

    api
      .get<{ presetModels?: PresetModel[]; hasServerKey?: boolean; storageProvider?: 'cloudinary' | 'local' }>(
        '/api/admin/ai/presets'
      )
      .then((data) => {
        if (data?.presetModels && data.presetModels.length > 0) {
          setPresetModels(data.presetModels);
        }
        if (data?.hasServerKey !== undefined) {
          setHasServerKey(data.hasServerKey);
        }
        if (data?.storageProvider) {
          setStorageProvider(data.storageProvider);
        }
      })
      .catch((err) => {
        console.warn('Could not load /api/admin/ai/presets:', err);
      });
  }, [isOpen, existingImages, productImageUrl]);

  const handleSaveApiKey = () => {
    const trimmed = geminiApiKey.trim();
    if (trimmed) {
      localStorage.setItem('offscript_gemini_api_key', trimmed);
      toast.success('Gemini API key saved to browser');
    } else {
      localStorage.removeItem('offscript_gemini_api_key');
      toast.info('Gemini API key cleared');
    }
    setShowKeyConfig(false);
  };

  const handleCustomModelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingModel(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await api.upload<{ url: string }>('/api/admin/ai/upload-model', formData);
      if (res?.url) {
        setCustomModelUrl(res.url);
        setSelectedModelId('custom');
        toast.success('Model image uploaded to cloud storage');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to upload model photo');
    } finally {
      setIsUploadingModel(false);
    }
  };

  const handleGarmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingGarment(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await api.upload<{ url: string }>('/api/admin/uploads', formData);
      if (res?.url) {
        setProductImageUrl(res.url);
        toast.success('Garment packshot uploaded');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to upload garment photo');
    } finally {
      setIsUploadingGarment(false);
    }
  };

  const toggleAngle = (id: 'front' | 'side_45' | 'back' | 'detail') => {
    if (selectedAngles.includes(id)) {
      if (selectedAngles.length === 1) {
        toast.error('Select at least one angle');
        return;
      }
      setSelectedAngles(selectedAngles.filter((a) => a !== id));
    } else {
      setSelectedAngles([...selectedAngles, id]);
    }
  };

  const handleGenerate = async () => {
    if (!productImageUrl) {
      toast.error('Please select or upload a product garment image first');
      return;
    }

    const effectiveModel = selectedModelId === 'custom' ? customModelUrl : selectedModelId;
    if (!effectiveModel) {
      toast.error('Please choose a preset model or upload a custom model image');
      return;
    }

    setIsGenerating(true);
    setGenerationStep('Analyzing model physique & garment textile cut with Gemini 2.0...');

    try {
      const payload = {
        modelImage: effectiveModel,
        productImage: productImageUrl,
        productName: productName || 'Luxury Streetwear Piece',
        category: category || 'Hoodies',
        aesthetic,
        geminiApiKey: geminiApiKey.trim() || undefined,
        angles: selectedAngles,
      };

      setGenerationStep('Synthesizing 4 angle editorial photographs with Imagen 3 & saving to Cloud CDN...');

      const response = await api.post<{
        success: boolean;
        isDemo?: boolean;
        message?: string;
        images: GeneratedAngle[];
      }>('/api/admin/ai/generate', payload);

      if (response?.images && response.images.length > 0) {
        setGeneratedImages(response.images);
        // Default select all generated images
        const initialSelected: Record<string, boolean> = {};
        response.images.forEach((img) => {
          initialSelected[img.imageUrl] = true;
        });
        setSelectedToApply(initialSelected);

        if (response.isDemo) {
          toast.info(response.message || 'Demo previews generated');
        } else {
          toast.success(`Synthesized ${response.images.length} multi-angle model shots!`);
        }
      } else {
        toast.error('No images returned from generation');
      }
    } catch (err: any) {
      console.error('Generation error:', err);
      toast.error(err?.message || 'Failed to generate try-on photos');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const handleApplyToProduct = () => {
    const urlsToApply = generatedImages
      .filter((img) => selectedToApply[img.imageUrl])
      .map((img) => img.imageUrl);

    if (urlsToApply.length === 0) {
      toast.error('Please select at least one image to apply');
      return;
    }

    if (onApplyImages) {
      onApplyImages(urlsToApply);
      toast.success(`Applied ${urlsToApply.length} model angle(s) to product images`);
      onClose();
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Image CDN URL copied to clipboard');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Model Try-On Studio"
      description="Synthesize multi-angle editorial lookbook photographs on models using Google Gemini & Imagen 3"
      className="max-w-5xl max-h-[92vh] overflow-y-auto"
    >
      <div className="space-y-6 pt-2">
        {/* Top Badges & API Key Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border bg-muted/30">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 font-mono text-[10px]">
              <Sparkles className="h-3 w-3 text-amber-500" />
              Gemini 2.0 Multimodal + Imagen 3
            </Badge>

            <Badge variant="outline" className="gap-1 font-mono text-[10px]">
              <Cloud className="h-3 w-3 text-blue-500" />
              Storage: {storageProvider === 'cloudinary' ? 'Cloudinary CDN (Permanent)' : 'Local Disk'}
            </Badge>

            {hasServerKey ? (
              <Badge variant="secondary" className="gap-1 text-[10px] bg-emerald-500/10 text-emerald-600">
                <Check className="h-2.5 w-2.5" /> Server Key Active
              </Badge>
            ) : geminiApiKey ? (
              <Badge variant="secondary" className="gap-1 text-[10px] bg-emerald-500/10 text-emerald-600">
                <Check className="h-2.5 w-2.5" /> Custom Key Loaded
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-[10px] text-amber-600 border-amber-500/30">
                Demo Mode (Add Key for Live Synthesis)
              </Badge>
            )}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowKeyConfig(!showKeyConfig)}
            className="text-xs h-7 gap-1 font-mono"
          >
            <Key className="h-3 w-3" />
            {showKeyConfig ? 'Hide API Settings' : 'Configure Gemini Key'}
            {showKeyConfig ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </div>

        {/* Collapsible Gemini API Key Settings */}
        {showKeyConfig && (
          <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Google Gemini API Key
              </span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-primary hover:underline inline-flex items-center gap-1 font-mono"
              >
                Get free API key on Google AI Studio <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="password"
                placeholder="AIzaSy..."
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                className="font-mono text-xs"
              />
              <Button type="button" size="sm" onClick={handleSaveApiKey} className="text-xs">
                Save Key
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Your key is saved locally in your browser. You can also define <code className="font-mono">GEMINI_API_KEY</code> on your Render backend server.
            </p>
          </div>
        )}

        {/* Studio Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Inputs & Controls (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Step 1: Model Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> 1. Select Model Reference
                </label>
                {selectedModelId === 'custom' && (
                  <Badge variant="outline" className="text-[10px]">
                    Custom Upload Active
                  </Badge>
                )}
              </div>

              {/* Presets Grid */}
              <div className="grid grid-cols-2 gap-2">
                {presetModels.map((p) => {
                  const isSelected = selectedModelId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedModelId(p.id)}
                      className={`relative flex flex-col items-start p-2 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'border-primary ring-1 ring-primary bg-primary/5'
                          : 'border-input hover:bg-muted/40'
                      }`}
                    >
                      <div className="w-full aspect-[4/5] rounded overflow-hidden bg-muted relative mb-2">
                        <img
                          src={p.thumbnailUrl}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5 shadow">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-semibold leading-tight">{p.name}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                        {p.description}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Model Photo Upload */}
              <div className="pt-2">
                <label className="flex items-center justify-center gap-2 p-2.5 rounded-lg border border-dashed border-input hover:border-primary/50 hover:bg-muted/30 cursor-pointer transition-colors text-xs text-muted-foreground">
                  <Upload className="h-3.5 w-3.5" />
                  <span>
                    {isUploadingModel
                      ? 'Uploading custom model...'
                      : customModelUrl
                      ? 'Change Custom Model Photo'
                      : 'Upload Custom Model Photo'}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    disabled={isUploadingModel}
                    onChange={handleCustomModelUpload}
                  />
                </label>
              </div>
            </div>

            {/* Step 2: Garment Image */}
            <div className="space-y-2 pt-2 border-t">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" /> 2. Product Garment Packshot
              </label>

              <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                {productImageUrl ? (
                  <div className="h-16 w-16 rounded overflow-hidden bg-muted border shrink-0">
                    <img
                      src={productImageUrl}
                      alt={productName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded bg-muted/60 border border-dashed flex items-center justify-center shrink-0 text-muted-foreground">
                    <Camera className="h-5 w-5 opacity-40" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{productName || 'Untitled Product'}</p>
                  <p className="text-[11px] text-muted-foreground uppercase font-mono">{category || 'Apparel'}</p>

                  <label className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline cursor-pointer mt-1">
                    <Upload className="h-3 w-3" />
                    <span>{isUploadingGarment ? 'Uploading...' : 'Choose different packshot'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={isUploadingGarment}
                      onChange={handleGarmentUpload}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Step 3: Studio Aesthetic */}
            <div className="space-y-1.5 pt-2 border-t">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                3. Studio Aesthetic & Atmosphere
              </label>
              <select
                value={aesthetic}
                onChange={(e) => setAesthetic(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {AESTHETIC_STYLES.map((style) => (
                  <option key={style.id} value={style.label}>
                    {style.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 4: Multi-Angle Selection */}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  4. Angles to Synthesize (4 Shots)
                </label>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {selectedAngles.length} selected
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {ANGLE_CONFIG.map((angle) => {
                  const isChecked = selectedAngles.includes(angle.id);
                  return (
                    <button
                      key={angle.id}
                      type="button"
                      onClick={() => toggleAngle(angle.id)}
                      className={`flex items-start gap-2 p-2 rounded-md border text-left transition-colors ${
                        isChecked ? 'border-primary/60 bg-primary/5' : 'border-input opacity-60'
                      }`}
                    >
                      <div
                        className={`h-4 w-4 rounded border mt-0.5 flex items-center justify-center shrink-0 ${
                          isChecked ? 'bg-primary text-primary-foreground border-primary' : 'border-input'
                        }`}
                      >
                        {isChecked && <Check className="h-3 w-3" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold leading-tight truncate">{angle.label}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{angle.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Generate Trigger Button */}
            <div className="pt-2">
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !productImageUrl}
                className="w-full h-11 text-xs uppercase tracking-wider font-mono gap-2 shadow-md"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Synthesizing Angles...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    Synthesize {selectedAngles.length} Model Angles
                  </>
                )}
              </Button>

              {isGenerating && generationStep && (
                <p className="text-[11px] text-center text-muted-foreground animate-pulse mt-2 font-mono">
                  {generationStep}
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Generated Gallery (7 cols) */}
          <div className="lg:col-span-7 flex flex-col h-full border-t lg:border-t-0 lg:border-l lg:pl-6 pt-4 lg:pt-0">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Camera className="h-3.5 w-3.5 text-primary" /> Generated Multi-Angle Shots
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Select shots to push directly into your product listing
                </p>
              </div>

              {generatedImages.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const allSelected = generatedImages.every((img) => selectedToApply[img.imageUrl]);
                      const next: Record<string, boolean> = {};
                      generatedImages.forEach((img) => {
                        next[img.imageUrl] = !allSelected;
                      });
                      setSelectedToApply(next);
                    }}
                    className="text-[11px] h-7 font-mono"
                  >
                    {generatedImages.every((img) => selectedToApply[img.imageUrl])
                      ? 'Deselect All'
                      : 'Select All'}
                  </Button>
                </div>
              )}
            </div>

            {/* Gallery Grid */}
            <div className="flex-1 py-4">
              {generatedImages.length === 0 ? (
                <div className="h-80 flex flex-col items-center justify-center border border-dashed rounded-xl p-8 text-center text-muted-foreground bg-muted/10">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">No Model Shots Synthesized Yet</p>
                  <p className="text-xs text-muted-foreground max-w-sm mt-1">
                    Select your model reference and click "Synthesize Model Angles" to generate 3-4 photorealistic angles matching OFFSCRIPT's luxury streetwear aesthetic.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {generatedImages.map((img) => {
                    const isSelected = Boolean(selectedToApply[img.imageUrl]);
                    return (
                      <div
                        key={img.imageUrl + img.angleId}
                        className={`group relative rounded-xl border overflow-hidden transition-all bg-card ${
                          isSelected
                            ? 'border-primary ring-2 ring-primary/40 shadow-md'
                            : 'border-input hover:border-foreground/30'
                        }`}
                      >
                        {/* Image Container 3:4 */}
                        <div className="relative aspect-[3/4] bg-muted overflow-hidden">
                          <img
                            src={img.imageUrl}
                            alt={img.angleName}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />

                          {/* Angle Badge */}
                          <div className="absolute top-2 left-2 z-10">
                            <Badge
                              variant="secondary"
                              className="text-[10px] font-mono uppercase bg-black/70 text-white backdrop-blur-md"
                            >
                              {img.angleName.split(':')[1] || img.angleName}
                            </Badge>
                          </div>

                          {/* Quick Actions (Zoom, Copy) */}
                          <div className="absolute top-2 right-2 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => setPreviewImage(img.imageUrl)}
                              className="h-7 w-7 rounded-md bg-black/70 text-white flex items-center justify-center hover:bg-black transition-colors"
                              title="Inspect Full Size"
                            >
                              <Maximize2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyUrl(img.imageUrl)}
                              className="h-7 w-7 rounded-md bg-black/70 text-white flex items-center justify-center hover:bg-black transition-colors"
                              title="Copy URL"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Selection Checkbox Overlay */}
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedToApply({
                                ...selectedToApply,
                                [img.imageUrl]: !isSelected,
                              })
                            }
                            className={`absolute inset-0 flex items-end p-3 bg-gradient-to-t from-black/80 via-transparent to-transparent text-left transition-opacity ${
                              isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            }`}
                          >
                            <div className="flex items-center gap-2 text-white">
                              <div
                                className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${
                                  isSelected
                                    ? 'bg-primary border-primary text-primary-foreground'
                                    : 'border-white/60 bg-black/40'
                                }`}
                              >
                                {isSelected && <Check className="h-3.5 w-3.5" />}
                              </div>
                              <span className="text-xs font-semibold">
                                {isSelected ? 'Selected' : 'Click to select'}
                              </span>
                            </div>
                          </button>
                        </div>

                        {/* Caption */}
                        <div className="p-2 border-t text-[11px] text-muted-foreground truncate">
                          {img.description}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            {generatedImages.length > 0 && (
              <div className="pt-3 border-t mt-auto flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground font-mono">
                  {Object.values(selectedToApply).filter(Boolean).length} of {generatedImages.length} shots selected
                </span>

                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleApplyToProduct}
                    disabled={Object.values(selectedToApply).filter(Boolean).length === 0}
                    className="text-xs gap-1.5 uppercase tracking-wider font-mono bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Add Selected to Product
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Size Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-2xl max-h-[90vh] overflow-hidden rounded-xl border bg-card">
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/70 text-white flex items-center justify-center z-10"
            >
              <X className="h-4 w-4" />
            </button>
            <img src={previewImage} alt="Preview" className="w-full h-full object-contain" />
          </div>
        </div>
      )}
    </Modal>
  );
};
