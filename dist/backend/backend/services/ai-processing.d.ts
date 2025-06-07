import { AIProcessingPipeline, ContentAnalysis, ThemeAnalysis, LocationData } from '../../types/backend';
declare class AIProcessingService implements AIProcessingPipeline {
    private anthropic;
    constructor();
    analyzeContent(input: {
        photo?: string;
        text?: string;
        location?: LocationData;
    }): Promise<ContentAnalysis>;
    private analyzePhoto;
    private analyzeText;
    private analyzeLocationContext;
    private refineAnalysis;
    generateEmbedding(description: string): Promise<number[]>;
    extractThemes(description: string): Promise<ThemeAnalysis>;
    sanitizeContent(description: string): Promise<string>;
    batchProcess(inputs: Array<{
        photo?: string;
        text?: string;
        location?: LocationData;
    }>): Promise<ContentAnalysis[]>;
    generateContentHash(content: string): string;
    validateImageContent(imageBase64: string): Promise<boolean>;
    estimateProcessingCost(input: {
        photo?: string;
        text?: string;
        location?: LocationData;
    }): number;
}
export declare const aiProcessingService: AIProcessingService;
export default aiProcessingService;
//# sourceMappingURL=ai-processing.d.ts.map