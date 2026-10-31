import React, { useState, useRef } from 'react';
import { Upload, X, ArrowLeft, ArrowRight, Link as LinkIcon, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { api } from '../../lib/api';
import { toast } from 'sonner';

export interface ImageUploadFieldProps {
  images: string[];
  onChange: (images: string[]) => void;
  error?: string;
  onOpenAiStudio?: () => void;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  images = [],
  onChange,
  error,
  onOpenAiStudio,
}) => {
  const safeImages = Array.isArray(images) ? images : [];
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        toast.error(`"${file.name}" is not a supported format. Please use JPG, PNG, or WebP.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error(`"${file.name}" exceeds 5 MB maximum allowed size.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    for (const file of validFiles) {
      try {
        const formData = new FormData();
        formData.append('image', file);

        // Upload to backend: POST /api/admin/uploads
        const response = await api.upload<{ url: string }>('/api/admin/uploads', formData);
        if (response?.url) {
          uploadedUrls.push(response.url);
        }
      } catch (err: any) {
        toast.error(err?.message || `Failed to upload "${file.name}"`);
      }
    }

    setIsUploading(false);
    if (uploadedUrls.length > 0) {
      onChange([...safeImages, ...uploadedUrls]);
      toast.success(`Uploaded ${uploadedUrls.length} image(s)`);
    }
  };

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (!/^https?:\/\//i.test(trimmed)) {
      toast.error('Please enter a valid image URL starting with http:// or https://');
      return;
    }
    onChange([...safeImages, trimmed]);
    setUrlInput('');
  };

  const handleRemoveImage = (index: number) => {
    const next = [...safeImages];
    next.splice(index, 1);
    onChange(next);
  };

  const handleMoveImage = (from: number, to: number) => {
    if (to < 0 || to >= safeImages.length) return;
    const next = [...safeImages];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFileUpload(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer flex flex-col items-center justify-center ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-muted-foreground/40 hover:bg-muted/30'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => handleFileUpload(e.target.files)}
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
        />

        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-2 text-muted-foreground">
          {isUploading ? (
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
          ) : (
            <Upload className="h-5 w-5" />
          )}
        </div>

        <p className="text-xs font-medium text-foreground">
          {isUploading ? 'Uploading to server...' : 'Click to upload or drag & drop images here'}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          JPG, PNG, or WebP • Max 5 MB each • First image becomes main cover
        </p>
      </div>

      {/* AI Model Virtual Try-On Studio Banner */}
      {onOpenAiStudio && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">AI Model Virtual Try-On Studio</p>
              <p className="text-[11px] text-muted-foreground">
                Synthesize 4 multi-angle editorial photographs on models wearing this piece
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onOpenAiStudio}
            className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10 text-xs font-mono shrink-0"
          >
            <Sparkles className="h-3 w-3" />
            Launch AI Studio
          </Button>
        </div>
      )}

      {/* Fallback Paste URL Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <LinkIcon className="h-3.5 w-3.5 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Or paste external image URL (https://...)"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddUrl();
              }
            }}
            className="pl-9 text-xs"
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleAddUrl}
          disabled={!urlInput.trim()}
          className="text-xs shrink-0"
        >
          Add URL
        </Button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {/* Thumbnails Gallery with Reordering */}
      {safeImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
          {safeImages.map((url, idx) => (
            <div
              key={idx}
              className={`group relative aspect-[3/4] rounded-lg border overflow-hidden bg-muted flex items-center justify-center ${
                idx === 0 ? 'ring-2 ring-primary ring-offset-2' : ''
              }`}
            >
              <img
                src={url}
                alt={`Product image ${idx + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="%23eee"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23aaa" font-size="10">Broken URL</text></svg>';
                }}
              />

              {/* Main Badge */}
              {idx === 0 && (
                <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow">
                  MAIN
                </div>
              )}

              {/* Action Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="p-1 rounded-full bg-destructive text-destructive-foreground hover:scale-110 transition-transform"
                    title="Remove image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleMoveImage(idx, idx - 1)}
                    disabled={idx === 0}
                    className="p-1 rounded bg-background/80 text-foreground hover:bg-background disabled:opacity-30 disabled:pointer-events-none"
                    title="Move left"
                  >
                    <ArrowLeft className="h-3 w-3" />
                  </button>
                  <span className="text-[10px] text-white font-mono">{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleMoveImage(idx, idx + 1)}
                    disabled={idx === safeImages.length - 1}
                    className="p-1 rounded bg-background/80 text-foreground hover:bg-background disabled:opacity-30 disabled:pointer-events-none"
                    title="Move right"
                  >
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
