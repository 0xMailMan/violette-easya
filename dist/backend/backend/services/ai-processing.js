"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiProcessingService = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const crypto_1 = __importDefault(require("crypto"));
const config_1 = __importDefault(require("../config"));
class AIProcessingService {
    constructor() {
        this.anthropic = new sdk_1.default({
            apiKey: config_1.default.ai.anthropicApiKey,
        });
    }
    // ============================================================================
    // Main Content Analysis Pipeline
    // ============================================================================
    async analyzeContent(input) {
        const startTime = Date.now();
        try {
            let description = '';
            let themes = [];
            let sentiment = 0;
            let confidence = 0;
            let suggestedTags = [];
            let locationContext;
            // Photo analysis using Claude 3.5 Sonnet Vision
            if (input.photo) {
                const photoAnalysis = await this.analyzePhoto(input.photo);
                description += photoAnalysis.description;
                themes.push(...(photoAnalysis.themes || []));
                suggestedTags.push(...(photoAnalysis.suggestedTags || []));
                confidence = Math.max(confidence, photoAnalysis.confidence || 0);
            }
            // Text analysis using Claude
            if (input.text) {
                const textAnalysis = await this.analyzeText(input.text);
                description += (description ? ' ' : '') + textAnalysis.description;
                themes.push(...(textAnalysis.themes || []));
                sentiment = textAnalysis.sentiment || 0;
                suggestedTags.push(...(textAnalysis.suggestedTags || []));
                confidence = Math.max(confidence, textAnalysis.confidence || 0);
            }
            // Location context analysis
            if (input.location) {
                locationContext = await this.analyzeLocationContext(input.location);
            }
            // Combine and refine analysis
            const refinedAnalysis = await this.refineAnalysis({
                description,
                themes: [...new Set(themes)], // Remove duplicates
                sentiment,
                confidence,
                suggestedTags: [...new Set(suggestedTags)],
                locationContext,
            });
            const processingTime = Date.now() - startTime;
            console.log(`AI processing completed in ${processingTime}ms`);
            return refinedAnalysis;
        }
        catch (error) {
            console.error('AI processing failed:', error);
            throw new Error(`AI processing failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // ============================================================================
    // Photo Analysis with Claude 3.5 Sonnet Vision
    // ============================================================================
    async analyzePhoto(photoBase64) {
        try {
            const response = await this.anthropic.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 1000,
                temperature: 0.7,
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: `Analyze this image and provide a comprehensive analysis. Focus on:
1. A detailed, poetic description that captures emotions, atmosphere, and deeper meaning
2. Key themes and concepts present in the image
3. Suggested tags for categorization
4. Objects, colors, and composition elements
5. Emotional tone and mood conveyed
6. Any symbolic or metaphorical elements

Format your response as JSON with the following structure:
{
  "description": "detailed poetic description",
  "themes": ["theme1", "theme2", ...],
  "suggestedTags": ["tag1", "tag2", ...],
  "objects": ["object1", "object2", ...],
  "colors": ["color1", "color2", ...],
  "composition": "description of visual composition",
  "emotionalTone": "description of emotional mood",
  "confidence": 0.85
}`
                            },
                            {
                                type: 'image',
                                source: {
                                    type: 'base64',
                                    media_type: 'image/jpeg',
                                    data: photoBase64,
                                },
                            },
                        ],
                    },
                ],
            });
            const content = response.content[0].text;
            const analysis = JSON.parse(content || '{}');
            return {
                description: analysis.description || '',
                themes: analysis.themes || [],
                suggestedTags: analysis.suggestedTags || [],
                confidence: analysis.confidence || 0.8,
            };
        }
        catch (error) {
            console.error('Photo analysis failed:', error);
            return {
                description: 'A captured moment in time',
                themes: ['photography', 'moment'],
                suggestedTags: ['photo'],
                confidence: 0.3,
            };
        }
    }
    // ============================================================================
    // Text Analysis with Claude
    // ============================================================================
    async analyzeText(text) {
        try {
            const prompt = `Analyze the following text and provide a comprehensive analysis:

Text: "${text}"

Please provide:
1. An enriched, poetic description that captures the essence and emotions
2. Key themes and concepts
3. Sentiment analysis (-1 to 1, where -1 is very negative, 0 is neutral, 1 is very positive)
4. Suggested tags for categorization
5. Emotional undertones and psychological insights
6. Confidence score (0-1) based on text clarity and depth

Format as JSON with this structure:
{
  "description": "enriched poetic description",
  "themes": ["theme1", "theme2", ...],
  "sentiment": 0.2,
  "suggestedTags": ["tag1", "tag2", ...],
  "emotionalTones": ["tone1", "tone2", ...],
  "confidence": 0.9
}`;
            const response = await this.anthropic.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 1000,
                temperature: 0.7,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
            });
            const content = response.content[0].text;
            const analysis = JSON.parse(content);
            return {
                description: analysis.description || text,
                themes: analysis.themes || [],
                sentiment: analysis.sentiment || 0,
                suggestedTags: analysis.suggestedTags || [],
                confidence: analysis.confidence || 0.8,
            };
        }
        catch (error) {
            console.error('Text analysis failed:', error);
            return {
                description: text,
                themes: ['text', 'note'],
                sentiment: 0,
                suggestedTags: ['text'],
                confidence: 0.5,
            };
        }
    }
    // ============================================================================
    // Location Context Analysis
    // ============================================================================
    async analyzeLocationContext(location) {
        try {
            const prompt = `Analyze this location data and provide contextual insights:

Latitude: ${location.latitude}
Longitude: ${location.longitude}
Accuracy: ${location.accuracy}m
${location.placeName ? `Place: ${location.placeName}` : ''}
${location.placeType ? `Type: ${location.placeType}` : ''}

Provide insights about:
- What this location might represent emotionally or symbolically
- The type of experiences typically associated with such places
- Atmospheric qualities of this location type
- Cultural or social significance

Keep it poetic and meaningful, focusing on the human experience of being in such a place.`;
            const response = await this.anthropic.messages.create({
                model: 'claude-3-haiku-20240307',
                max_tokens: 300,
                temperature: 0.6,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
            });
            return response.content[0].text;
        }
        catch (error) {
            console.error('Location analysis failed:', error);
            return 'A place of significance in the journey of life';
        }
    }
    // ============================================================================
    // Analysis Refinement and Synthesis
    // ============================================================================
    async refineAnalysis(analysis) {
        try {
            const prompt = `Refine and synthesize this analysis to create a cohesive, meaningful interpretation:

Original Analysis:
- Description: ${analysis.description}
- Themes: ${analysis.themes?.join(', ')}
- Sentiment: ${analysis.sentiment}
- Tags: ${analysis.suggestedTags?.join(', ')}
- Location Context: ${analysis.locationContext || 'None'}

Create a refined version that:
1. Combines elements into a flowing, poetic description
2. Identifies the most meaningful themes (limit to 5)
3. Provides accurate sentiment analysis
4. Suggests the most relevant tags (limit to 8)
5. Maintains the emotional essence while improving clarity

Return as JSON with the same structure as the input, but refined and improved.`;
            const response = await this.anthropic.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 800,
                temperature: 0.5,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
            });
            const refinedAnalysis = JSON.parse(response.content[0].text);
            return {
                description: refinedAnalysis.description || analysis.description,
                themes: refinedAnalysis.themes || analysis.themes,
                sentiment: refinedAnalysis.sentiment || analysis.sentiment,
                confidence: refinedAnalysis.confidence || analysis.confidence,
                suggestedTags: refinedAnalysis.suggestedTags || analysis.suggestedTags,
                locationContext: analysis.locationContext,
            };
        }
        catch (error) {
            console.error('Analysis refinement failed:', error);
            return analysis; // Return original if refinement fails
        }
    }
    // ============================================================================
    // Embedding Generation with Claude
    // ============================================================================
    async generateEmbedding(description) {
        try {
            // Claude doesn't provide embeddings directly, so we'll create a semantic hash
            // based on the description content. In a production environment, you might
            // want to use a dedicated embedding service or model
            const prompt = `Create a semantic analysis of this text and return 10 key numerical features (0-1) representing:
1. Emotional positivity (0=very negative, 1=very positive)
2. Energy level (0=calm/still, 1=dynamic/energetic)
3. Social content (0=solitary, 1=social/interpersonal)
4. Temporal focus (0=past-focused, 1=future-focused)
5. Concrete vs abstract (0=abstract concepts, 1=concrete objects)
6. Indoor vs outdoor (0=indoor/enclosed, 1=outdoor/nature)
7. Achievement/goal orientation (0=reflective, 1=achievement-focused)
8. Sensory richness (0=minimal sensory, 1=rich sensory details)
9. Personal vs universal (0=universal themes, 1=personal/specific)
10. Complexity (0=simple, 1=complex/layered)

Text: "${description}"

Return only 10 decimal numbers separated by commas, no other text.`;
            const response = await this.anthropic.messages.create({
                model: 'claude-3-haiku-20240307',
                max_tokens: 100,
                temperature: 0.3,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
            });
            const features = response.content[0].text.split(',').map((f) => parseFloat(f.trim()));
            // Expand to a larger vector by creating derived features
            const embedding = [];
            // Original features
            features.forEach((f) => embedding.push(isNaN(f) ? 0.5 : f));
            // Add word-based features using simple hashing
            const words = description.toLowerCase().split(/\s+/);
            const wordHashes = words.slice(0, 50).map(word => {
                let hash = 0;
                for (let i = 0; i < word.length; i++) {
                    hash = ((hash << 5) - hash + word.charCodeAt(i)) & 0xffffffff;
                }
                return (Math.abs(hash) % 1000) / 1000; // Normalize to 0-1
            });
            embedding.push(...wordHashes);
            // Pad or truncate to consistent size (256 dimensions)
            while (embedding.length < 256) {
                embedding.push(0);
            }
            return embedding.slice(0, 256);
        }
        catch (error) {
            console.error('Embedding generation failed:', error);
            // Return zero vector as fallback
            return new Array(256).fill(0);
        }
    }
    // ============================================================================
    // Theme Extraction
    // ============================================================================
    async extractThemes(description) {
        try {
            const prompt = `Extract detailed themes from this description and categorize them:

"${description}"

Analyze and categorize into:
- Primary themes (main concepts, ideas, or subjects)
- Emotions (feelings, moods, emotional states)
- Activities (actions, experiences, behaviors)
- Objects (physical items, tools, possessions mentioned)
- Places (locations, settings, environments)
- People (human elements, relationships, social aspects)

For each category, provide 3-8 relevant items. Be specific and insightful.

Return as JSON with this exact structure:
{
  "primaryThemes": ["theme1", "theme2", ...],
  "emotions": ["emotion1", "emotion2", ...],
  "activities": ["activity1", "activity2", ...],
  "objects": ["object1", "object2", ...],
  "places": ["place1", "place2", ...],
  "people": ["person1", "person2", ...]
}`;
            const response = await this.anthropic.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 500,
                temperature: 0.5,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
            });
            const themes = JSON.parse(response.content[0].text);
            return {
                primaryThemes: themes.primaryThemes || [],
                emotions: themes.emotions || [],
                activities: themes.activities || [],
                objects: themes.objects || [],
                places: themes.places || [],
                people: themes.people || [],
            };
        }
        catch (error) {
            console.error('Theme extraction failed:', error);
            return {
                primaryThemes: [],
                emotions: [],
                activities: [],
                objects: [],
                places: [],
                people: [],
            };
        }
    }
    // ============================================================================
    // Privacy Sanitization
    // ============================================================================
    async sanitizeContent(description) {
        try {
            const prompt = `Remove or anonymize any personally identifiable information from this text while preserving its essence and meaning:

"${description}"

Rules for sanitization:
- Remove specific names of people (replace with generic terms like "a friend", "someone", "my companion")
- Replace exact addresses with general areas ("downtown", "a quiet neighborhood", "near the park")
- Remove phone numbers, emails, or contact information completely
- Replace specific dates with general time references ("recently", "last week", "a few days ago")
- Remove any other potentially identifying information
- Remove specific business names (replace with generic descriptions)

Preserve:
- General emotions and feelings
- Activities and experiences
- Atmospheric and descriptive elements
- The overall narrative flow and meaning
- Poetic and artistic language

Return only the sanitized text, maintaining the original tone and style.`;
            const response = await this.anthropic.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 600,
                temperature: 0.3,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
            });
            return response.content[0].text;
        }
        catch (error) {
            console.error('Content sanitization failed:', error);
            return description; // Return original if sanitization fails
        }
    }
    // ============================================================================
    // Batch Processing
    // ============================================================================
    async batchProcess(inputs) {
        const results = await Promise.allSettled(inputs.map(input => this.analyzeContent(input)));
        return results.map((result, index) => {
            if (result.status === 'fulfilled') {
                return result.value;
            }
            else {
                console.error(`Batch processing failed for item ${index}:`, result.reason);
                return {
                    description: 'Processing failed',
                    themes: ['error'],
                    sentiment: 0,
                    confidence: 0,
                    suggestedTags: ['failed'],
                };
            }
        });
    }
    // ============================================================================
    // Utility Methods
    // ============================================================================
    generateContentHash(content) {
        return crypto_1.default.createHash('sha256').update(content).digest('hex');
    }
    async validateImageContent(imageBase64) {
        try {
            // Basic validation - check if it's a valid base64 image
            const buffer = Buffer.from(imageBase64, 'base64');
            return buffer.length > 0 && buffer.length < config_1.default.storage.maxFileSize;
        }
        catch (error) {
            return false;
        }
    }
    estimateProcessingCost(input) {
        let cost = 0;
        if (input.photo) {
            cost += 0.015; // Estimated cost for Claude 3.5 Sonnet vision
        }
        if (input.text) {
            const tokens = Math.ceil(input.text.length / 4); // Rough token estimation
            cost += (tokens / 1000) * 0.003; // Claude pricing
        }
        cost += 0.0002; // Embedding processing cost
        return cost;
    }
}
exports.aiProcessingService = new AIProcessingService();
exports.default = exports.aiProcessingService;
//# sourceMappingURL=ai-processing.js.map