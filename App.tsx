
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { ResultDisplay } from './components/ResultDisplay';
import { MagicWandIcon, UserIcon } from './components/IconComponents';
import { generateMoodboard, getElementDetails, enhanceImageTo8K, findSimilarItems, generateCompositeImage } from './services/geminiService';
import type { GeneratedResult, ElementDetailsResult, SimilarItem } from './types';

// FIX: Define discriminated union types for uploaderConfig to allow for type narrowing.
type UploaderConfigWithSecondary = {
  showSecondary: true;
  primaryLabel: string;
  secondaryLabel: string;
};

type UploaderConfigWithoutSecondary = {
  showSecondary: false;
  primaryLabel: string;
};

type UploaderConfigItem = UploaderConfigWithSecondary | UploaderConfigWithoutSecondary;

const imageTypes = [
  { label: 'Fashion/Outfit', value: 'FASHION/OUTFIT' },
  { label: 'Product', value: 'PRODUCT' },
  { label: 'Interior/Room', value: 'INTERIOR/ROOM' },
  { label: 'Landscape/Scene', value: 'LANDSCAPE/SCENE' },
  { label: 'Food', value: 'FOOD' },
  { label: 'Artwork', value: 'ARTWORK' },
  { label: 'Other', value: 'OTHER' },
];

// FIX: Apply the discriminated union type to uploaderConfig.
const uploaderConfig: Record<string, UploaderConfigItem> = {
  'FASHION/OUTFIT': { showSecondary: true, primaryLabel: '1. Upload Look Image', secondaryLabel: '2. Upload Your Photo' },
  'PRODUCT': { showSecondary: true, primaryLabel: '1. Upload Product Image', secondaryLabel: '2. Upload Background Image' },
  'INTERIOR/ROOM': { showSecondary: false, primaryLabel: '1. Upload Image' },
  'LANDSCAPE/SCENE': { showSecondary: false, primaryLabel: '1. Upload Image' },
  'FOOD': { showSecondary: false, primaryLabel: '1. Upload Image' },
  'ARTWORK': { showSecondary: false, primaryLabel: '1. Upload Image' },
  'OTHER': { showSecondary: false, primaryLabel: '1. Upload Image' },
};

