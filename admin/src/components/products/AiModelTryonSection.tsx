import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  User,
  Layers,
  Upload,
  Check,
  RefreshCw,
  Key,
  ExternalLink,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { api } from '../../lib/api';
import { toast } from 'sonner';

export interface GeneratedShot {
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

export interface AiModelTryonSectionProps {
  productName: string;
  category: string;
  currentImages: string[];
  onAddImages: (newUrls: string[]) => void;
}

const PRESET_MODELS: PresetModel[] = [
  {
    id: 'preset-kai-male',
    name: 'Kai (Brutalist Male)',
    description: "6'1 athletic boxy build, fade cut, architectural streetwear pose",
    gender: 'male',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'preset-elena-female',
    name: 'Elena (Editorial Female)',
    description: "5'10 high-fashion frame, slick hair, architectural stance",
    gender: 'female',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'preset-rei-unisex',
    name: 'Rei (Minimalist Unisex)',
    description: 'Slouch silhouette, silver bleached crop, Tokyo streetwear aesthetic',
    gender: 'unisex',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'preset-marcus-heavyweight',
    name: 'Marcus (Oversized Athletic)',
    description: 'Broad athletic frame, sculpted jawline, styled for heavyweight drops',
    gender: 'male',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
  },
];

const AESTHETIC_OPTIONS = [
  'Concrete Brutalist Studio (OFFSCRIPT Signature Lookbook)',
  'Moody High-Fashion Editorial (Charcoal & Rim Lighting)',
  'Cyber Brutalist Neo-Noir (Wet Asphalt & Ambient Shadows)',
  'Daylight Industrial Warehouse (Natural Diffused Light)',
];

export const AiModelTryonSection: React.FC<AiModelTryonSectionProps> = ({
  productName,
  category,
  currentImages,
  onAddImages,
}) => {
  // Model state
  const [modelType, setModelType] = useState<'upload' | 'preset'>('upload');
  const [customModelUrl, setCustomModelUrl] = useState<string>('');
  const [customModelPreview, setCustomModelPreview] = useState<string>('');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('preset-kai-male');
  const [isUploadingModel, setIsUploadingModel] = useState(false);
  const modelFileInputRef = useRef<HTMLInputElement>(null);

  // Garment packshot state
  const [garmentUrl, setGarmentUrl] = useState<string>(currentImages[0] || '');
  const [isUploadingGarment, setIsUploadingGarment] = useState(false);
  const garmentFileInputRef = useRef<HTMLInputElement>(null);

  // Studio Settings
  const [aesthetic, setAesthetic] = useState(AESTHETIC_OPTIONS[0]);

  // Gemini API Key & Connection status
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('offscript_gemini_api_key') || '');
  const [hasServerKey, setHasServerKey] = useState(false);
  const [isVerifyingKey, setIsVerifyingKey] = useState(false);
  const [keyVerificationStatus, setKeyVerificationStatus] = useState<string | null>(null);
  const [showKeySettings, setShowKeySettings] = useState(false);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [generatedShots, setGeneratedShots] = useState<GeneratedShot[]>([]);
  const [appliedCount, setAppliedCount] = useState<number>(0);

  // Auto-sync garment from product images if updated
  useEffect(() => {
    if (!garmentUrl && currentImages.length > 0) {
      setGarmentUrl(currentImages[0]);
    }
  }, [currentImages, garmentUrl]);

