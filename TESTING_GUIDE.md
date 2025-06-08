# Violette XRPL + Cross-Chain Testing Guide

This guide explains how to test the combined **AI-powered W3C DID workflow** and **Cross-Chain NFT Verification** system.

## 🚀 Quick Start

### Option 1: Interactive Test Runner
```bash
npm run test:runner
# or
node test-runner.js
```

### Option 2: Direct Test Commands
```bash
# Enhanced workflow (original + cross-chain)
npm run test:enhanced

# Cross-chain only
npm run test:cross-chain

# Original workflow only
npm run test:workflow
```

## 📋 Test Scenarios

### 1. 📸 Original Workflow Test
**Command:** `npm run test:workflow`

**What it tests:**
- User authentication & session setup
- Photo capture & AI analysis
- Analysis storage in Firestore
- W3C DID creation on XRPL
- Merkle proof generation
- NFT storage with merkle proof
- DID resolution verification

**Duration:** ~30-60 seconds

### 2. 🔗 Cross-Chain Only Test
**Command:** `npm run test:cross-chain`

**What it tests:**
- Cross-chain wallet initialization
- NFT ownership verification on Unichain
- Mirror NFT minting on XRPL EVM Sidechain
- Cross-chain DID tethering
- Multi-chain access verification

**Duration:** ~10-20 seconds (simulation)

### 3. 🌐 Enhanced Workflow Test
**Command:** `npm run test:enhanced`

**What it tests:**
- **All original workflow steps** (1-6)
- **Plus cross-chain verification** (7-11)
- Complete multi-chain data integrity
- Cross-platform interoperability

**Duration:** ~60-90 seconds

## 🔧 Test Configuration

### Prerequisites
1. **Servers Running:**
   ```bash
   # Terminal 1: AI Server
   npm run ai-server
   
   # Terminal 2: Backend Server
   PORT=8001 npm run backend:dev
   
   # Terminal 3: Frontend (optional)
   npm run dev
   ```

2. **Environment Variables:**
   ```bash
   # .env file should contain:
   OPENAI_API_KEY=your_openai_key
   FIREBASE_PROJECT_ID=your_project_id
   # ... other required vars
   ```

### Network Configuration
The cross-chain tests use these networks:

- **Unichain Sepolia** (ChainID: 0x515)
- **XRPL EVM Devnet** (ChainID: 1440002) 
- **XRPL Testnet** (for W3C DID storage)

## 📊 Expected Test Output

### ✅ Successful Enhanced Workflow
```
🔄 Complete End-to-End Workflow Test + Cross-Chain Verification
Testing: Photo → AI → Firestore → DID → Merkle → NFT → Cross-Chain Tethering

📱 STEP 1: User Authentication & Session Setup
✅ Authentication successful

📸 STEP 2: Photo Capture & AI Analysis  
✅ AI Analysis completed

💾 STEP 3: Store Analysis in Firestore
✅ Analysis stored in Firestore

🆔 STEP 4: Create Official W3C Compliant DID
✅ W3C Compliant DID created successfully

🌳 STEP 5: Generate Merkle Proof of Analysis
✅ Merkle proof generated

🏷️ STEP 6: Store Merkle Proof as NFT (Tagged to DID)
✅ Merkle proof stored as NFT

🔗 STEP 7: Cross-Chain Wallet Setup & NFT Verification
✅ Cross-chain wallet initialized

🔍 STEP 8: Verify NFT Ownership on Unichain
✅ NFT ownership verified on Unichain

🪞 STEP 9: Mint Mirror NFTs on XRPL EVM Sidechain
✅ Mirror NFTs minted successfully

🔗 STEP 10: Cross-Chain DID Tethering
✅ Cross-chain tethering completed

🎫 STEP 11: Access Verification & Cross-Chain Proof
✅ Access verification completed

🎉 COMPLETE ENHANCED WORKFLOW TEST: SUCCESS!
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Server Connection Errors
```
❌ ENHANCED WORKFLOW TEST FAILED: fetch failed
```
**Solution:** Ensure all servers are running:
```bash
npm run start:all
# or manually start each server
```

#### 2. Cross-Chain Network Issues
```
❌ Failed to connect to Unichain/XRPL EVM
```
**Solution:** 
- Check RPC endpoints in `src/lib/cross-chain-config.ts`
- Verify network connectivity
- Ensure testnet funds available

#### 3. DID Creation Failures
```
❌ DID creation failed
```
**Solution:**
- Check XRPL testnet connectivity
- Verify wallet has sufficient XRP for transactions
- Ensure Firebase configuration is correct

### Debug Mode
For detailed debugging, set environment variable:
```bash
DEBUG=true npm run test:enhanced
```

## 📈 Performance Metrics

### Test Duration Benchmarks
| Test Type | Expected Duration | Steps |
|-----------|------------------|-------|
| Cross-Chain Only | 10-20 seconds | 5 steps |
| Original Workflow | 30-60 seconds | 6 steps |
| Enhanced Workflow | 60-90 seconds | 11 steps |

### Success Criteria
- ✅ All steps complete without errors
- ✅ W3C DID format compliance (did:xrpl:1:{address})
- ✅ NFT ownership verification successful
- ✅ Cross-chain tethering established
- ✅ Multi-chain access verification passes

## 🌐 Multi-Chain Architecture

### Data Flow
```
Photo → AI Analysis → Firestore → W3C DID → Merkle Proof → NFT Storage
    ↓
Cross-Chain Wallet → Unichain NFT Verification → Mirror NFT Minting → DID Tethering → Access Control
```

### Chain Responsibilities
1. **Unichain Sepolia:** Source NFT verification
2. **XRPL EVM Sidechain:** Mirror NFT minting with cross-chain metadata
3. **XRPL Mainnet:** W3C DID document storage and identity resolution

## 🎯 Use Cases

### Development Testing
- Test individual components: `npm run test:cross-chain`
- Test complete integration: `npm run test:enhanced`
- Quick validation: Use test runner option 4

### Production Validation
- Full workflow verification before deployment
- Cross-chain connectivity testing
- W3C DID compliance validation

### Debugging
- Step-by-step verification of each component
- Network connectivity testing
- Data integrity verification

## 📝 Test Data

### Mock Data Used
- **Test Image:** Base64 encoded minimal JPEG
- **Mock NFTs:** Token IDs 1 and 7 with metadata
- **Test DID:** Format compliant W3C DID
- **Signature Data:** Cryptographic proof simulation

### Real Data Integration
For production testing, replace mock data with:
- Real user photos
- Actual NFT contract queries
- Live blockchain transactions
- Production API endpoints

## 🔐 Security Considerations

### Test Environment
- Uses testnet networks only
- No real funds at risk
- Mock signatures for safety
- Isolated test data

### Production Deployment
- Require mainnet configuration
- Implement proper key management
- Add rate limiting and monitoring
- Validate all cross-chain proofs

---

## 📞 Support

If you encounter issues:
1. Check server logs for detailed error messages
2. Verify all prerequisites are met
3. Test individual components separately
4. Review network connectivity and configuration

The testing system is designed to be comprehensive yet flexible, allowing you to test individual components or the complete integrated system as needed. 