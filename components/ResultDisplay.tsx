import React from 'react';
import type { GeneratedResult, ElementDetailsResult, ColorInfo, ElementDetails, SimilarItem } from '../types';
import { SparklesIcon, DownloadIcon, StarIcon, SearchIcon, UserIcon } from './IconComponents';

interface ResultDisplayProps {
  result: GeneratedResult | null;
  isLoading: boolean;
  onImageClick: (event: React.MouseEvent<HTMLImageElement>) => void;
  elementDetailsResult: ElementDetailsResult | null;
  isElementLoading: boolean;
  elementError: string | null;
  clickPosition: { x: number, y: number } | null;
  onEnhanceImage: () => void;
  isEnhancing: boolean;
  enhancementError: string | null;
  onFindSimilar: () => void;
  similarItems: SimilarItem[] | null;
  isFindingSimilar: boolean;
  findSimilarError: string | null;
  imageType: string;
  compositeResultUrl: string | null;
  isGeneratingComposite: boolean;
  compositeError: string | null;
}

const LoadingSpinner: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-fuchsia-400">
      <svg className="animate-spin h-12 w-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="text-lg font-semibold text-gray-200">Creating your masterpiece...</p>
    </div>
);

// FIX (M2): Created a reusable inline spinner component to avoid code duplication.
const InlineSpinner: React.FC<{ className?: string }> = ({ className = 'h-5 w-5' }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);


const Placeholder: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 bg-black/20 rounded-2xl p-8 border border-white/10">
        <SparklesIcon className="w-16 h-16 text-fuchsia-400 opacity-50" />
        <h3 className="mt-4 text-xl font-bold text-gray-200">Your creation will appear here</h3>
        <p className="mt-1 text-gray-400">Upload an image and let the magic begin!</p>
    </div>
);

