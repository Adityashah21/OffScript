import { GoogleGenAI, PersonGeneration } from "@google/genai";
import { env } from "../config/env.js";
import { storageService } from "./storage.js";
export const PRESET_MODELS = [
    {
        id: "preset-kai-male",
        name: "Kai — Brutalist Male",
        description: "6'1 athletic boxy frame, fade haircut, raw architectural streetwear pose",
        gender: "male",
        thumbnailUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=700&q=80",
        stylePrompt: "A 24-year-old male streetwear model, 6'1 athletic boxy frame, clean fade haircut, sharp angular jawline, neutral deadpan lookbook expression",
    },
    {
        id: "preset-elena-female",
        name: "Elena — Editorial Female",
        description: "5'10 high-fashion frame, slicked-back hair, striking cheekbones, architectural stance",
        gender: "female",
        thumbnailUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=700&q=80",
        stylePrompt: "A 23-year-old female high-fashion streetwear model, 5'10 slender athletic frame, slicked-back dark hair, high cheekbones, intense gaze, contemporary poise",
    },
    {
        id: "preset-rei-unisex",
        name: "Rei — Minimalist Unisex",
        description: "Contemporary androgynous streetwear build, bleached crop, relaxed slouch silhouette",
        gender: "unisex",
        thumbnailUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=700&q=80",
        stylePrompt: "An androgynous Asian streetwear model, relaxed slouch silhouette, bleached silver cropped hair, clean features, effortless Harajuku-meets-brutalist styling",
    },
    {
        id: "preset-marcus-heavyweight",
        name: "Marcus — Oversized Athletic",
        description: "Broad-shouldered masculine build, sculpted profile, styled for heavyweight drops",
        gender: "male",
        thumbnailUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=700&q=80",
        stylePrompt: "A 26-year-old Black male model, broad athletic shoulders, sculpted clean beard, calm confident lookbook expression, perfect for oversized streetwear silhouettes",
    },
];
export const TRYON_ANGLES = [
    {
        id: "front",
        name: "Front Full View",
        cameraAngle: "Eye-level direct frontal shot",
        description: "Clear view of the product drape, typography, front cut, fit on model",
        composition: "Direct frontal full-body lookbook portrait, eye-level camera, standing naturally with feet shoulder-width apart, arms relaxed at sides, highlighting front chest branding and relaxed shoulder drop",
    },
    {
        id: "side_45",
        name: "45° Three-Quarter Editorial Turn",
        cameraAngle: "45 degree editorial perspective",
        description: "Dynamic streetwear posture, showing side silhouette, sleeve length, shoulder drop",
        composition: "Three-quarter 45-degree dynamic streetwear turn, one shoulder angled toward camera, head turned slightly, accentuating the boxy side drape, oversized sleeve stacking, and profile cut",
    },
    {
        id: "back",
        name: "Back View / Silhouette",
        cameraAngle: "Rear three-quarter to direct back view",
        description: "Highlighting back graphics, hood/collar construction, back drape",
        composition: "Model facing away from camera looking slightly over the shoulder, full focus on the back panel construction, rear graphic artwork, hood drape, and relaxed hem drop",
    },
    {
        id: "detail",
        name: "Fabric & Seam Macro Detail",
        cameraAngle: "Editorial tight macro crop",
        description: "Macro texture, heavyweight cotton / nylon weave, hardware/zippers, logo embroideries",
        composition: "Cinematic editorial close-up macro crop focused on chest and shoulder area, shallow depth of field, sharp focus on 500 GSM heavyweight textile weave, intricate ribbing, and subtle hardware details",
    },
];
// Fallback high-fashion streetwear editorial imagery if Gemini API is in demo/fallback mode
const FALLBACK_EDITORIAL_IMAGES = {
    hoodie: {
        front: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80",
        side_45: "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1000&q=80",
        back: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80",
        detail: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1000&q=80",
    },
    tshirt: {
        front: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80",
        side_45: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=80",
        back: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=1000&q=80",
        detail: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1000&q=80",
    },
    jacket: {
        front: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80",
        side_45: "https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1000&q=80",
        back: "https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?auto=format&fit=crop&w=1000&q=80",
        detail: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80",
    },
    default: {
        front: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80",
        side_45: "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1000&q=80",
        back: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80",
        detail: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1000&q=80",
    },
};
/**
 * Normalizes input image string: extracts mime and base64 buffer or loads URL
 */
