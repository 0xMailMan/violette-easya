# Violette EasyA Backend

## 🏗️ Architecture Overview

The Violette EasyA backend is a comprehensive Node.js/Express server that provides:

- **Anonymous Authentication System** with JWT tokens and DID-based authentication
- **AI Processing Pipeline** using Anthropic Claude 3.5 Sonnet with vision capabilities
- **Blockchain Integration** with XRPL for decentralized identity and data integrity
- **Discovery Engine** for finding similar users and generating recommendations
- **Firebase/Firestore Database** for scalable data storage
- **Privacy-First Design** with data anonymization and encryption

## 📁 Project Structure

```
src/backend/
├── config/                 # Configuration management
│   └── index.ts            # Environment configuration
├── database/               # Database services
│   └── firebase.ts         # Firestore integration
├── middleware/             # Express middleware
│   ├── auth.ts            # Authentication & authorization
│   ├── error-handler.ts   # Error handling
│   └── logging.ts         # Request logging
├── routes/                 # API route definitions
│   ├── index.ts           # Route aggregation
│   ├── auth.ts            # Authentication endpoints
│   ├── users.ts           # User management
│   ├── ai.ts              # AI processing
│   ├── discovery.ts       # Discovery engine
│   └── blockchain.ts      # Blockchain operations
├── services/               # Business logic services
│   ├── ai-processing.ts   # AI analysis pipeline
│   ├── blockchain.ts      # XRPL & DID management
│   └── discovery-engine.ts # Similarity & recommendations
├── server.ts              # Main Express server
└── tsconfig.json          # TypeScript configuration
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Firebase project with Firestore enabled
- Anthropic API key
- XRPL testnet access

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Build the backend:**
   ```bash
   npm run backend:build
   ```

4. **Start development server:**
   ```bash
   npm run backend:dev
   ```

The server will start on `http://localhost:8000`

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `FIREBASE_PROJECT_ID` | Firebase project identifier | ✅ |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Firebase service account JSON | ✅ |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude | ✅ |
| `JWT_SECRET` | Secret for JWT token signing | ✅ |
| `XRPL_NETWORK_URL` | XRPL network WebSocket URL | ✅ |

### Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Firestore Database
3. Create a service account and download the JSON key
4. Set the JSON content as `FIREBASE_SERVICE_ACCOUNT_KEY`

### XRPL Setup

For development, use the testnet:
```
XRPL_NETWORK_URL=wss://s.altnet.rippletest.net:51233
```

For production, use mainnet:
```
XRPL_NETWORK_URL=wss://xrplcluster.com
```

## 📊 Database Schema

### Firestore Collections

#### `users/{userId}`
```typescript
{
  id: string
  createdAt: Timestamp
  lastActive: Timestamp
  isOnboarded: boolean
  privacyLevel: 'strict' | 'balanced' | 'open'
  locationSharingEnabled: boolean
}
```

#### `descriptions/{descriptionId}`
```typescript
{
  id: string
  content: string              // AI-generated description
  embedding: number[]          // 256-dimensional vector
  originalHash: string         // Hash of original content
  merkleRoot: string
  location?: LocationData
  themes: string[]
  sentiment: number            // -1 to 1
  confidence: number           // 0 to 1
  userId: string              // Anonymized reference
  timestamp: Timestamp
  xrplTransaction: {
    hash: string
    ledgerIndex: number
    timestamp: Timestamp
  }
}
```

#### `similarity_clusters/{clusterId}`
```typescript
{
  id: string
  centroid: number[]           // Embedding centroid
  userIds: string[]           // Anonymized user references
  locationCluster: GeoCluster
  commonThemes: string[]
  lastUpdated: Timestamp
}
```

## 🤖 AI Processing Pipeline

### Content Analysis Flow

1. **Input Processing**: Receive photos/text from frontend
2. **Photo Analysis**: Use Claude 3.5 Sonnet Vision for image understanding
3. **Text Analysis**: Use Claude for semantic analysis
4. **Embedding Generation**: Create semantic vector embeddings with Claude
5. **Theme Extraction**: Identify key themes and concepts
6. **Privacy Sanitization**: Remove personally identifiable information
7. **Hash Generation**: Create merkle tree and root hash
8. **Blockchain Submission**: Store hash on XRPL with DID reference

### AI Models Used

- **Claude 3.5 Sonnet**: Photo analysis, text processing, and content refinement
- **Claude 3 Haiku**: Fast processing for location context and theme extraction
- **Custom Semantic Embeddings**: Vector generation based on Claude analysis

## 🔗 Blockchain Integration

### DID Management

Each user gets a unique Decentralized Identifier (DID) on XRPL:

```
did:xrpl:{address}:{uuid}
```

### Merkle Tree Storage

User entries are organized into Merkle trees for:
- **Data Integrity**: Cryptographic proof of data authenticity
- **Privacy**: Only root hashes stored on blockchain
- **Verification**: Prove entry existence without revealing content

### XRPL Transactions

