import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Camera,
  Layers,
  Upload,
  User,
  Check,
  Copy,
  ExternalLink,
  Key,
  Maximize2,
  RefreshCw,
  PlusCircle,
  Cloud,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { api } from '../lib/api';
import { toast } from 'sonner';

interface GeneratedAngle {
  angleId: 'front' | 'side_45' | 'back' | 'detail';
  angleName: string;
  cameraAngle: string;
  description: string;
  imageUrl: string;
  promptUsed: string;
}

interface PresetModel {
  id: string;
  name: string;
  description: string;
  gender: 'male' | 'female' | 'unisex';
  thumbnailUrl: string;
}

const AESTHETICS = [
  { id: 'brutalist-concrete', label: 'Concrete Brutalist Studio', desc: 'Architectural cast concrete walls, raw minimalist shadows' },
  { id: 'moody-editorial', label: 'Moody High-Fashion Editorial', desc: 'Charcoal backdrop, high contrast rim lighting' },
  { id: 'cyber-street', label: 'Cyber Brutalist Street', desc: 'Wet asphalt reflections, monochromatic neo-noir ambient glow' },
  { id: 'daylight-minimalist', label: 'Daylight Warehouse Loft', desc: 'Natural diffused daylight, raw industrial steel framing' },
];

const DEFAULT_PRESETS: PresetModel[] = [
  {
    id: 'preset-kai-male',
    name: 'Kai — Brutalist Male',
    description: "6'1 athletic boxy frame, fade haircut, raw architectural streetwear pose",
    gender: 'male',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 'preset-elena-female',
    name: 'Elena — Editorial Female',
    description: "5'10 high-fashion frame, slicked-back hair, striking cheekbones, architectural stance",
    gender: 'female',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 'preset-rei-unisex',
    name: 'Rei — Minimalist Unisex',
    description: 'Contemporary androgynous streetwear build, bleached crop, relaxed slouch silhouette',
    gender: 'unisex',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 'preset-marcus-heavyweight',
    name: 'Marcus — Oversized Athletic',
    description: 'Broad-shouldered masculine build, sculpted profile, styled for heavyweight drops',
    gender: 'male',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=700&q=80',
  },
];