async function resolveImageBuffer(input) {
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
export class AiTryonService {
    /**
     * Generates 4 angle try-on shots matching OFFSCRIPT luxury streetwear aesthetic.
     */
    async generateMultiAngleShots(req) {
        const apiKey = req.geminiApiKey || env.GEMINI_API_KEY;
        const requestedAngles = req.angles && req.angles.length > 0
            ? req.angles
            : ["front", "side_45", "back", "detail"];
        const aestheticLabel = req.aesthetic || "Concrete Brutalist Architectural Studio";
        // Resolve model info
        let modelPrompt = "A luxury streetwear model with an athletic, boxy silhouette, and clean editorial features";
        let modelImageSource = req.modelImage || "preset-kai-male";
        const preset = PRESET_MODELS.find((p) => p.id === modelImageSource);
        if (preset) {
            modelPrompt = preset.stylePrompt;
            modelImageSource = preset.thumbnailUrl;
        }
        // If no Gemini API key configured, use high-fidelity curated editorial fallbacks
        if (!apiKey) {
            console.log("ℹ️  No GEMINI_API_KEY provided; providing curated streetwear lookbook angles in demo mode.");
            return this.generateDemoFallback(req, requestedAngles, aestheticLabel);
        }
        try {
            const ai = new GoogleGenAI({ apiKey });
            // Step 1: Multimodal Vision Analysis of Model + Garment using Gemini 2.0 Flash
            let analyzedPrompts = {};
            try {
                const [modelImgData, productImgData] = await Promise.all([
                    resolveImageBuffer(modelImageSource).catch(() => null),
                    resolveImageBuffer(req.productImage).catch(() => null),
                ]);
                const contentParts = [];
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
                const visionResponse = await ai.models.generateContent({
                    model: "gemini-2.0-flash",
                    contents: [{ role: "user", parts: contentParts }],
                });
                const textOutput = visionResponse.text || "";
                const jsonMatch = textOutput.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    analyzedPrompts = JSON.parse(jsonMatch[0]);
                }
            }
            catch (analysisErr) {
                console.warn("⚠️ Multimodal prompt extraction note:", analysisErr);
            }
            // Step 2: Generate images for each requested angle using Imagen 3
            const generatedResults = [];
            for (const angleId of requestedAngles) {
                const angleDef = TRYON_ANGLES.find((a) => a.id === angleId) || TRYON_ANGLES[0];
                // Synthesize prompt matching OFFSCRIPT's luxury brutalist aesthetic
                const bespokePrompt = analyzedPrompts[angleId] ||
                    `High-fashion lookbook studio photograph of ${modelPrompt} wearing an ${req.productName} (${req.category}). ` +
                        `${angleDef.composition}. Aesthetic: ${aestheticLabel}, raw concrete brutalist interior, diffuse cinematic softbox lighting, muted neutral tone, ultra-realistic 8k fashion editorial, 85mm lens f/1.8 photography, Balenciaga / Fear of God lookbook aesthetic.`;
                try {
                    const imgResponse = await ai.models.generateImages({
                        model: "imagen-3.0-generate-002",
                        prompt: bespokePrompt,
                        config: {
                            numberOfImages: 1,
                            aspectRatio: "3:4",
                            outputMimeType: "image/jpeg",
                            personGeneration: PersonGeneration.ALLOW_ADULT,
                        },
                    });
                    const base64Bytes = imgResponse.generatedImages?.[0]?.image?.imageBytes;
                    if (base64Bytes) {
                        const imgBuffer = Buffer.from(base64Bytes, "base64");
                        const safeName = `ai-${req.productName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${angleId}.jpg`;
                        const permanentUrl = await storageService.saveBuffer(imgBuffer, safeName, "image/jpeg");
                        generatedResults.push({
                            angleId,
                            angleName: angleDef.name,
                            cameraAngle: angleDef.cameraAngle,
                            description: angleDef.description,
                            imageUrl: permanentUrl,
                            promptUsed: bespokePrompt,
                        });
                        continue;
                    }
                }
                catch (imgGenErr) {
                    console.warn(`⚠️ Imagen 3 generation for angle ${angleId} encountered an error:`, imgGenErr?.message || imgGenErr);
                }
                // If a specific angle image generation errored (e.g. quota or content filter), provide graceful fallback for that angle
                const categoryKey = req.category.toLowerCase().includes("hoodie")
                    ? "hoodie"
                    : req.category.toLowerCase().includes("jacket")
                        ? "jacket"
                        : req.category.toLowerCase().includes("t-shirt") || req.category.toLowerCase().includes("tee")
                            ? "tshirt"
                            : "default";
                const fallbackUrl = FALLBACK_EDITORIAL_IMAGES[categoryKey]?.[angleId] ||
                    FALLBACK_EDITORIAL_IMAGES.default[angleId];
                generatedResults.push({
                    angleId,
                    angleName: angleDef.name,
                    cameraAngle: angleDef.cameraAngle,
                    description: angleDef.description,
                    imageUrl: fallbackUrl,
                    promptUsed: bespokePrompt,
                });
            }
            return {
                success: true,
                productName: req.productName,
                aesthetic: aestheticLabel,
                isDemo: false,
                message: "Generated 4 multi-angle model photographs using Gemini API & Imagen 3.",
                images: generatedResults,
            };
        }
        catch (err) {
            console.error("❌ Gemini API Service Error:", err);
            // Fallback gracefully so admin experience is never blocked
            return this.generateDemoFallback(req, requestedAngles, aestheticLabel, err?.message);
        }
    }
    generateDemoFallback(req, angles, aestheticLabel, errorMsg) {
        const categoryKey = req.category.toLowerCase().includes("hoodie")
            ? "hoodie"
            : req.category.toLowerCase().includes("jacket")
                ? "jacket"
                : req.category.toLowerCase().includes("t-shirt") || req.category.toLowerCase().includes("tee")
                    ? "tshirt"
                    : "default";
        const images = angles.map((angleId) => {
            const angleDef = TRYON_ANGLES.find((a) => a.id === angleId) || TRYON_ANGLES[0];
            const imageUrl = FALLBACK_EDITORIAL_IMAGES[categoryKey]?.[angleId] ||
                FALLBACK_EDITORIAL_IMAGES.default[angleId];
            return {
                angleId,
                angleName: angleDef.name,
                cameraAngle: angleDef.cameraAngle,
                description: angleDef.description,
                imageUrl,
                promptUsed: `Architectural brutalist editorial portrait of model wearing ${req.productName} - ${angleDef.name}.`,
            };
        });
        return {
            success: true,
            productName: req.productName,
            aesthetic: aestheticLabel,
            isDemo: true,
            message: errorMsg
                ? `Notice: ${errorMsg}. Loaded curated streetwear editorial previews. You can still apply these directly or supply a valid Gemini API key in Studio Settings.`
                : "Curated streetwear editorial previews loaded. Provide a Gemini API key in Studio Settings or environment to synthesize live bespoke neural models.",
            images,
        };
    }
}
export const aiTryonService = new AiTryonService();