const AnalysisDisplay: React.FC<{ text: string | null }> = ({ text }) => {
    if (!text) return null;

    const analysisText = text.split('=== COLOR PALETTE ===')[0];
    const sections = analysisText.split(/===\s*(.*?)\s*===/).filter(part => part.trim() !== '');

    const formatTitle = (title: string) => {
        return title
            .toLowerCase()
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <div className="bg-black/20 p-4 rounded-2xl border border-white/10 space-y-4">
            {sections.map((section, index) => {
                if (index % 2 !== 0) return null; 
                
                const title = section;
                const content = sections[index + 1] || '';

                return (
                    <div key={index}>
                        <h4 className="font-semibold text-fuchsia-300 text-lg mb-2">{formatTitle(title)}</h4>
                        <div className="text-gray-300 whitespace-pre-wrap space-y-1 text-sm">
                            {content.trim().split('\n').map((line, lineIndex) => {
                                const trimmedLine = line.trim();
                                if (trimmedLine.startsWith('•')) {
                                    return <p key={lineIndex} className="pl-4">{trimmedLine}</p>;
                                }
                                return trimmedLine && <p key={lineIndex}>{trimmedLine}</p>;
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};


const ColorPalette: React.FC<{ colors: ColorInfo[] }> = ({ colors }) => {
  if (!colors || colors.length === 0) return null;

  return (
    <div className="bg-black/20 p-4 rounded-2xl border border-white/10">
        <h4 className="font-semibold text-fuchsia-300 text-lg mb-3">Color Palette</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {colors.map((color, index) => (
                <div key={`${color.hex}-${index}`} className="flex items-center gap-3">
                    <div 
                        className="w-10 h-10 rounded-full border-2 border-white/20 shadow-lg flex-shrink-0"
                        style={{ backgroundColor: color.hex }}
                    ></div>
                    <div>
                        <p className="font-semibold text-gray-200">{color.role}</p>
                        <p className="text-sm font-mono text-gray-400 uppercase">{color.hex} - {color.name}</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

const ClickMarker: React.FC<{ position: { x: number, y: number } }> = ({ position }) => (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -50%)',
      }}
    >
        <div className="w-8 h-8 rounded-full bg-red-500/30 flex items-center justify-center animate-pulse">
            <div className="w-4 h-4 rounded-full bg-red-500 ring-2 ring-white/80 shadow-lg"></div>
        </div>
    </div>
);

const DetailSection: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
    <div className={className}>
        <h5 className="font-semibold text-fuchsia-300 mb-1 capitalize">{title}</h5>
        <div className="text-gray-300 text-sm space-y-1">{children}</div>
    </div>
);

const DetailItem: React.FC<{ label: string; value: string | string[] | undefined | null }> = ({ label, value }) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return null;
    return (
        <div>
            <span className="font-medium text-gray-400">{label}:</span>{' '}
            {Array.isArray(value) ? value.join(', ') : value}
        </div>
    );
};

const SimilarItemsDisplay: React.FC<{
  items: SimilarItem[] | null;
  isLoading: boolean;
  error: string | null;
  title: string;
}> = ({ items, isLoading, error, title }) => {
  return (
    <div className="mt-4">
      {isLoading && <p className="text-fuchsia-400">Searching the web...</p>}
      {error && <p className="text-red-400">{error}</p>}
      {items && items.length > 0 && (
        <div className="space-y-2">
            <h5 className="font-semibold text-fuchsia-300">{title}</h5>
            <ul className="list-disc list-inside space-y-1 max-h-40 overflow-y-auto pr-2">
                {items.map((item, index) => (
                    <li key={index} className="text-sm">
                        <a href={item.uri} target="_blank" rel="noopener noreferrer" className="text-fuchsia-400 hover:text-fuchsia-300 hover:underline truncate">
                            {item.title}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
      )}
      {items && items.length === 0 && !isLoading && (
        <p className="text-gray-400">No relevant links were found.</p>
      )}
    </div>
  );
};


const ElementDetails: React.FC<{ 
    result: ElementDetailsResult | null, 
    isLoading: boolean, 
    error: string | null,
    onFindSimilar: () => void,
    similarItems: SimilarItem[] | null,
    isFindingSimilar: boolean,
    findSimilarError: string | null,
}> = ({ result, isLoading, error, onFindSimilar, similarItems, isFindingSimilar, findSimilarError }) => {
    const { details } = result || {};

    const getSearchContext = () => {
        if (!details) return { buttonText: 'Find Similar', resultsTitle: 'Similar Items Found Online:' };
        switch (details.elementType) {
            case 'fashion_item':
            case 'product':
                return { buttonText: 'Shop This Item', resultsTitle: 'Shopping Links:' };
            case 'architectural_feature':
                return { buttonText: 'Locate on Map', resultsTitle: 'Location on Map:' };
            case 'food_item':
                return { buttonText: 'Find Recipe', resultsTitle: 'Recipes & Links:' };
            case 'design_element':
                return { buttonText: 'Find Similar Art', resultsTitle: 'Similar Artwork & Inspiration:' };
            default:
                return { buttonText: 'Find Out More', resultsTitle: 'Relevant Links:' };
        }
    };

    const { buttonText, resultsTitle } = getSearchContext();
    
    return (
        <div className="bg-black/20 p-4 rounded-2xl border border-white/10 min-h-[100px] transition-all">
            <h4 className="font-semibold text-gray-200 text-lg mb-2">Element Details</h4>
            {isLoading && (
                <div className="flex items-center gap-2 text-fuchsia-400">
                    <InlineSpinner />
                    <span>Analyzing selected element...</span>
                </div>
            )}
            {error && !isLoading && <p className="text-red-400">{error}</p>}
            
            {details && !isLoading && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    <div className="space-y-4">
                        <div className="aspect-square bg-black/30 rounded-lg overflow-hidden border border-white/10 shadow-inner">
                            <img src={result.imageUrl} alt={details.name} className="w-full h-full object-contain" />
                        </div>
                        <button
                            onClick={onFindSimilar}
                            disabled={isFindingSimilar}
                            className="w-full flex items-center justify-center gap-2 bg-fuchsia-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-fuchsia-700 transition-all duration-300 transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed shadow-lg shadow-fuchsia-500/20"
                        >
                            <SearchIcon />
                            {isFindingSimilar ? 'Searching...' : buttonText}
                        </button>
                        <SimilarItemsDisplay 
                            items={similarItems} 
                            isLoading={isFindingSimilar} 
                            error={findSimilarError} 
                            title={resultsTitle}
                        />
                    </div>

                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                        <DetailSection title={details.name}>
                           <p className="whitespace-pre-wrap">{details.description.overview}</p>
                        </DetailSection>

                        <DetailSection title="Description">
                            <DetailItem label="Features" value={details.description.distinctiveFeatures} />
                            <DetailItem label="Functionality" value={details.description.functionality} />
                            <DetailItem label="Condition" value={details.description.condition} />
                        </DetailSection>

                        <DetailSection title="Style & Materials">
                            <DetailItem label="Primary Style" value={details.style.primary} />
                            <DetailItem label="Secondary Styles" value={details.style.secondary} />
                            <DetailItem label="Era" value={details.style.era} />
                            <DetailItem label="Primary Material" value={details.materials.primary} />
                             <DetailItem label="Secondary Materials" value={details.materials.secondary} />
                            <DetailItem label="Finish" value={details.materials.finish} />
                        </DetailSection>
                        
                        <DetailSection title="Market">
                            <DetailItem label="Estimated Value" value={details.market.estimatedValue} />
                            <DetailItem label="Availability" value={details.market.availability} />
                            <DetailItem label="Brands" value={details.market.brands} />
                        </DetailSection>

                         <DetailSection title="Recommendations">
                            <DetailItem label="Styling" value={details.recommendations.styling} />
                            <DetailItem label="Occasions" value={details.recommendations.occasions} />
                            <DetailItem label="Similar Items" value={details.recommendations.similarItems} />
                        </DetailSection>
                    </div>
                </div>
            )}

            {!isLoading && !error && !result && (
                <p className="text-gray-400">Click on any element in the image above to get more details.</p>
            )}
        </div>
    );
};

const CompositeResultDisplay: React.FC<{ 
    resultUrl: string | null;
    isLoading: boolean;
    error: string | null;
    imageType: string;
}> = ({ resultUrl, isLoading, error, imageType }) => {
    if (!resultUrl && !isLoading && !error) return null;

    const getContext = () => {
        switch (imageType) {
            case 'FASHION/OUTFIT':
                return { title: 'Virtual Try-On Result', loadingText: 'Dressing you up...' };
            case 'PRODUCT':
                return { title: 'Product Staging Result', loadingText: 'Placing your product...' };
            default:
                return { title: 'Composite Result', loadingText: 'Creating composite image...' };
        }
    };

    const { title, loadingText } = getContext();

    const handleDownload = () => {
        if (!resultUrl) return;
        const link = document.createElement('a');
        link.href = resultUrl;
        const fileType = resultUrl.split(';')[0].split('/')[1] || 'png';
        link.download = `composite-result-${Date.now()}.${fileType}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-black/20 p-4 rounded-2xl border border-white/10 space-y-4">
            <h4 className="font-semibold text-gray-200 text-lg">{title}</h4>
            {isLoading && (
                <div className="flex items-center gap-2 text-sky-400">
                    <InlineSpinner />
                    <span>{loadingText} This may take a moment!</span>
                </div>
            )}
            {error && <p className="text-red-400">{error}</p>}
            {resultUrl && !isLoading && (
                <div className="space-y-4">
                    <div className="relative aspect-square bg-black/30 rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
                        <img src={resultUrl} alt={title} className="w-full h-full object-contain" />
                    </div>
                     <div className="flex justify-end">
                          <button
                              onClick={handleDownload}
                              className="flex items-center gap-2 bg-white/10 text-gray-200 font-semibold py-2 px-4 rounded-lg hover:bg-white/20 transition-all duration-200 border border-white/10"
                          >
                              <DownloadIcon />
                              <span>Download Image</span>
                          </button>
                      </div>
                </div>
            )}
        </div>
    );
};


export const ResultDisplay: React.FC<ResultDisplayProps> = ({ 
  result, isLoading, onImageClick, 
  elementDetailsResult, isElementLoading, elementError, clickPosition, 
  onEnhanceImage, isEnhancing, enhancementError, 
  onFindSimilar, similarItems, isFindingSimilar, findSimilarError,
  imageType, compositeResultUrl, isGeneratingComposite, compositeError
}) => {
  // If mood board is loading, show the main spinner.
  if (isLoading) {
    return (
        <div className="w-full h-full min-h-[400px] flex items-center justify-center">
            <LoadingSpinner />
        </div>
    );
  }

  const hasMoodboardResult = result && result.imageUrl;
  const hasCompositeState = compositeResultUrl || isGeneratingComposite || compositeError;

  // Show placeholder ONLY if nothing is happening and there are no results.
  if (!hasMoodboardResult && !hasCompositeState) {
    return (
        <div className="w-full h-full min-h-[400px]">
            <Placeholder />
        </div>
    );
  }

  const handleDownload = () => {
    if (!result?.imageUrl) return;
    const link = document.createElement('a');
    link.href = result.imageUrl;
    const fileType = result.imageUrl.split(';')[0].split('/')[1] || 'png';
    link.download = `creative-collage-${Date.now()}.${fileType}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full h-full space-y-4">
        {hasMoodboardResult && (
            <div>
                <div className="relative aspect-square bg-black/30 rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
                    <img 
                        onClick={onImageClick}
                        src={result.imageUrl} 
                        alt="Generated Mood Board - Click an element for details" 
                        className="w-full h-full object-contain cursor-crosshair"
                    />
                    {isElementLoading && clickPosition && <ClickMarker position={clickPosition} />}
                    {/* FIX (L2): Added a hover overlay to improve discoverability of the click-to-analyze feature. */}
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-center p-4 text-white font-bold text-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl">
                        <p>Click any element for a detailed analysis</p>
                    </div>
                </div>
                <div className="mt-4">
                  <div className="flex flex-wrap justify-end gap-2">
                      <button
                          onClick={handleDownload}
                          className="flex items-center gap-2 bg-white/10 text-gray-200 font-semibold py-2 px-4 rounded-lg hover:bg-white/20 transition-all duration-200 border border-white/10"
                          aria-label="Download generated image"
                      >
                          <DownloadIcon />
                          <span>Download</span>
                      </button>
                      <button
                          onClick={onEnhanceImage}
                          disabled={isEnhancing}
                          className="flex items-center justify-center gap-2 bg-amber-400/80 text-amber-900 font-semibold py-2 px-4 rounded-lg hover:bg-amber-400 transition-all duration-200 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-wait shadow-lg shadow-amber-500/20"
                          aria-label="Enhance image to 8K and download"
                      >
                          {isEnhancing ? (
                              <>
                                  <InlineSpinner className="-ml-1 mr-2 h-5 w-5" />
                                  <span>Enhancing...</span>
                              </>
                          ) : (
                              <>
                                  <StarIcon />
                                  <span>Enhance & Download 8K</span>
                              </>
                          )}
                      </button>
                  </div>
                  {enhancementError && <p className="text-red-400 text-right mt-2">{enhancementError}</p>}
                </div>
            </div>
        )}
      
      <div className="space-y-4">
        <CompositeResultDisplay 
            resultUrl={compositeResultUrl} 
            isLoading={isGeneratingComposite} 
            error={compositeError}
            imageType={imageType}
        />
        {hasMoodboardResult && (
            <>
                <AnalysisDisplay text={result.text} />
                <ColorPalette colors={result.colors} />
                <ElementDetails 
                    result={elementDetailsResult} 
                    isLoading={isElementLoading} 
                    error={elementError}
                    onFindSimilar={onFindSimilar}
                    similarItems={similarItems}
                    isFindingSimilar={isFindingSimilar}
                    findSimilarError={findSimilarError}
                />
            </>
        )}
      </div>

    </div>
  );
};