export const AiStudio: React.FC = () => {
  const navigate = useNavigate();

  // Model & Garment
  const [presetModels, setPresetModels] = useState<PresetModel[]>(DEFAULT_PRESETS);
  const [selectedModelId, setSelectedModelId] = useState<string>('preset-kai-male');
  const [customModelUrl, setCustomModelUrl] = useState<string>('');
  const [isUploadingModel, setIsUploadingModel] = useState(false);

  const [garmentUrl, setGarmentUrl] = useState<string>('');
  const [isUploadingGarment, setIsUploadingGarment] = useState(false);
  const [productTitle, setProductTitle] = useState('Heavyweight Boxy Hoodie');
  const [category, setCategory] = useState('Hoodies');

  // Studio Settings
  const [aesthetic, setAesthetic] = useState(AESTHETICS[0].label);
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('offscript_gemini_api_key') || '');
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [hasServerKey, setHasServerKey] = useState(false);
  const [storageProvider, setStorageProvider] = useState<'cloudinary' | 'local'>('cloudinary');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [generatedShots, setGeneratedShots] = useState<GeneratedAngle[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ presetModels?: PresetModel[]; hasServerKey?: boolean; storageProvider?: 'cloudinary' | 'local' }>(
        '/api/admin/ai/presets'
      )
      .then((data) => {
        if (data?.presetModels && data.presetModels.length > 0) {
          setPresetModels(data.presetModels);
        }
        if (data?.hasServerKey !== undefined) setHasServerKey(data.hasServerKey);
        if (data?.storageProvider) setStorageProvider(data.storageProvider);
      })
      .catch(() => {});
  }, []);

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
        setGarmentUrl(res.url);
        toast.success('Garment image uploaded');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to upload garment photo');
    } finally {
      setIsUploadingGarment(false);
    }
  };

  const handleSynthesize = async () => {
    if (!garmentUrl) {
      toast.error('Please upload or provide a product garment packshot');
      return;
    }

    const effectiveModel = selectedModelId === 'custom' ? customModelUrl : selectedModelId;
    if (!effectiveModel) {
      toast.error('Please select or upload a model');
      return;
    }

    setIsGenerating(true);
    setGenerationStep('Analyzing model physique & garment cut with Gemini 2.0...');

    try {
      const payload = {
        modelImage: effectiveModel,
        productImage: garmentUrl,
        productName: productTitle || 'Streetwear Piece',
        category,
        aesthetic,
        geminiApiKey: geminiApiKey.trim() || undefined,
        angles: ['front', 'side_45', 'back', 'detail'],
      };

      setGenerationStep('Synthesizing 4 angle shots with Imagen 3 & saving to Cloud CDN...');

      const res = await api.post<{
        success: boolean;
        isDemo?: boolean;
        message?: string;
        images: GeneratedAngle[];
      }>('/api/admin/ai/generate', payload);

      if (res?.images && res.images.length > 0) {
        setGeneratedShots(res.images);
        if (res.isDemo) {
          toast.info(res.message || 'Demo previews generated');
        } else {
          toast.success(`Synthesized 4 multi-angle shots!`);
        }
      }
    } catch (err: any) {
      toast.error(err?.message || 'Generation failed');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Image CDN URL copied to clipboard');
  };

  const handleCreateProductWithShots = () => {
    if (generatedShots.length === 0) return;
    const urls = generatedShots.map((s) => s.imageUrl);
    sessionStorage.setItem('offscript_prefill_images', JSON.stringify(urls));
    navigate('/products/new');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight uppercase font-mono">
              AI Virtual Model Studio
            </h1>
            <Badge variant="outline" className="font-mono text-[10px] gap-1 text-primary border-primary/40">
              <Sparkles className="h-3 w-3" />
              Gemini + Imagen 3
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Synthesize 4-angle high-fashion editorial photographs on models wearing your streetwear pieces
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 font-mono text-[11px]">
            <Cloud className="h-3.5 w-3.5 text-blue-500" />
            Storage: {storageProvider === 'cloudinary' ? 'Cloudinary CDN' : 'Local Disk'}
          </Badge>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowKeyConfig(!showKeyConfig)}
            className="text-xs gap-1 font-mono"
          >
            <Key className="h-3.5 w-3.5" />
            {showKeyConfig ? 'Hide Key' : 'Gemini Key'}
            {showKeyConfig ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Gemini API Key Configuration Dropdown */}
      {showKeyConfig && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4 space-y-3">
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
                Get API key from Google AI Studio <ExternalLink className="h-2.5 w-2.5" />
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
              <Button type="button" size="sm" onClick={handleSaveApiKey} className="text-xs font-mono">
                Save Key
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {hasServerKey
                ? 'Backend environment GEMINI_API_KEY is active. Custom keys override the server key.'
                : 'No server key detected. Enter your Gemini API key above to activate live neural generation.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Model + Garment + Aesthetic (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card 1: Model Reference */}
          <Card>
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-primary" /> 1. Select Model Reference
              </CardTitle>
              {selectedModelId === 'custom' && (
                <Badge variant="outline" className="text-[10px]">
                  Custom Upload Active
                </Badge>
              )}
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
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
                        <img src={p.thumbnailUrl} alt={p.name} className="w-full h-full object-cover" />
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

              <label className="flex items-center justify-center gap-2 p-2.5 rounded-lg border border-dashed border-input hover:border-primary/50 hover:bg-muted/30 cursor-pointer transition-colors text-xs text-muted-foreground">
                <Upload className="h-3.5 w-3.5" />
                <span>
                  {isUploadingModel
                    ? 'Uploading model to Cloud CDN...'
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
            </CardContent>
          </Card>

          {/* Card 2: Garment & Piece Info */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-primary" /> 2. Product Garment Packshot
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Piece Name</label>
                <Input
                  value={productTitle}
                  onChange={(e) => setProductTitle(e.target.value)}
                  placeholder="e.g. Acid-Wash Oversized Heavyweight Hoodie"
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs"
                  >
                    <option value="Hoodies">Hoodies</option>
                    <option value="T-Shirts">T-Shirts</option>
                    <option value="Jackets">Jackets & Outerwear</option>
                    <option value="Pants">Pants & Bottoms</option>
                    <option value="Sweatshirts">Sweatshirts</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Aesthetic Backing</label>
                  <select
                    value={aesthetic}
                    onChange={(e) => setAesthetic(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs"
                  >
                    {AESTHETICS.map((a) => (
                      <option key={a.id} value={a.label}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Garment Image Upload */}
              <div className="pt-2">
                {garmentUrl ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                    <img src={garmentUrl} alt="Garment" className="h-16 w-16 object-cover rounded border" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{productTitle}</p>
                      <label className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline cursor-pointer mt-1">
                        <Upload className="h-3 w-3" />
                        <span>Change Garment Packshot</span>
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
                ) : (
                  <label className="flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed border-input hover:border-primary/50 hover:bg-muted/30 cursor-pointer transition-colors text-center">
                    <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                    <span className="text-xs font-medium">Upload Garment Packshot / Flatlay</span>
                    <span className="text-[11px] text-muted-foreground mt-0.5">JPG, PNG, or WebP</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={isUploadingGarment}
                      onChange={handleGarmentUpload}
                    />
                  </label>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Trigger Button */}
          <Button
            type="button"
            onClick={handleSynthesize}
            disabled={isGenerating || !garmentUrl}
            className="w-full h-12 text-xs uppercase tracking-wider font-mono gap-2 shadow-lg"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Synthesizing Angles...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-amber-300" />
                Synthesize 4 Model Angles
              </>
            )}
          </Button>

          {isGenerating && generationStep && (
            <p className="text-[11px] text-center text-muted-foreground animate-pulse font-mono">
              {generationStep}
            </p>
          )}
        </div>

        {/* Right Gallery: 4 Angle Shots (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Camera className="h-3.5 w-3.5 text-primary" /> Generated Lookbook Shots (4 Angles)
                </CardTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Front, 45° Editorial Turn, Back Silhouette & Seam Macro
                </p>
              </div>

              {generatedShots.length > 0 && (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCreateProductWithShots}
                  className="gap-1.5 text-xs font-mono uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  Create Product with Shots
                </Button>
              )}
            </CardHeader>

            <CardContent className="pt-4 flex-1">
              {generatedShots.length === 0 ? (
                <div className="h-96 flex flex-col items-center justify-center border border-dashed rounded-xl p-8 text-center text-muted-foreground">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">No Model Shots Synthesized Yet</p>
                  <p className="text-xs text-muted-foreground max-w-sm mt-1">
                    Select a model reference and upload a garment packshot to synthesize 4 high-end editorial angles matching OFFSCRIPT's luxury streetwear aesthetic.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {generatedShots.map((shot) => (
                    <div
                      key={shot.angleId}
                      className="group relative rounded-xl border overflow-hidden bg-card transition-all hover:border-foreground/30 shadow-sm"
                    >
                      <div className="relative aspect-[3/4] bg-muted overflow-hidden">
                        <img
                          src={shot.imageUrl}
                          alt={shot.angleName}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />

                        {/* Angle Badge */}
                        <div className="absolute top-2 left-2 z-10">
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-mono uppercase bg-black/75 text-white backdrop-blur-md"
                          >
                            {shot.angleName}
                          </Badge>
                        </div>

                        {/* Top-right quick actions */}
                        <div className="absolute top-2 right-2 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => setPreviewImage(shot.imageUrl)}
                            className="h-7 w-7 rounded-md bg-black/70 text-white flex items-center justify-center hover:bg-black transition-colors"
                            title="Inspect"
                          >
                            <Maximize2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyUrl(shot.imageUrl)}
                            className="h-7 w-7 rounded-md bg-black/70 text-white flex items-center justify-center hover:bg-black transition-colors"
                            title="Copy CDN URL"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="p-2.5 border-t">
                        <p className="text-xs font-semibold truncate">{shot.angleName}</p>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{shot.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Full-size Inspect Modal */}
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
              <Maximize2 className="h-4 w-4" />
            </button>
            <img src={previewImage} alt="Full view" className="w-full h-full object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};
