

import { GoogleGenAI, Modality, Part } from "@google/genai";
import type { GeneratedResult, ElementDetailsResult, SimilarItem, ElementDetails } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Safely parses JSON from a string that might be wrapped in markdown code fences.
 * @param text The raw text from the AI.
 * @returns A JSON object, or null if parsing fails.
 */
const parseJsonFromMarkdown = (text: string) => {
  const match = text.match(/```(json)?\s*([\s\S]+?)\s*```/);
  const jsonString = match && match[2] ? match[2].trim() : text.trim();
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Failed to parse JSON from AI response:", text, e);
    return null;
  }
};

/**
 * FIX (M2): Generic helper function to call the Gemini API and handle common errors.
 * This reduces code duplication across the service functions.
 * @param model The model to use.
 * @param contents The contents to send to the model.
 * @param config The configuration for the request.
 * @returns The parts of the first candidate's content.
 */
const callGeminiModel = async (
  model: string,
  contents: { parts: Part[] },
  config: { responseModalities: Modality[] }
): Promise<Part[]> => {
  const response = await ai.models.generateContent({ model, contents, config });

  if (response.promptFeedback?.blockReason) {
    throw new Error(`Request was blocked due to: ${response.promptFeedback.blockReason}`);
  }

  if (!response.candidates || response.candidates.length === 0) {
    throw new Error("The AI did not return a response. It may have been filtered for safety reasons.");
  }

  return response.candidates[0].content.parts;
};


export const generateMoodboard = async (
  base64ImageData: string,
  mimeType: string,
  prompt: string
): Promise<GeneratedResult> => {
  try {
    const contents = {
      parts: [
        {
          inlineData: {
            data: base64ImageData,
            mimeType: mimeType,
          },
        },
        {
          text: prompt,
        },
      ],
    };
    const config = {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    };
    
    const parts = await callGeminiModel('gemini-2.5-flash-image', contents, config);

    let imageUrl: string | null = null;
    let text: string | null = null;

    for (const part of parts) {
      if (part.text) {
        text = part.text;
      } else if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
      }
    }

    if (!imageUrl) {
        throw new Error("The AI did not return an image. It may have been filtered for safety reasons or the prompt was unclear.");
    }
    
    return { imageUrl, text, colors: [] };

  } catch (error) {
    console.error("Error calling Gemini API for mood board:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate mood board: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the AI.");
  }
};

export const getElementDetails = async (
  base64ImageDataWithMarker: string,
  mimeType: string
): Promise<ElementDetailsResult> => {
  try {
    const contents = {
      parts: [
        {
          inlineData: {
            data: base64ImageDataWithMarker,
            mimeType: mimeType,
          },
        },
        {
          text: `Your response MUST contain two parts in this order:
1. An IMAGE part: a new, photorealistic image.
2. A TEXT part: a single, valid JSON object with no other text or markdown fences.

---
IMAGE PART REQUIREMENTS:
CONTEXT: A bright red circular marker (•) indicates the exact element to analyze in the user-provided image.
TASK: Create a new, photorealistic image of ONLY the marked element.

IMAGE SPECIFICATIONS:
• SUBJECT: Isolate ONLY the element marked by the red dot. Exclude all other objects. Show the full, uncropped item.
• PRESENTATION: Use a uniform light gray (#f0f0f0) background, soft studio lighting with subtle shadows, and the most informative viewing angle (usually 3/4 perspective).
• SCALE: The element should fill 70-80% of the frame.
• QUALITY: High detail, photorealistic rendering, product photography standard.

---
TEXT PART REQUIREMENTS:
ROLE: You are a specialized product analyst.
TASK: Provide a detailed analysis of the marked element as a single, valid JSON object, following this exact schema:

{
  "elementType": "product" | "design_element" | "architectural_feature" | "fashion_item" | "food_item" | "other",
  "name": "Specific name or title of the element",
  "category": "Broad classification",
  "subcategory": "Specific classification",
  "style": {
    "primary": "Main style designation",
    "secondary": ["Additional style attributes"],
    "era": "Time period or design movement"
  },
  "materials": {
    "primary": "Main material or medium",
    "secondary": ["Additional materials if applicable"],
    "finish": "Surface treatment or texture"
  },
  "colors": {
    "dominant": "#HEX code",
    "accent": ["#HEX code array of other colors"],
    "colorScheme": "Monochrome"
  },
  "dimensions": {
    "estimated": true,
    "scale": "Medium",
    "proportions": "Description of proportional relationships"
  },
  "description": {
    "overview": "Comprehensive 2-3 sentence description",
    "distinctiveFeatures": ["Array of notable characteristics"],
    "functionality": "Primary purpose or use case",
    "condition": "New"
  },
  "market": {
    "estimatedValue": "Price range or value assessment",
    "availability": "Common",
    "brands": ["Similar or actual brands/manufacturers"],
    "whereToBuy": ["Suggested retailers or sources"]
  },
  "culturalContext": {
    "origin": "Geographic or cultural source",
    "significance": "Cultural or historical importance if any",
    "modernRelevance": "Current trends or applications"
  },
  "technicalDetails": {
    "constructionMethod": "How it's made or assembled",
    "qualityIndicators": ["Signs of quality or craftsmanship"],
    "maintenance": "Care or upkeep requirements"
  },
  "recommendations": {
    "similarItems": ["3-5 related products or alternatives"],
    "styling": "How to use, wear, or incorporate",
    "occasions": ["Appropriate contexts for use"]
  },
  "metadata": {
    "confidence": 0.95,
    "analysisTimestamp": "2024-01-01T12:00:00Z",
    "elementPosition": "Center",
    "imageQuality": "High"
  }
}`,
        },
      ],
    };

    const config = {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    };

    const parts = await callGeminiModel('gemini-2.5-flash-image', contents, config);

    let imageUrl: string | null = null;
    let details: any = null;

    for (const part of parts) {
      if (part.text) {
        details = parseJsonFromMarkdown(part.text);
      } else if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
      }
    }

    if (!imageUrl) {
      throw new Error("The AI failed to generate an image for the selected element.");
    }
    
    if (!details) {
        throw new Error("The AI failed to provide valid details for the selected element. The response was not valid JSON.");
    }

    return { imageUrl, details };

  } catch (error) {
    console.error("Error calling Gemini API for element details:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to get element details: ${error.message}`);
    }
    throw new Error("An unknown error occurred while getting element details.");
  }
};

