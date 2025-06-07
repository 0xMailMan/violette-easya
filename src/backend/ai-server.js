const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Initialize Anthropic client
let anthropic = null;
if (process.env.ANTHROPIC_API_KEY) {
  anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

// Basic middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'AI Processing Server with Anthropic Claude',
    anthropicConnected: !!anthropic
  });
});

// AI Analysis endpoint
app.post('/api/ai/analyze', async (req, res) => {
  try {
    if (!anthropic) {
      return res.status(500).json({
        success: false,
        error: 'Anthropic API key not configured'
      });
    }

    const { text, photo } = req.body;

    if (!text && !photo) {
      return res.status(400).json({
        success: false,
        error: 'Either text or photo is required'
      });
    }

    let analysis = {
      description: '',
      themes: [],
      sentiment: 0,
      confidence: 0,
      suggestedTags: []
    };

    // Text analysis
    if (text) {
      const prompt = `Analyze this text and provide a comprehensive analysis:

Text: "${text}"

Please provide:
1. An enriched, poetic description that captures the essence and emotions
2. Key themes and concepts (3-5 items)
3. Sentiment analysis (-1 to 1, where -1 is very negative, 0 is neutral, 1 is very positive)
4. Suggested tags for categorization (3-6 items)
5. Confidence score (0-1) based on text clarity and depth

Format as JSON with this structure:
{
  "description": "enriched poetic description",
  "themes": ["theme1", "theme2", ...],
  "sentiment": 0.2,
  "suggestedTags": ["tag1", "tag2", ...],
  "confidence": 0.9
}`;

      const response = await anthropic.messages.create({
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
      analysis = JSON.parse(content);
    }

    // Photo analysis (if provided)
    if (photo) {
      const photoPrompt = `Analyze this image and provide a comprehensive analysis. Focus on:
1. A detailed, poetic description that captures emotions, atmosphere, and deeper meaning
2. Key themes and concepts present in the image
3. Suggested tags for categorization
4. Emotional tone and mood conveyed

Format your response as JSON with the following structure:
{
  "description": "detailed poetic description",
  "themes": ["theme1", "theme2", ...],
  "suggestedTags": ["tag1", "tag2", ...],
  "confidence": 0.85
}`;

      const photoResponse = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: photoPrompt
              },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: photo,
                },
              },
            ],
          },
        ],
      });

      const photoContent = photoResponse.content[0].text;
      const photoAnalysis = JSON.parse(photoContent);

      // Combine text and photo analysis
      analysis.description = analysis.description 
        ? `${analysis.description} ${photoAnalysis.description}`
        : photoAnalysis.description;
      analysis.themes = [...new Set([...analysis.themes, ...photoAnalysis.themes])];
      analysis.suggestedTags = [...new Set([...analysis.suggestedTags, ...photoAnalysis.suggestedTags])];
      analysis.confidence = Math.max(analysis.confidence, photoAnalysis.confidence);
    }

    res.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'AI analysis failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Generate embedding endpoint
app.post('/api/ai/generate-embedding', async (req, res) => {
  try {
    if (!anthropic) {
      return res.status(500).json({
        success: false,
        error: 'Anthropic API key not configured'
      });
    }

    const { description } = req.body;

    if (!description) {
      return res.status(400).json({
        success: false,
        error: 'Description is required'
      });
    }

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

    const response = await anthropic.messages.create({
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

    const features = response.content[0].text.split(',').map(f => parseFloat(f.trim()));
    
    // Expand to a larger vector by creating derived features
    const embedding = [];
    
    // Original features
    features.forEach(f => embedding.push(isNaN(f) ? 0.5 : f));
    
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

    res.json({
      success: true,
      data: {
        embedding: embedding.slice(0, 256),
        dimensions: 256
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Embedding generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Embedding generation failed',
      timestamp: new Date().toISOString()
    });
  }
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    data: {
      server: 'running',
      aiProvider: 'anthropic',
      anthropicConnected: !!anthropic,
      endpoints: [
        'POST /api/ai/analyze - Analyze text and/or images',
        'POST /api/ai/generate-embedding - Generate semantic embeddings',
        'GET /health - Health check',
        'GET /api/status - API status'
      ],
      timestamp: new Date().toISOString()
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 AI Processing Server running on port ${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 AI Provider: Anthropic Claude`);
  console.log(`📊 API Status: http://localhost:${PORT}/api/status`);
  console.log(`🧠 AI Analysis: POST http://localhost:${PORT}/api/ai/analyze`);
  console.log(`🔢 Embeddings: POST http://localhost:${PORT}/api/ai/generate-embedding`);
  
  if (!anthropic) {
    console.log('⚠️  Warning: ANTHROPIC_API_KEY not found - AI features will be disabled');
  } else {
    console.log('✅ Anthropic API connected and ready');
  }
}); 