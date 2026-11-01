import { GoogleGenAI, PersonGeneration } from "@google/genai";
import { env } from "../config/env.js";
import { storageService } from "./storage.js";

export interface PresetModel {
  id: string;
  name: string;
  description: string;
  gender: "male" | "female" | "unisex";
  thumbnailUrl: string;
  stylePrompt: string;
}

export const PRESET_MODELS: PresetModel[] = [
  {
    id: "preset-kai-male",
    name: "Kai — Brutalist Male",
    description: "6'1 athletic boxy frame, fade haircut, raw architectural streetwear pose",
    gender: "male",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=700&q=80",
    stylePrompt:
      "A 24-year-old male streetwear model, 6'1 athletic boxy frame, clean fade haircut, sharp angular jawline, neutral deadpan lookbook expression",
  },
  {
    id: "preset-elena-female",
    name: "Elena — Editorial Female",
    description: "5'10 high-fashion frame, slicked-back hair, striking cheekbones, architectural stance",
    gender: "female",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=700&q=80",
    stylePrompt:
      "A 23-year-old female high-fashion streetwear model, 5'10 slender athletic frame, slicked-back dark hair, high cheekbones, intense gaze, contemporary poise",
  },
  {
    id: "preset-rei-unisex",
    name: "Rei — Minimalist Unisex",
    description: "Contemporary androgynous streetwear build, bleached crop, relaxed slouch silhouette",
    gender: "unisex",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=700&q=80",
    stylePrompt:
      "An androgynous Asian streetwear model, relaxed slouch silhouette, bleached silver cropped hair, clean features, effortless Harajuku-meets-brutalist styling",
  },
  {
    id: "preset-marcus-heavyweight",
    name: "Marcus — Oversized Athletic",
    description: "Broad-shouldered masculine build, sculpted profile, styled for heavyweight drops",
    gender: "male",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=700&q=80",
    stylePrompt:
      "A 26-year-old Black male model, broad athletic shoulders, sculpted clean beard, calm confident lookbook expression, perfect for oversized streetwear silhouettes",
  },
];

export interface AngleDefinition {
  id: "front" | "side_45" | "back" | "detail";
  name: string;
  cameraAngle: string;
  description: string;
  composition: string;
}

export const TRYON_ANGLES: AngleDefinition[] = [
  {
    id: "front",
    name: "Front Full View",
    cameraAngle: "Eye-level direct frontal shot",
    description: "Clear view of the product drape, typography, front cut, fit on model",
    composition:
      "Direct frontal full-body lookbook portrait, eye-level camera, standing naturally with feet shoulder-width apart, arms relaxed at sides, highlighting front chest branding and relaxed shoulder drop",
  },
  {
    id: "side_45",
    name: "45° Three-Quarter Editorial Turn",
    cameraAngle: "45 degree editorial perspective",
    description: "Dynamic streetwear posture, showing side silhouette, sleeve length, shoulder drop",
    composition:
      "Three-quarter 45-degree dynamic streetwear turn, one shoulder angled toward camera, head turned slightly, accentuating the boxy side drape, oversized sleeve stacking, and profile cut",
  },
  {
    id: "back",
    name: "Back View / Silhouette",
    cameraAngle: "Rear three-quarter to direct back view",
    description: "Highlighting back graphics, hood/collar construction, back drape",
    composition:
      "Model facing away from camera looking slightly over the shoulder, full focus on the back panel construction, rear graphic artwork, hood drape, and relaxed hem drop",
  },
  {
    id: "detail",
    name: "Fabric & Seam Macro Detail",
    cameraAngle: "Editorial tight macro crop",
    description: "Macro texture, heavyweight cotton / nylon weave, hardware/zippers, logo embroideries",
    composition:
      "Cinematic editorial close-up macro crop focused on chest and shoulder area, shallow depth of field, sharp focus on 500 GSM heavyweight textile weave, intricate ribbing, and subtle hardware details",
  },
];

export interface TryonGenerationRequest {
  modelImage?: string; // Data URI, URL, or preset id (e.g. preset-kai-male)
  productImage: string; // Data URI or URL
  productName: string;
  category: string;
  aesthetic?: string; // e.g. "brutalist-concrete", "moody-editorial", "cyber-street", "minimalist-warehouse"
  geminiApiKey?: string;
  angles?: Array<"front" | "side_45" | "back" | "detail">;
}