// FIX (L1, H2): Moved the large, non-editable prompt to a constant to improve readability and prevent user modification.
const DEFAULT_MOODBOARD_PROMPT = `You are an expert visual analyst and mood board designer who creates clean, informative, and beautifully organized collages that break down any image into its component parts with shopping information and style insights.

YOUR EXACT MISSION: Create a mood board that looks EXACTLY like a high-end fashion magazine's shopping page or a professional interior designer's client presentation board - clean, organized, shoppable, and annotated with personality.

══════════════════════════════════════════════════════════════════════
UNIVERSAL ANALYSIS FRAMEWORK - WORKS FOR ANY IMAGE TYPE
══════════════════════════════════════════════════════════════════════

STEP 1: IDENTIFY WHAT YOU'RE LOOKING AT
Look at the image and categorize it:
- FASHION/OUTFIT → Extract garments, accessories, shoes
- INTERIOR/ROOM → Extract furniture, decor, materials  
- PRODUCT → Extract components, packaging, details
- LANDSCAPE/SCENE → Extract elements, colors, mood components
- FOOD → Extract ingredients, plating, styling elements
- ARTWORK → Extract techniques, colors, compositional elements

STEP 2: EXTRACT REAL ELEMENTS (CRITICAL - NO INVENTING!)
Create an inventory of ONLY things actually visible:
- Main subject (centered, largest)
- Individual components (8-12 items maximum)
- Colors and textures
- Patterns and details
- Any text or branding visible

STEP 3: CREATE THE MOOD BOARD COLLAGE

EXACT VISUAL STYLE TO FOLLOW:

BACKGROUND:
- Soft, neutral background (#F5F5F0 to #FAFAF8)
- Subtle paper texture (like craft paper or canvas)
- Light beige/cream tones

LAYOUT STRUCTURE:
- CENTER: A clean, precise CUTOUT of the main subject (e.g., the person and their outfit, the piece of furniture). This cutout should be the focal point and occupy 40% of the canvas.
  - The cutout MUST have clean edges, removing the original background entirely.
  - Place this cutout on the mood board with a subtle drop shadow to make it pop.
  
- SURROUNDING ELEMENTS: Individual items arranged around center
  - Each item in its own "frame":
    * White polaroid-style borders OR
    * Taped corners with washi tape effect OR  
    * Clean cutouts with soft shadows
  - Vary sizes (some bigger, some smaller)
  - Slight rotation (5-15 degrees) for organic feel
  - Overlapping is okay but maintain clarity

ANNOTATION STYLE:
- Hand-drawn arrows (curved, playful) pointing to elements
- Handwritten-style labels in black or dark gray
- Mix of fonts:
  - Clean sans-serif for product names/brands
  - Casual handwriting for descriptions
  - Small typed font for sources/prices

REQUIRED ANNOTATIONS FOR EACH ELEMENT:
- Item name/type
- Brand (if identifiable) or style descriptor
- Source: Where to buy (store name or "Similar at: [store]")
- One distinctive feature (material, color, special detail)
- Price range indicator ($, $$, $$$) if applicable

DECORATIVE ELEMENTS (SPARINGLY):
- Small doodles: stars (☆), hearts (♡), arrows (→)
- Washi tape strips on corners
- Subtle geometric shapes (circles, triangles) as accents
- Tiny sketches showing construction/detail
- Color swatches as small squares/circles

STEP 4: INFORMATION OVERLAY

Add these information zones to your collage:

COLOR PALETTE BAR:
- 5 circular color swatches extracted from image
- Hex codes below each
- Small label: "Color Story" or "Palette"

KEY DETAILS BOX (semi-transparent white):
For FASHION:
- Occasion: Work/Casual/Formal/Weekend
- Season: Spring/Summer/Fall/Winter/Trans-seasonal  
- Style: Minimalist/Romantic/Edgy/Classic/Trendy
- Price Range: Budget-friendly/Mid-range/Investment

For INTERIORS:
- Style: Scandinavian/Industrial/Bohemian/Modern/Traditional
- Room Type: Living/Bedroom/Kitchen/Office
- Mood: Cozy/Minimal/Luxe/Eclectic/Fresh
- Budget Level: DIY/Affordable/Mid-range/High-end

For PRODUCTS:
- Category: Tech/Beauty/Home/Fashion/Food
- Target User: Professional/Student/Parent/Enthusiast
- Quality Tier: Entry/Standard/Premium/Luxury
- Key Feature: What makes it special

SHOPPING LIST CORNER:
- Bullet points of items with sources
- Quick "Get the Look" or "Shop This Style" header
- Website names or store locations

STYLE NOTES (handwritten appearance):
- 2-3 observations about the overall aesthetic
- Tips for recreating or styling
- Trend connections or timeless elements

SPECIFIC RULES BY IMAGE TYPE:

FOR FASHION/OUTFITS:
- Show garments as flat lays or on invisible mannequin
- Include texture close-ups for fabrics
- Add sizing/fit notes (oversized, fitted, true to size)
- Specify occasions suitable for outfit

FOR INTERIORS:
- Include material swatches
- Show furniture from best angle
- Add dimensions estimates (small/medium/large space)
- Note lighting considerations

FOR PRODUCTS:
- Show multiple angles if relevant
- Include packaging if visible
- Add use-case scenarios
- Compare to similar products

FOR LANDSCAPE/SCENES:
- Extract mood elements (lighting, atmosphere)
- Identify location markers or style and if a specific real-world location is identifiable, provide its name, approximate GPS coordinates (latitude, longitude), and a clickable Google Maps link in the format https://www.google.com/maps?q=LAT,LONG.
- Create color story from environment
- Note time of day/season if relevant

FOR FOOD:
- Identify ingredients
- Note plating techniques
- Include serving suggestions
- Specify cuisine style

QUALITY REQUIREMENTS:

MUST HAVE:
✓ Clean, organized layout (not chaotic)
✓ Every element labeled with source/brand
✓ Consistent soft color scheme
✓ Professional but approachable aesthetic
✓ All items actually from the source image
✓ Shopping/sourcing information
✓ Color palette with hex codes
✓ Playful but minimal decorative elements

MUST AVOID:
✗ Overwhelming effects or filters
✗ Too many decorative elements
✗ Invented items not in image
✗ Messy, cluttered composition
✗ Generic descriptions
✗ Missing source information
✗ Harsh colors or contrasts
✗ Unprofessional appearance

OUTPUT COMPOSITION CHECKLIST:
□ Main subject clearly featured in center
□ 6-10 individual elements arranged around it
□ Each element has brand/source label
□ Color palette included (5 colors)
□ Handwritten-style annotations present
□ Clean, magazine-quality presentation
□ Soft, neutral background
□ Shopping sources identified
□ Style/mood descriptors included
□ Overall look is Pinterest-worthy

FINAL TONE: 
Create something that looks like it came from:
- A high-end fashion magazine's shopping pages
- A professional interior designer's mood board
- A product stylist's presentation deck
- A creative director's inspiration board

The result should be IMMEDIATELY useful for shopping, styling, or recreating the look. Someone should be able to take your mood board and actually go buy the items or recreate the style. Make it clean enough for a client presentation but fun enough for social media sharing.

Remember: This is about INFORMATION + AESTHETICS. Every element should be both beautiful AND useful. Think "shoppable inspiration" meets "editorial design."`;