export const enhanceImageTo8K = async (
  base64ImageData: string,
  mimeType: string
): Promise<string> => {
  try {
    const contents = {
      parts: [
        {
          inlineData: {
            data: base64ImageData,
            mimeType: mimeType,
          },
        },
        {
          text: 'Upscale this image to a photorealistic 8K resolution. Increase detail, sharpness, and clarity. Do not change the content, composition, or colors of the original image. Return only the enhanced image.',
        },
      ],
    };
    
    const config = {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    };

    const parts = await callGeminiModel('gemini-2.5-flash-image', contents, config);
    
    for (const part of parts) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
      }
    }

    throw new Error("The AI did not return an enhanced image. It may have been filtered.");
  } catch (error) {
    console.error("Error calling Gemini API for image enhancement:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to enhance image: ${error.message}`);
    }
    throw new Error("An unknown error occurred while enhancing the image.");
  }
};

export const findSimilarItems = async (details: ElementDetails): Promise<SimilarItem[]> => {
    let prompt = '';
    
    switch (details.elementType) {
        case 'fashion_item':
        case 'product':
            prompt = `Find the product named "${details.name}" on e-commerce websites like Amazon, Myntra, H&M, or other relevant online stores. Prioritize direct shopping links.`;
            break;
        case 'architectural_feature':
            prompt = `Find the location of the building or landmark known as "${details.name}" on Google Maps. Provide a direct link to the location.`;
            break;
        case 'food_item':
            prompt = `Find recipes for "${details.name}" from Zomato, food wikis, or popular recipe blogs.`;
            break;
        case 'design_element':
             prompt = `Find similar artwork or designs to "${details.name}" on Pinterest, Behance, or Dribbble.`;
             break;
        default:
            prompt = `Find more information and relevant links for "${details.name}".`;
            break;
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
            },
        });

        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks && chunks.length > 0) {
            return chunks
                .map(chunk => ({
                    title: chunk.web?.title || 'Untitled',
                    uri: chunk.web?.uri || '',
                }))
                .filter(item => item.uri);
        } else {
            return [];
        }
    } catch (error) {
        console.error("Error calling Gemini API for finding similar items:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to find similar items: ${error.message}`);
        }
        throw new Error("An unknown error occurred while searching for similar items.");
    }
};

export const generateCompositeImage = async (
  primaryImageBase64: string,
  primaryImageMimeType: string,
  secondaryImageBase64: string,
  secondaryImageMimeType: string,
  prompt: string
): Promise<string> => {
  try {
    const contents = {
      parts: [
        // FIX (H1): Swapped image order. The prompt expects the Style/Product image first (primary), then the User/Background image (secondary).
        { // Image 1: The content/style image (e.g., outfit, product)
          inlineData: {
            data: primaryImageBase64,
            mimeType: primaryImageMimeType,
          },
        },
        { // Image 2: The base image (e.g., person, background)
          inlineData: {
            data: secondaryImageBase64,
            mimeType: secondaryImageMimeType,
          },
        },
        {
          text: prompt,
        },
      ],
    };
    const config = {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    };

    const parts = await callGeminiModel('gemini-2.5-flash-image', contents, config);
    
    let imageUrl: string | null = null;
    let textResponse: string | null = null;

    for (const part of parts) {
      if (part.text) {
        textResponse = part.text;
      } else if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
      }
    }

    if (imageUrl) {
      return imageUrl;
    }
    
    if (textResponse) {
      throw new Error(`The AI returned text instead of an image. Response: "${textResponse.substring(0, 150)}..."`);
    }

    throw new Error("The AI did not return a composite image. The response was empty or filtered.");
  } catch (error) {
    console.error("Error calling Gemini API for composite image:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate composite image: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the composite image.");
  }
};