- **DID Creation**: NFTokenMint transaction with user metadata
- **Merkle Storage**: Payment transaction with root hash in memo
- **Verification**: Query blockchain for transaction validation

## 🔍 Discovery Engine

### Similarity Matching

The discovery engine uses multiple algorithms:

1. **Semantic Similarity**: Cosine similarity of embedding vectors
2. **Location Clustering**: Geographical proximity analysis
3. **Temporal Patterns**: Time-based activity correlation
4. **Theme Overlap**: Common interests and activities

### Recommendation Generation

Recommendations are generated based on:
- Similar user behaviors and preferences
- Location-based suggestions
- Activity recommendations
- Theme exploration suggestions

### Privacy-Preserving Matching

- **Differential Privacy**: Add noise to prevent identification
- **k-Anonymity**: Ensure groups have minimum k members
- **Temporal Anonymization**: Delay recommendations to prevent timing attacks

## 🔐 Security & Privacy

### Authentication

- **Anonymous Sessions**: JWT tokens for anonymous users
- **DID Authentication**: Cryptographic signature verification
- **Session Management**: Automatic token refresh and expiration

### Data Protection

- **End-to-End Encryption**: Sensitive data encrypted before storage
- **Data Minimization**: Store only necessary data
- **Right to Deletion**: Complete user data removal
- **Audit Logging**: Track all data access and modifications

### Rate Limiting

- Global rate limiting: 100 requests per 15 minutes
- User-specific limits for AI processing: 10 requests per minute
- Blockchain operations: 5 requests per minute

## 📡 API Endpoints

### Authentication
- `POST /api/auth/anonymous` - Create anonymous session
- `POST /api/auth/did` - Authenticate with DID
- `POST /api/auth/refresh` - Refresh session token
- `GET /api/auth/verify` - Verify current session

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/settings` - Get user settings
- `PUT /api/users/settings` - Update user settings
- `GET /api/users/analytics` - Get user analytics

### AI Processing
- `POST /api/ai/analyze` - Analyze content with AI
- `POST /api/ai/generate-embedding` - Generate embedding vector
- `POST /api/ai/extract-themes` - Extract themes from content
- `POST /api/ai/sanitize` - Sanitize content for privacy
- `POST /api/ai/batch-process` - Process multiple items
- `POST /api/ai/cost-estimate` - Estimate processing cost

### Discovery Engine
- `GET /api/discovery/similar-users` - Find similar users
- `GET /api/discovery/recommendations` - Get recommendations
- `POST /api/discovery/update-clusters` - Update user clusters
- `POST /api/discovery/calculate-score` - Calculate discovery score

### Blockchain Operations
- `POST /api/blockchain/create-did` - Create new DID
- `POST /api/blockchain/store-merkle` - Store merkle root
- `GET /api/blockchain/verify/:hash` - Verify merkle root
- `GET /api/blockchain/resolve-did/:did` - Resolve DID
- `POST /api/blockchain/create-merkle-tree` - Create Merkle tree
- `POST /api/blockchain/generate-proof` - Generate Merkle proof
- `POST /api/blockchain/verify-proof` - Verify Merkle proof
- `GET /api/blockchain/network-status` - Get XRPL network status

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- --testPathPattern=auth
```

### Test Structure

```
tests/
├── unit/                   # Unit tests for individual functions
├── integration/            # Integration tests for API endpoints
├── e2e/                   # End-to-end tests
└── fixtures/              # Test data and mocks
```

## 📈 Monitoring & Analytics

### Health Checks

- `GET /health` - System health status
- Service status monitoring (Firebase, XRPL)
- Performance metrics tracking

### Logging

- Structured JSON logging with Winston
- Request/response logging
- Error tracking and alerting
- Performance monitoring

### Analytics

- Anonymous usage patterns
- AI processing metrics
- Discovery algorithm performance
- Blockchain transaction costs

## 🚀 Deployment

### Development

```bash
npm run backend:dev
```

### Production

```bash
# Build the application
npm run backend:build

# Start production server
npm run backend:start
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 8000
CMD ["node", "dist/backend/server.js"]
```

### Environment-Specific Configuration

- **Development**: Full logging, testnet blockchain
- **Staging**: Production-like setup with test data
- **Production**: Optimized performance, mainnet blockchain

## 🔧 Troubleshooting

### Common Issues

1. **Firebase Connection Errors**
   - Verify service account key format
   - Check project ID and permissions

2. **XRPL Network Issues**
   - Confirm network URL is correct
   - Check testnet vs mainnet configuration

3. **AI API Errors**
   - Verify API keys are valid
   - Check rate limits and quotas

4. **Authentication Failures**
   - Ensure JWT secret is set
   - Verify token expiration settings

### Debug Mode

Enable debug logging:
```bash
LOG_LEVEL=debug npm run backend:dev
```

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [XRPL Documentation](https://xrpl.org/docs.html)
- [Anthropic API Reference](https://docs.anthropic.com/claude/reference)
- [Anthropic Claude API](https://docs.anthropic.com/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details. 