const App: React.FC = () => {
  const [primaryImageFile, setPrimaryImageFile] = useState<File | null>(null);
  const [primaryImagePreview, setPrimaryImagePreview] = useState<string | null>(null);
  const [secondaryImageFile, setSecondaryImageFile] = useState<File | null>(null);
  const [secondaryImagePreview, setSecondaryImagePreview] = useState<string | null>(null);

  const [imageType, setImageType] = useState<string>(imageTypes[0].value);
  const [customImageType, setCustomImageType] = useState<string>('');
  // FIX (H2): Replaced the large editable prompt state with a state for user's additional instructions.
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [generatedResult, setGeneratedResult] = useState<GeneratedResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [elementDetailsResult, setElementDetailsResult] = useState<ElementDetailsResult | null>(null);
  const [isElementLoading, setIsElementLoading] = useState<boolean>(false);
  const [elementError, setElementError] = useState<string | null>(null);
  const [clickPosition, setClickPosition] = useState<{ x: number, y: number } | null>(null);

  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [enhancementError, setEnhancementError] = useState<string | null>(null);

  const [similarItems, setSimilarItems] = useState<SimilarItem[] | null>(null);
  const [isFindingSimilar, setIsFindingSimilar] = useState<boolean>(false);
  const [findSimilarError, setFindSimilarError] = useState<string | null>(null);
  
  const [compositeResultUrl, setCompositeResultUrl] = useState<string | null>(null);
  const [isGeneratingComposite, setIsGeneratingComposite] = useState<boolean>(false);
  const [compositeError, setCompositeError] = useState<string | null>(null);


  useEffect(() => {
    const cursorGlow = document.querySelector('.cursor-glow') as HTMLElement;
    if (!cursorGlow) return;

    const handleMouseMove = (e: MouseEvent) => {
        requestAnimationFrame(() => {
            cursorGlow.style.transform = `translate(${e.clientX - 300}px, ${e.clientY - 300}px)`;
        });
    };
    
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const resetAllOutputs = () => {
    setGeneratedResult(null);
    setElementDetailsResult(null);
    setClickPosition(null);
    setError(null);
    setElementError(null);
    setEnhancementError(null);
    setSimilarItems(null);
    setFindSimilarError(null);
    setCompositeResultUrl(null);
    setCompositeError(null);
  };

  const handlePrimaryImageUpload = (file: File) => {
    setPrimaryImageFile(file);
    setPrimaryImagePreview(URL.createObjectURL(file));
    setSecondaryImageFile(null);
    setSecondaryImagePreview(null);
    resetAllOutputs();
  };

  const handleSecondaryImageUpload = (file: File) => {
    setSecondaryImageFile(file);
    setSecondaryImagePreview(URL.createObjectURL(file));
  };

  const handleImageTypeChange = (newType: string) => {
      const currentConfig = uploaderConfig[imageType as keyof typeof uploaderConfig];
      const newConfig = uploaderConfig[newType as keyof typeof uploaderConfig];

      if (currentConfig.showSecondary && !newConfig.showSecondary) {
          setSecondaryImageFile(null);
          setSecondaryImagePreview(null);
      }
      setImageType(newType);
  };


  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleGenerateMoodboard = useCallback(async () => {
    if (!primaryImageFile) {
      setError('Please upload the primary image first.');
      return;
    }

    setIsLoading(true);
    setGeneratedResult(null);
    setElementDetailsResult(null);
    setClickPosition(null);
    setError(null);
    setElementError(null);
    setEnhancementError(null);
    setSimilarItems(null);
    setFindSimilarError(null);

    try {
      const base64Data = await fileToBase64(primaryImageFile);
      const finalImageType = imageType === 'OTHER' && customImageType ? customImageType : imageType;
      // FIX (H2): Combine the default prompt with the optional user prompt.
      let finalPrompt = `ATTENTION: The uploaded image is categorized as ${finalImageType}. Prioritize the specific rules for this category in your analysis.\n\n${DEFAULT_MOODBOARD_PROMPT}`;
      if (userPrompt.trim()) {
        finalPrompt += `\n\nADDITIONAL USER INSTRUCTIONS: ${userPrompt.trim()}`;
      }
      const result = await generateMoodboard(base64Data, primaryImageFile.type, finalPrompt);
      setGeneratedResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Moodboard generation failed.');
      console.error("Moodboard task failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [primaryImageFile, userPrompt, imageType, customImageType]);

  const handleGenerateComposite = useCallback(async () => {
    const currentConfig = uploaderConfig[imageType as keyof typeof uploaderConfig];
    if (!currentConfig.showSecondary) return;
    
    if (!primaryImageFile || !secondaryImageFile) {
        setCompositeError('Please upload both images first.');
        return;
    }

    setIsGeneratingComposite(true);
    setCompositeResultUrl(null);
    setCompositeError(null);

    try {
        let compositePrompt = '';
        if (imageType === 'FASHION/OUTFIT') {
          compositePrompt = `You will receive exactly TWO images:
IMAGE 1 = STYLE REFERENCE (the outfit to copy onto the user)
IMAGE 2 = USER IMAGE (the person whose face and body must be preserved)

CORE INSTRUCTIONS
STEP 1: EXTRACT FROM STYLE REFERENCE (IMAGE 1)
COPY THESE ELEMENTS ONLY:

All clothing items (shirts, pants, jackets, dresses, etc.)
Accessories (watches, jewelry, bags, hats, sunglasses, belts)
Footwear (shoes, boots, sneakers)
Colors, patterns, textures, and styling details

IGNORE COMPLETELY:

The reference person's face
The reference person's body shape
The reference person's pose
The reference background


STEP 2: PRESERVE FROM USER IMAGE (IMAGE 2)
KEEP EXACTLY AS IS - DO NOT MODIFY:

Face (all facial features, skin tone, expression, beard, facial hair)
Body structure (height, build, body proportions)
Natural hair (color, style, length)
All identifying characteristics

CRITICAL: The person in the final image MUST be immediately recognizable as the same person from IMAGE 2. Their face is the anchor—never alter it.

STEP 3: CREATE NEW ELEMENTS
POSE:
Generate a natural model pose that complements the outfit style. DO NOT copy the pose from either input image. Choose a stance that showcases the clothing effectively (examples: hands in pockets for casual, confident standing for formal, relaxed posture for streetwear).
BACKGROUND:
City street scene with these EXACT specifications:

Time: Overcast daytime (NOT evening, NOT golden hour)
Lighting: Natural diffused light, neutral white balance (5500K-6500K color temperature)
Composition: Clean urban street, modern architecture blurred in background
Depth: Shallow depth of field—sharp focus on person, background softly blurred
Population: Empty or minimal (no crowds, no visible faces of other people)
Atmosphere: Professional fashion photography aesthetic


EXECUTION PRIORITY
Priority 1: USER'S FACE from Image 2 → Must be 100% preserved
Priority 2: USER'S BODY STRUCTURE from Image 2 → Must maintain proportions
Priority 3: CLOTHING from Image 1 → Transfer accurately onto user's body
Priority 4: BACKGROUND → Create specified city street scene
Priority 5: POSE → Generate complementary stance (ignore both input poses)

OUTPUT REQUIREMENTS
Produce ONE image where:
✓ The person is immediately recognizable as the user from IMAGE 2
✓ The person is wearing the complete outfit from IMAGE 1
✓ The person is in a NEW pose (not copied from either input)
✓ Background is overcast daytime city street (well-lit, neutral tones, not crowded)
✓ Professional photography quality (sharp subject, blurred background)
✓ Natural lighting that flatters both the person and the outfit
✓ No distortions, artifacts, or unnatural features

WHAT YOU ARE DOING
This is a virtual try-on transformation:

Take the OUTFIT from IMAGE 1 (the style reference)
Put it on the USER from IMAGE 2 (preserving their face and body)
Place them in a professional city street setting with overcast natural light
Create a model-quality photo showcasing the styled look

The user from IMAGE 2 should look like themselves wearing the outfit from IMAGE 1 in a fashion photoshoot.`;
        } else if (imageType === 'PRODUCT') {
          compositePrompt = `**PRODUCT STAGING TASK**
You are a professional product photographer. You will receive two images: IMAGE 1 (a background scene) and IMAGE 2 (a product).
Your job is to place the product from IMAGE 2 into the background from IMAGE 1.
**RULES:**
1.  **Cut out product:** Perfectly isolate the product from IMAGE 2.
2.  **Place realistically:** Place the product into IMAGE 1. Make lighting, shadows, and perspective look natural.
3.  **Plausible scale:** Ensure the product is a realistic size for the scene.
4.  **Output:** Provide ONLY the final composite photo. Do not output the original images.`;
        }
        
        if (compositePrompt) {
            const primaryImageBase64 = await fileToBase64(primaryImageFile);
            const secondaryImageBase64 = await fileToBase64(secondaryImageFile);
            const resultUrl = await generateCompositeImage(
              primaryImageBase64,
              primaryImageFile.type,
              secondaryImageBase64,
              secondaryImageFile.type,
              compositePrompt
            );
            setCompositeResultUrl(resultUrl);
        }
    } catch (err) {
      setCompositeError(err instanceof Error ? err.message : 'Composite image generation failed.');
      console.error("Composite image task failed:", err);
    } finally {
      setIsGeneratingComposite(false);
    }
}, [primaryImageFile, secondaryImageFile, imageType]);

  const handleImageClick = useCallback(async (event: React.MouseEvent<HTMLImageElement>) => {
    if (!generatedResult?.imageUrl) return;

    const imageElement = event.currentTarget;
    const rect = imageElement.getBoundingClientRect();
    
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setClickPosition({ x, y });

    setIsElementLoading(true);
    setElementDetailsResult(null);
    setElementError(null);
    setSimilarItems(null);
    setFindSimilarError(null);

    const scaleX = imageElement.naturalWidth / imageElement.width;
    const scaleY = imageElement.naturalHeight / imageElement.height;

    const originalX = x * scaleX;
    const originalY = y * scaleY;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        setElementError("Could not process image click.");
        setIsElementLoading(false);
        return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = generatedResult.imageUrl;
    
    img.onload = async () => {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);

        const radius = Math.max(5, img.naturalWidth * 0.01);
        ctx.beginPath();
        ctx.arc(originalX, originalY, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'red';
        ctx.fill();
        ctx.lineWidth = Math.max(2, radius * 0.2);
        ctx.strokeStyle = 'white';
        ctx.stroke();

        const mimeType = 'image/jpeg';
        const base64DataWithMarker = canvas.toDataURL(mimeType).split(',')[1];
        
        try {
            const result = await getElementDetails(base64DataWithMarker, mimeType);
            setElementDetailsResult(result);
        } catch (err) {
            setElementError(err instanceof Error ? err.message : 'Failed to get details.');
        } finally {
            setIsElementLoading(false);
        }
    };
    img.onerror = () => {
        setElementError("Could not load image to process click.");
        setIsElementLoading(false);
        setClickPosition(null);
    };

  }, [generatedResult]);

  const handleEnhanceImage = useCallback(async () => {
    if (!generatedResult?.imageUrl) return;

    setIsEnhancing(true);
    setEnhancementError(null);
    try {
      const parts = generatedResult.imageUrl.split(',');
      const meta = parts[0];
      const base64Data = parts[1];
      const mimeType = meta.split(':')[1].split(';')[0];
      
      const enhancedImageUrl = await enhanceImageTo8K(base64Data, mimeType);
      
      const link = document.createElement('a');
      link.href = enhancedImageUrl;
      const fileType = enhancedImageUrl.split(';')[0].split('/')[1] || 'png';
      link.download = `creative-collage-8k-${Date.now()}.${fileType}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      setEnhancementError(err instanceof Error ? err.message : 'Failed to enhance image.');
    } finally {
      setIsEnhancing(false);
    }
  }, [generatedResult]);

  const handleFindSimilar = useCallback(async () => {
    if (!elementDetailsResult?.details) return;

    setIsFindingSimilar(true);
    setFindSimilarError(null);
    setSimilarItems(null);

    try {
      const items = await findSimilarItems(elementDetailsResult.details);
      setSimilarItems(items);
    } catch (err) {
      setFindSimilarError(err instanceof Error ? err.message : 'Failed to find similar items.');
    } finally {
      setIsFindingSimilar(false);
    }

  }, [elementDetailsResult]);

  const currentConfig = uploaderConfig[imageType as keyof typeof uploaderConfig];
  
  const compositeButtonLabel = imageType === 'FASHION/OUTFIT' ? 'Virtual Try-On' : 'Stage Product';
  const compositeButtonLoadingLabel = imageType === 'FASHION/OUTFIT' ? 'Applying Outfit...' : 'Staging Product...';

  return (
    <>
      <div className="min-h-screen font-sans text-gray-200">
        <main className="container mx-auto px-4 py-8 md:py-12">
          <header className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-fuchsia-400 via-pink-400 to-purple-500">
              Vision Board AI
            </h1>
            <p className="mt-4 text-lg text-gray-300 max-w-3xl mx-auto">
              Instantly transform any image into a work of art and information. This app deconstructs your visuals into beautiful, interactive mood boards, complete with style notes, color palettes, and a deep-dive analysis on any element you click. Your inspiration, reimagined.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Input Panel */}
            <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/10 self-start">
              <div className="space-y-6">
                <div>
                  <label className="text-lg font-semibold text-gray-200 mb-2 block">{currentConfig.primaryLabel}</label>
                  <ImageUploader onImageUpload={handlePrimaryImageUpload} imagePreviewUrl={primaryImagePreview} />
                </div>
                
                {/* FIX: Use currentConfig.showSecondary to correctly narrow the type and access secondaryLabel. */}
                {currentConfig.showSecondary && (
                   <div>
                    <label className="text-lg font-semibold text-gray-200 mb-2 block">{currentConfig.secondaryLabel}</label>
                    <ImageUploader onImageUpload={handleSecondaryImageUpload} imagePreviewUrl={secondaryImagePreview} />
                  </div>
                )}

                 <div>
                  {/* FIX: Use currentConfig.showSecondary for type-safe conditional rendering. */}
                  <label className="text-lg font-semibold text-gray-200 mb-2 block">{currentConfig.showSecondary ? '3.' : '2.'} Select Image Type</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {imageTypes.map((type) => (
                          <button
                              key={type.value}
                              onClick={() => handleImageTypeChange(type.value)}
                              className={`p-2 rounded-lg text-sm font-semibold transition-all duration-200 border-2 ${
                                  imageType === type.value
                                      ? 'bg-fuchsia-500/80 text-white border-fuchsia-400 ring-2 ring-fuchsia-400/50 shadow-lg shadow-fuchsia-500/20'
                                      : 'bg-white/5 text-gray-200 border-white/10 hover:bg-white/10 hover:border-white/20'
                              }`}
                          >
                              {type.label}
                          </button>
                      ))}
                  </div>
                  {imageType === 'OTHER' && (
                    <div className="mt-3">
                      <input
                        type="text"
                        value={customImageType}
                        onChange={(e) => setCustomImageType(e.target.value)}
                        className="w-full p-2 bg-black/20 border-2 border-white/10 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition duration-200 text-gray-200 placeholder-gray-400"
                        placeholder="e.g., Vintage Car, Architectural Sketch"
                      />
                    </div>
                  )}
                </div>

                <div>
                  {/* FIX (H2): Updated label and textarea for optional user instructions. */}
                  <label htmlFor="prompt-input" className="text-lg font-semibold text-gray-200 mb-2 block">
                    {currentConfig.showSecondary ? '4.' : '3.'} Add Instructions (Optional)
                  </label>
                  <textarea
                    id="prompt-input"
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    className="w-full h-24 p-3 bg-black/20 border-2 border-white/10 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition duration-200 resize-none text-gray-200 placeholder-gray-400"
                    placeholder="e.g., make it feel more vintage, focus on the leather jacket..."
                  />
                </div>
                {currentConfig.showSecondary ? (
                    <div className="space-y-4">
                        <button
                            onClick={handleGenerateMoodboard}
                            disabled={isLoading || !primaryImageFile}
                            className="w-full group relative flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:scale-100 shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/30"
                        >
                            <span className="absolute inset-0 bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                            <MagicWandIcon />
                            <span className="relative">{isLoading ? 'Creating Mood Board...' : 'Generate Mood Board'}</span>
                        </button>
                        <button
                            onClick={handleGenerateComposite}
                            disabled={isGeneratingComposite || !primaryImageFile || !secondaryImageFile}
                            className="w-full group relative flex items-center justify-center gap-2 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:scale-100 shadow-lg shadow-fuchsia-500/20 hover:shadow-xl hover:shadow-purple-500/30"
                        >
                            <span className="absolute inset-0 bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                            <UserIcon />
                            <span className="relative">{isGeneratingComposite ? compositeButtonLoadingLabel : compositeButtonLabel}</span>
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleGenerateMoodboard}
                        disabled={isLoading || !primaryImageFile}
                        className="w-full group relative flex items-center justify-center gap-2 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:scale-100 shadow-lg shadow-fuchsia-500/20 hover:shadow-xl hover:shadow-purple-500/30"
                    >
                        <span className="absolute inset-0 bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                        <MagicWandIcon />
                        <span className="relative">{isLoading ? 'Conjuring Magic...' : 'Generate Mood Board'}</span>
                    </button>
                )}
                {error && <p className="text-red-400 text-center mt-2">{error}</p>}
              </div>
            </div>

            {/* Output Panel */}
            <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/10">
              <label className="text-lg font-semibold text-gray-200 mb-4 block text-center lg:text-left">Your Magical Creation</label>
              <ResultDisplay 
                result={generatedResult} 
                isLoading={isLoading}
                onImageClick={handleImageClick}
                elementDetailsResult={elementDetailsResult}
                isElementLoading={isElementLoading}
                elementError={elementError}
                clickPosition={clickPosition}
                onEnhanceImage={handleEnhanceImage}
                isEnhancing={isEnhancing}
                enhancementError={enhancementError}
                onFindSimilar={handleFindSimilar}
                similarItems={similarItems}
                isFindingSimilar={isFindingSimilar}
                findSimilarError={findSimilarError}
                imageType={imageType}
                compositeResultUrl={compositeResultUrl}
                isGeneratingComposite={isGeneratingComposite}
                compositeError={compositeError}
              />
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default App;