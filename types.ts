export interface ColorInfo {
    hex: string;
    name: string;
    role: string;
}

export interface GeneratedResult {
  imageUrl: string | null;
  text: string | null;
  colors: ColorInfo[];
}

// New type for structured element details from the AI, based on PROMPT_2
export interface ElementDetails {
  elementType: "product" | "design_element" | "architectural_feature" | "fashion_item" | "food_item" | "other";
  name: string;
  category: string;
  subcategory: string;
  style: {
    primary: string;
    secondary: string[];
    era: string;
  };
  materials: {
    primary: string;
    secondary: string[];
    finish: string;
  };
  colors: {
    dominant: string;
    accent: string[];
    colorScheme: string;
  };
  dimensions: {
    estimated: boolean;
    scale: string;
    proportions: string;
  };
  description: {
    overview: string;
    distinctiveFeatures: string[];
    functionality: string;
    condition: string;
  };
  market: {
    estimatedValue: string;
    availability: string;
    brands: string[];
    whereToBuy: string[];
  };
  culturalContext: {
    origin: string;
    significance: string;
    modernRelevance: string;
  };
  technicalDetails: {
    constructionMethod: string;
    qualityIndicators: string[];
    maintenance: string;
  };
  recommendations: {
    similarItems: string[];
    styling: string;
    occasions: string[];
  };
  metadata: {
    confidence: number;
    analysisTimestamp: string;
    elementPosition: string;
    imageQuality: string;
  };
}

// New type for the combined result of the element details API call
export interface ElementDetailsResult {
  imageUrl: string;
  details: ElementDetails | null;
}

// New type for visual search results
export interface SimilarItem {
  title: string;
  uri: string;
}