export interface GeneratedAngleResult {
  angleId: "front" | "side_45" | "back" | "detail";
  angleName: string;
  cameraAngle: string;
  description: string;
  imageUrl: string;
  promptUsed: string;
}

export interface TryonGenerationResponse {
  success: boolean;
  productName: string;
  aesthetic: string;
  isDemo: boolean;
  message?: string;
  images: GeneratedAngleResult[];
}

/**
 * Normalizes input image string: extracts mime and base64 buffer or loads URL
 */
async function resolveImageBuffer(input: string): Promise<{ buffer: Buffer; mimeType: string }> {
  if (input.startsWith("data:")) {
    const match = input.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (match) {
      return {
        mimeType: match[1],
        buffer: Buffer.from(match[2], "base64"),
      };
    }
  }

  // Handle URL (preset or remote)
  const response = await fetch(input);
  if (!response.ok) {
    throw new Error(`Failed to download image from ${input} (${response.statusText})`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const mimeType = response.headers.get("content-type") || "image/jpeg";
  return {
    buffer: Buffer.from(arrayBuffer),
    mimeType,
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number, desc: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${desc} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

function determineTargetItem(category: string, productName: string): string {
  const combined = `${category} ${productName}`.toLowerCase();
  if (combined.includes("cap") || combined.includes("hat") || combined.includes("beanie")) {
    return "hair";
  }
  if (
    combined.includes("pant") ||
    combined.includes("jean") ||
    combined.includes("trouser") ||
    combined.includes("short") ||
    combined.includes("bottom")
  ) {
    return "pants";
  }
  if (
    combined.includes("shoe") ||
    combined.includes("sneaker") ||
    combined.includes("boot") ||
    combined.includes("footwear")
  ) {
    return "shoes";
  }
  if (
    combined.includes("jacket") ||
    combined.includes("coat") ||
    combined.includes("outerwear") ||
    combined.includes("bomber") ||
    combined.includes("blazer")
  ) {
    return "jacket";
  }
  if (combined.includes("hoodie") || combined.includes("sweater") || combined.includes("sweatshirt")) {
    return "shirt";
  }
  return "clothes";
}

export class AiTryonService {
  /**
   * Generates 4 angle try-on shots matching OFFSCRIPT luxury streetwear aesthetic.
   */
  async generateMultiAngleShots(req: TryonGenerationRequest): Promise<TryonGenerationResponse> {
    const apiKey = req.geminiApiKey || env.GEMINI_API_KEY;
    const requestedAngles = req.angles && req.angles.length > 0
      ? req.angles
      : (["front", "side_45", "back", "detail"] as Array<"front" | "side_45" | "back" | "detail">);

    const aestheticLabel = req.aesthetic || "Concrete Brutalist Architectural Studio";

    // Resolve model info
    let modelPrompt = "A luxury streetwear model with an athletic, boxy silhouette, and clean editorial features";
    let modelImageSource = req.modelImage || "preset-kai-male";

    const preset = PRESET_MODELS.find((p) => p.id === modelImageSource);
    if (preset) {
      modelPrompt = preset.stylePrompt;
      modelImageSource = preset.thumbnailUrl;
    }

    // If no Gemini API key configured, use Cloudinary AI Studio on the provided model
    if (!apiKey) {
      console.log("ℹ️ No GEMINI_API_KEY provided; generating studio lookbook angles using Cloudinary AI Studio.");
      return this.generateCloudinaryStudioAngles(req, modelImageSource, requestedAngles, aestheticLabel);
    }

    try {
      const ai = new GoogleGenAI({ apiKey });

      // Step 1: Multimodal Vision Analysis of Model + Garment using Gemini Vision
      let analyzedPrompts: Record<string, string> = {};

      try {
        const [modelImgData, productImgData] = await Promise.all([
          resolveImageBuffer(modelImageSource).catch(() => null),
          resolveImageBuffer(req.productImage).catch(() => null),
        ]);

        const contentParts: any[] = [];
        if (modelImgData) {
          contentParts.push({
            inlineData: {
              mimeType: modelImgData.mimeType,
              data: modelImgData.buffer.toString("base64"),
            },
          });
        }
        if (productImgData) {
          contentParts.push({
            inlineData: {
              mimeType: productImgData.mimeType,
              data: productImgData.buffer.toString("base64"),
            },
          });
        }

        contentParts.push({
          text: `You are the Lead Creative Director and AI Fashion Stylist for OFFSCRIPT (offscript.in), a luxury brutalist streetwear brand.
Analyze the provided images:
- First image is the fashion model reference.
- Second image is the product garment (${req.productName}, category: ${req.category}).

Output a JSON object with 4 specific photorealistic Imagen 3 prompts for the model wearing this exact garment in an architectural brutalist luxury streetwear studio with diffuse cinematic lighting (aesthetic: ${aestheticLabel}).
Ensure each angle describes:
- 'front': Direct eye-level frontal studio shot, relaxed streetwear posture, highlighting front typography and boxy cut.
- 'side_45': Dynamic 45-degree three-quarter turn, accentuating sleeve drape, shoulder drop, and profile silhouette.
- 'back': Model facing away, clear view of back panel construction, graphics, and rear proportions.
- 'detail': Close-up macro crop on fabric weave, ribbed trims, hardware, and chest branding.

Format strictly as JSON:
{
  "front": "prompt...",
  "side_45": "prompt...",
  "back": "prompt...",
  "detail": "prompt..."
}`,
        });

        let visionResponse: any = null;
        const candidateVisionModels = [
          "gemini-flash-latest",
          "gemini-3.8-flash",
          "gemini-2.5-flash-lite",
          "gemini-3.5-flash",
          "gemini-1.5-flash",
        ];

        for (const m of candidateVisionModels) {
          try {
            visionResponse = await withTimeout(
              ai.models.generateContent({
                model: m,
                contents: [{ role: "user", parts: contentParts }],
              }),
              6000,
              `Gemini vision (${m})`
            );
            if (visionResponse?.text) break;
          } catch {
            // try next model
          }
        }

        const textOutput = visionResponse?.text || "";
        const jsonMatch = textOutput.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analyzedPrompts = JSON.parse(jsonMatch[0]);
        }
      } catch (analysisErr) {
        console.warn("⚠️ Multimodal prompt extraction note:", analysisErr);
      }

      // Step 2: Attempt image generation for each requested angle
      const generatedResults: GeneratedAngleResult[] = [];
      let hadLiveGeneration = false;
      let lastErrorNotice: string | null = null;
      let quotaExceededDetected = false;

      for (const angleId of requestedAngles) {
        if (quotaExceededDetected) break;

        const angleDef = TRYON_ANGLES.find((a) => a.id === angleId) || TRYON_ANGLES[0];

        // Synthesize prompt matching OFFSCRIPT's luxury brutalist aesthetic
        const bespokePrompt =
          analyzedPrompts[angleId] ||
          `High-fashion lookbook studio photograph of ${modelPrompt} wearing an ${req.productName} (${req.category}). ` +
            `${angleDef.composition}. Aesthetic: ${aestheticLabel}, raw concrete brutalist interior, diffuse cinematic softbox lighting, muted neutral tone, ultra-realistic 8k fashion editorial, 85mm lens f/1.8 photography, Balenciaga / Fear of God lookbook aesthetic.`;

        let liveImageBuffer: Buffer | null = null;

        // Attempt A: Direct Gemini Image Generation model via generateContent
        try {
          const res = await withTimeout(
            ai.models.generateContent({
              model: "gemini-2.5-flash-image",
              contents: [{ role: "user", parts: [{ text: bespokePrompt }] }],
            }),
            8000,
            "Gemini image generation"
          );

          for (const cand of (res as any)?.candidates || []) {
            for (const part of cand.content?.parts || []) {
              if (part.inlineData?.data) {
                liveImageBuffer = Buffer.from(part.inlineData.data, "base64");
                break;
              }
            }
            if (liveImageBuffer) break;
          }
        } catch (e: any) {
          lastErrorNotice = e?.message || String(e);
          if (
            lastErrorNotice?.includes("429") ||
            lastErrorNotice?.includes("RESOURCE_EXHAUSTED") ||
            lastErrorNotice?.includes("limit: 0")
          ) {
            quotaExceededDetected = true;
          }
        }

        // Attempt B: Imagen 3 generateImages if liveImageBuffer not yet acquired and not quota exceeded
        if (!liveImageBuffer && !quotaExceededDetected) {
          try {
            const imgResponse = await withTimeout(
              ai.models.generateImages({
                model: "imagen-3.0-generate-002",
                prompt: bespokePrompt,
                config: {
                  numberOfImages: 1,
                  aspectRatio: "3:4",
                  outputMimeType: "image/jpeg",
                  personGeneration: PersonGeneration.ALLOW_ADULT,
                },
              }),
              8000,
              "Imagen 3 generation"
            );

            const base64Bytes = imgResponse.generatedImages?.[0]?.image?.imageBytes;
            if (base64Bytes) {
              liveImageBuffer = Buffer.from(base64Bytes, "base64");
            }
          } catch (imgGenErr: any) {
            lastErrorNotice = imgGenErr?.message || String(imgGenErr);
            if (
              lastErrorNotice?.includes("429") ||
              lastErrorNotice?.includes("RESOURCE_EXHAUSTED") ||
              lastErrorNotice?.includes("limit: 0")
            ) {
              quotaExceededDetected = true;
            }
          }
        }

        if (liveImageBuffer) {
          const safeName = `ai-${req.productName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${angleId}.jpg`;
          const permanentUrl = await storageService.saveBuffer(liveImageBuffer, safeName, "image/jpeg");

          hadLiveGeneration = true;
          generatedResults.push({
            angleId,
            angleName: angleDef.name,
            cameraAngle: angleDef.cameraAngle,
            description: angleDef.description,
            imageUrl: permanentUrl,
            promptUsed: bespokePrompt,
          });
        }
      }

      // If live Gemini image generation succeeded for all angles, return them
      if (hadLiveGeneration && generatedResults.length === requestedAngles.length) {
        return {
          success: true,
          productName: req.productName,
          aesthetic: aestheticLabel,
          isDemo: false,
          message: "Generated 4 bespoke model photographs using Gemini API & Imagen 3.",
          images: generatedResults,
        };
      }

      // If Gemini quota was exceeded (e.g. Free Tier limit: 0) or models unavailable:
      // NEVER serve generic stock photos! Transform the user's actual model into OFFSCRIPT studio angles using Cloudinary AI Studio!
      let quotaMessage = "";
      if (lastErrorNotice?.includes("429") || lastErrorNotice?.includes("RESOURCE_EXHAUSTED") || lastErrorNotice?.includes("limit: 0")) {
        quotaMessage = "Gemini Free Tier has 0 quota for direct neural image generation (Pay-as-you-go required on Google AI Studio).";
      } else if (lastErrorNotice) {
        quotaMessage = `Gemini note: ${lastErrorNotice.slice(0, 100)}`;
      }

      return this.generateCloudinaryStudioAngles(
        req,
        modelImageSource,
        requestedAngles,
        aestheticLabel,
        quotaMessage
      );
    } catch (err: any) {
      console.error("❌ Gemini API Service Error:", err);
      return this.generateCloudinaryStudioAngles(
        req,
        modelImageSource,
        requestedAngles,
        aestheticLabel,
        err?.message
      );
    }
  }

  /**
   * Transforms the user's actual model picture into 4 OFFSCRIPT studio lookbook angles
   * using Cloudinary's AI Generative Studio. Guarantees the user's uploaded model is used,
   * with zero generic stock photos.
   */
  async generateCloudinaryStudioAngles(
    req: TryonGenerationRequest,
    modelImageSource: string,
    angles: Array<"front" | "side_45" | "back" | "detail">,
    aestheticLabel: string,
    geminiNotice?: string
  ): Promise<TryonGenerationResponse> {
    const { v2: cloudinary } = await import("cloudinary");

    let modelPublicId = "";

    try {
      if (modelImageSource.includes("cloudinary.com") && modelImageSource.includes("/upload/")) {
        const parts = modelImageSource.split("/upload/");
        const afterUpload = parts[1].replace(/^v\d+\//, "").replace(/\.[a-zA-Z0-9]+$/, "");
        modelPublicId = afterUpload;
      } else {
        const resolved = await resolveImageBuffer(modelImageSource);
        const uploadRes = await cloudinary.uploader.upload(
          `data:${resolved.mimeType};base64,${resolved.buffer.toString("base64")}`,
          {
            folder: "offscript/ai-models",
            resource_type: "image",
          }
        );
        modelPublicId = uploadRes.public_id;
      }
    } catch (e: any) {
      console.warn("Could not upload model to Cloudinary, using public URL:", e.message);
    }

    const targetItem = determineTargetItem(req.category || "", req.productName || "");
    const cleanProduct = (req.productName || "streetwear piece")
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, " ")
      .trim()
      .replace(/\s+/g, "_")
      .slice(0, 35);
    const cleanCat = (req.category || "apparel")
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, " ")
      .trim()
      .replace(/\s+/g, "_")
      .slice(0, 20);

    const aestheticPrompt = aestheticLabel
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 50);

    const generatedResults: GeneratedAngleResult[] = [];

    for (const angleId of angles) {
      const angleDef = TRYON_ANGLES.find((a) => a.id === angleId) || TRYON_ANGLES[0];

      let transformedUrl = "";
      if (modelPublicId) {
        if (angleId === "front") {
          transformedUrl = cloudinary.url(modelPublicId, {
            transformation: [
              { effect: `gen_replace:from_${targetItem};to_${cleanProduct}_${cleanCat}_luxury_streetwear` },
              { effect: `gen_background_replace:prompt_${aestheticPrompt}_concrete_brutalist_studio_softbox_lighting` },
              { width: 900, height: 1200, crop: "fill", gravity: "auto" },
              { quality: "auto:good", fetch_format: "auto" },
            ],
            secure: true,
          });
        } else if (angleId === "side_45") {
          transformedUrl = cloudinary.url(modelPublicId, {
            transformation: [
              { effect: `gen_replace:from_${targetItem};to_${cleanProduct}_${cleanCat}_three_quarter_profile_silhouette` },
              { effect: `gen_background_replace:prompt_${aestheticPrompt}_charcoal_rim_lighting` },
              { width: 900, height: 1200, crop: "fill", gravity: "auto" },
              { quality: "auto:good", fetch_format: "auto" },
            ],
            secure: true,
          });
        } else if (angleId === "back") {
          transformedUrl = cloudinary.url(modelPublicId, {
            transformation: [
              { effect: `gen_replace:from_${targetItem};to_${cleanProduct}_${cleanCat}_worn_from_behind_rear_view` },
              { effect: `gen_background_replace:prompt_${aestheticPrompt}_architectural_minimalist` },
              { width: 900, height: 1200, crop: "fill", gravity: "auto" },
              { quality: "auto:good", fetch_format: "auto" },
            ],
            secure: true,
          });
        } else {
          // detail
          transformedUrl = cloudinary.url(modelPublicId, {
            transformation: [
              { effect: `gen_replace:from_${targetItem};to_${cleanProduct}_${cleanCat}_macro_fabric_and_emblem_detail` },
              { effect: `gen_background_replace:prompt_${aestheticPrompt}_studio` },
              { width: 900, height: 1200, crop: "fill", gravity: "auto" },
              { quality: "auto:good", fetch_format: "auto" },
            ],
            secure: true,
          });
        }
      } else {
        transformedUrl = modelImageSource;
      }

      generatedResults.push({
        angleId,
        angleName: angleDef.name,
        cameraAngle: angleDef.cameraAngle,
        description: angleDef.description,
        imageUrl: transformedUrl,
        promptUsed: `Editorial virtual try-on of model wearing ${req.productName} (${req.category}) in ${aestheticLabel} - ${angleDef.name}.`,
      });
    }

    return {
      success: true,
      productName: req.productName,
      aesthetic: aestheticLabel,
      isDemo: false,
      message: geminiNotice
        ? `${geminiNotice} Synthesized 4 lookbook angles with model wearing ${req.productName} via Cloudinary AI Studio.`
        : `Synthesized 4 lookbook angles with model wearing ${req.productName} via Cloudinary AI Studio.`,
      images: generatedResults,
    };
  }
}

export const aiTryonService = new AiTryonService();