  // Check server presets & keys on mount
  useEffect(() => {
    api
      .get<{ hasServerKey?: boolean }>('/api/admin/ai/presets')
      .then((data) => {
        if (data?.hasServerKey) {
          setHasServerKey(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleVerifyKey = async () => {
    const key = geminiApiKey.trim();
    if (!key) {
      toast.error('Please enter a Gemini API key first');
      return;
    }

    setIsVerifyingKey(true);
    setKeyVerificationStatus(null);
    try {
      const res = await api.post<{ valid: boolean; message?: string; error?: string }>(
        '/api/admin/ai/verify-key',
        { apiKey: key }
      );
      if (res.valid) {
        localStorage.setItem('offscript_gemini_api_key', key);
        setKeyVerificationStatus('verified');
        toast.success(res.message || 'Gemini API key verified successfully!');
      } else {
        setKeyVerificationStatus('failed');
        toast.error(res.error || 'Gemini key validation failed');
      }
    } catch (err: any) {
      setKeyVerificationStatus('failed');
      toast.error(err?.message || 'Error validating Gemini key');
    } finally {
      setIsVerifyingKey(false);
    }
  };

  const handleCustomModelFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show instant local preview
    const localUrl = URL.createObjectURL(file);
    setCustomModelPreview(localUrl);
    setModelType('upload');

    setIsUploadingModel(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.upload<{ url: string }>('/api/admin/ai/upload-model', formData);
      if (res?.url) {
        setCustomModelUrl(res.url);
        toast.success('Model photo uploaded to Cloud CDN');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to upload model photo');
    } finally {
      setIsUploadingModel(false);
    }
  };

  const handleGarmentFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingGarment(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.upload<{ url: string }>('/api/admin/uploads', formData);
      if (res?.url) {
        setGarmentUrl(res.url);
        toast.success('Product garment uploaded');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to upload garment photo');
    } finally {
      setIsUploadingGarment(false);
    }
  };

  const handleGenerateShots = async () => {
    // 1. Validate inputs
    let effectiveModel = '';
    if (modelType === 'upload') {
      effectiveModel = customModelUrl || customModelPreview;
      if (!effectiveModel) {
        toast.error('Please upload your model picture first');
        return;
      }
    } else {
      effectiveModel = selectedPresetId;
    }

    if (!garmentUrl) {
      toast.error('Please upload or select a product garment photo');
      return;
    }

    setIsGenerating(true);
    setGenerationStep('Analyzing model physique & garment drape with Gemini 2.0 Vision...');

    try {
      const payload = {
        modelImage: effectiveModel,
        productImage: garmentUrl,
        productName: productName || 'Streetwear Piece',
        category: category || 'Hoodies',
        aesthetic,
        geminiApiKey: geminiApiKey.trim() || undefined,
        angles: ['front', 'side_45', 'back', 'detail'],
      };

      setGenerationStep('Synthesizing 4 angles (Front, 45° Turn, Back, Detail) with Imagen 3...');

      const response = await api.post<{
        success: boolean;
        isDemo?: boolean;
        message?: string;
        images: GeneratedShot[];
      }>('/api/admin/ai/generate', payload);

      if (response?.images && response.images.length > 0) {
        setGeneratedShots(response.images);
        const newUrls = response.images.map((img) => img.imageUrl);

        // Automatically add to the product's images array!
        onAddImages(newUrls);
        setAppliedCount(newUrls.length);

        if (response.isDemo) {
          toast.info(response.message || 'Demo previews generated.');
        } else {
          toast.success(`✨ Synthesized and added ${newUrls.length} Gemini AI model angles to your product!`);
        }
      } else {
        toast.error('No images generated');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to generate model images');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  return (
    <Card className="border-2 border-primary/30 bg-primary/[0.02] shadow-sm">
      <CardHeader className="pb-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-muted/20">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-500" />
              AI Virtual Model Try-On Studio
            </CardTitle>
            <Badge variant="outline" className="font-mono text-[10px] text-primary border-primary/40">
              Gemini 2.0 + Imagen 3
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Upload your model's picture and garment to generate 4 editorial catalog angles (Front, 45° Side, Back, Detail)
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowKeySettings(!showKeySettings)}
          className="text-xs h-7 font-mono gap-1 text-muted-foreground"
        >
          <Key className="h-3 w-3" />
          {hasServerKey ? 'Server Key Active' : geminiApiKey ? 'Custom Key Set' : 'Configure Gemini Key'}
          {showKeySettings ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>
      </CardHeader>

      <CardContent className="pt-4 space-y-5">
        {/* Collapsible Gemini API Key Settings */}
        {showKeySettings && (
          <div className="p-3.5 rounded-lg border border-primary/20 bg-primary/5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-primary" /> Google Gemini API Key
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-primary hover:underline font-mono inline-flex items-center gap-1"
              >
                Get Free API Key on Google AI Studio <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Input
                type="password"
                placeholder="AIzaSy..."
                value={geminiApiKey}
                onChange={(e) => {
                  setGeminiApiKey(e.target.value);
                  setKeyVerificationStatus(null);
                }}
                className="font-mono text-xs flex-1"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleVerifyKey}
                disabled={isVerifyingKey || !geminiApiKey.trim()}
                className="text-xs font-mono shrink-0 gap-1.5"
              >
                {isVerifyingKey ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Verify & Save Key
              </Button>
            </div>

            {keyVerificationStatus === 'verified' && (
              <p className="text-[11px] text-emerald-600 font-mono flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Gemini 2.0 & Imagen 3 key verified and active!
              </p>
            )}

            <p className="text-[11px] text-muted-foreground">
              {hasServerKey
                ? 'Backend GEMINI_API_KEY is active. Custom keys entered here take priority.'
                : 'Free Gemini API keys from Google AI Studio have 15 requests per minute with Imagen 3.'}
            </p>
          </div>
        )}

        {/* Studio Upload Zones Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Zone 1: Model Photo Upload */}
          <div className="space-y-2 p-3.5 rounded-xl border bg-card">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <User className="h-4 w-4 text-primary" /> 1. Model Picture *
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setModelType('upload')}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded transition-colors ${
                    modelType === 'upload'
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  My Model
                </button>
                <button
                  type="button"
                  onClick={() => setModelType('preset')}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded transition-colors ${
                    modelType === 'preset'
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  Presets
                </button>
              </div>
            </div>

            {modelType === 'upload' ? (
              <div>
                <input
                  type="file"
                  ref={modelFileInputRef}
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleCustomModelFile}
                  className="hidden"
                />

                {customModelPreview || customModelUrl ? (
                  <div className="flex items-center gap-3 p-2.5 rounded-lg border bg-muted/20">
                    <div className="h-20 w-16 rounded overflow-hidden bg-muted border shrink-0">
                      <img
                        src={customModelPreview || customModelUrl}
                        alt="Model"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Model Photo Ready
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {isUploadingModel ? 'Uploading to CDN...' : 'Will be styled wearing this product'}
                      </p>
                      <button
                        type="button"
                        onClick={() => modelFileInputRef.current?.click()}
                        className="text-[11px] text-primary hover:underline font-mono mt-1 block"
                      >
                        Change Model Photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => modelFileInputRef.current?.click()}
                    className="border-2 border-dashed border-primary/40 rounded-xl p-5 text-center cursor-pointer hover:bg-primary/5 transition-colors flex flex-col items-center justify-center min-h-[120px]"
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                      <Upload className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-bold text-foreground">Click to Upload Model Picture</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Portrait photo of your model (JPG, PNG, or WebP)
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                {PRESET_MODELS.map((p) => {
                  const isSelected = selectedPresetId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPresetId(p.id)}
                      className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'border-primary ring-1 ring-primary bg-primary/5'
                          : 'border-input hover:bg-muted/40'
                      }`}
                    >
                      <img src={p.thumbnailUrl} alt={p.name} className="h-10 w-8 object-cover rounded" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold truncate leading-tight">{p.name}</p>
                        <p className="text-[9px] text-muted-foreground truncate">{p.gender}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Zone 2: Product Garment Packshot */}
          <div className="space-y-2 p-3.5 rounded-xl border bg-card">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-primary" /> 2. Garment Packshot *
              </label>
              {garmentUrl && (
                <span className="text-[10px] text-emerald-600 font-mono flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Garment Ready
                </span>
              )}
            </div>

            <input
              type="file"
              ref={garmentFileInputRef}
              accept="image/jpeg,image/png,image/webp"
              onChange={handleGarmentFile}
              className="hidden"
            />

            {garmentUrl ? (
              <div className="flex items-center gap-3 p-2.5 rounded-lg border bg-muted/20">
                <div className="h-20 w-16 rounded overflow-hidden bg-muted border shrink-0">
                  <img src={garmentUrl} alt="Product garment" className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{productName || 'Garment Packshot'}</p>
                  <p className="text-[11px] text-muted-foreground uppercase font-mono">
                    {isUploadingGarment ? 'Uploading packshot to CDN...' : category || 'Apparel'}
                  </p>
                  <button
                    type="button"
                    onClick={() => garmentFileInputRef.current?.click()}
                    className="text-[11px] text-primary hover:underline font-mono mt-1 block"
                  >
                    Upload Different Packshot
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => garmentFileInputRef.current?.click()}
                className="border-2 border-dashed border-primary/40 rounded-xl p-5 text-center cursor-pointer hover:bg-primary/5 transition-colors flex flex-col items-center justify-center min-h-[120px]"
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                  <Camera className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-foreground">Upload Product Flatlay / Packshot</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Or upload images in the gallery below to auto-select
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Aesthetic & Studio Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Studio Aesthetic
            </label>
            <select
              value={aesthetic}
              onChange={(e) => setAesthetic(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm"
            >
              {AESTHETIC_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Angles to Synthesize
            </label>
            <div className="h-9 px-3 flex items-center rounded-md border border-input bg-muted/30 text-xs font-mono">
              4 Angles (Front, 45°, Back, Detail)
            </div>
          </div>
        </div>

        {/* Main Generate Button */}
        <div>
          <Button
            type="button"
            onClick={handleGenerateShots}
            disabled={isGenerating || !garmentUrl}
            className="w-full h-11 text-xs font-mono uppercase tracking-wider gap-2 shadow bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Synthesizing Angles...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-amber-300" />
                Generate 4 Model Angles with Gemini AI
              </>
            )}
          </Button>

          {isGenerating && generationStep && (
            <p className="text-[11px] text-center text-primary font-mono animate-pulse mt-2">
              {generationStep}
            </p>
          )}
        </div>

        {/* Generated 4 Shots Grid */}
        {generatedShots.length > 0 && (
          <div className="pt-3 border-t space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> 4 AI Model Shots Synthesized
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">
                {appliedCount > 0 ? `${appliedCount} shots added to product gallery` : 'Added to product gallery'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {generatedShots.map((shot) => (
                <div
                  key={shot.angleId}
                  className="rounded-lg border overflow-hidden bg-card shadow-sm flex flex-col group relative"
                >
                  <div className="relative aspect-[3/4] bg-muted overflow-hidden">
                    <img
                      src={shot.imageUrl}
                      alt={shot.angleName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-1.5 left-1.5">
                      <Badge className="text-[9px] font-mono uppercase bg-black/80 text-white border-0 backdrop-blur-sm">
                        {shot.angleId.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-1.5 border-t bg-card">
                    <p className="text-[11px] font-semibold truncate leading-tight">{shot.angleName}</p>
                    <p className="text-[9px] text-muted-foreground truncate mt-0.5">{shot.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
