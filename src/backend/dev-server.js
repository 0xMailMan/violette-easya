const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 8000;

// Basic middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'Backend server is running with Anthropic-only setup'
  });
});

// Basic API routes
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    data: {
      server: 'running',
      aiProvider: 'anthropic',
      timestamp: new Date().toISOString()
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 AI Provider: Anthropic Claude`);
  console.log(`📊 API Status: http://localhost:${PORT}/api/status`);
}); 