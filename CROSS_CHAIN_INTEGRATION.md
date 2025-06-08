# Cross-Chain NFT Verification & DID Tethering

## Overview

This implementation provides a comprehensive cross-chain NFT verification system that bridges Unichain, XRPL EVM Sidechain, and XRPL Mainnet. Users can verify their NFT ownership on Unichain and create a unified cross-chain digital identity tethered to XRPL DIDs.

## 🚀 Features

- **Multi-Chain Wallet Connection**: Connect both EVM (MetaMask) and XRPL wallets
- **NFT Ownership Verification**: Verify ownership of specific NFTs on Unichain
- **Cryptographic Proof**: Create verifiable signatures proving NFT ownership
- **Mirror NFT Minting**: Mint corresponding NFTs on XRPL EVM Sidechain
- **DID Creation**: Create W3C compliant DIDs on XRPL with cross-chain context
- **Cross-Chain Tethering**: Link NFTs across chains via DID documents
- **Access Control**: Grant access to protected features based on verified ownership

## 🏗️ Architecture

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Unichain  │    │  XRPL EVM    │    │ XRPL Mainnet│
│   Sepolia   │    │   Devnet     │    │   Testnet   │
└─────────────┘    └──────────────┘    └─────────────┘
       │                   │                   │
       │ 1. Verify NFT     │ 2. Mint Mirror    │ 3. Create DID
       │    Ownership      │    NFTs           │    Document
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                    4. Cross-Chain
                       Tethering
```

## 📋 Implementation

### Core Components

1. **CrossChainWalletManager** (`src/lib/cross-chain-wallet.ts`)
   - Manages EVM and XRPL wallet connections
   - Handles network switching and address conversion

2. **NFT Verification** (`src/lib/nft-verification.ts`)
   - Verifies NFT ownership on Unichain
   - Creates cryptographic proofs of ownership

3. **XRPLEVMNFTMinter** (`src/lib/xrpl-evm-nft-minter.ts`)
   - Mints mirror NFTs on XRPL EVM sidechain
   - Includes cross-chain provenance metadata

4. **CrossChainDIDManager** (`src/lib/cross-chain-did-manager.ts`)
   - Creates and manages DIDs on XRPL mainnet
   - Stores cross-chain NFT information in DID documents

5. **CrossChainNFTApp** (`src/lib/cross-chain-app.ts`)
   - Main orchestrator for the verification workflow
   - Handles state management and event coordination

6. **CrossChainVerification** (`src/components/CrossChainVerification.tsx`)
   - React component providing the user interface
   - Real-time progress tracking and result display

## 🛠️ Configuration

### Environment Variables

Add these to your `.env.local`:

```bash
# XRPL EVM Contracts (Deploy these contracts)
NEXT_PUBLIC_MIRROR_NFT_CONTRACT=0x742d35cc6634c0532925a3b8d0c8e86b8e8b8a3f
NEXT_PUBLIC_DID_REGISTRY_CONTRACT=0x123d35cc6634c0532925a3b8d0c8e86b8e8b8a3f

# Axelar Gateway Contracts (for future cross-chain messaging)
NEXT_PUBLIC_AXELAR_GATEWAY_XRPL_EVM=0xAxelarGatewayXRPLEVM
NEXT_PUBLIC_AXELAR_GATEWAY_UNICHAIN=0xAxelarGatewayUnichain
```

### Network Configuration

The system is configured for:
- **Unichain Sepolia Testnet** (Chain ID: 1301)
- **XRPL EVM Devnet** (Chain ID: 1440002)
- **XRPL Testnet** (WebSocket)

Target NFT Contract: `0x22C1f6050E56d2876009903609a2cC3fEf83B415`

## 🔧 Installation

### 1. Install Dependencies

```bash
npm install ethers xrpl @axelar-network/axelarjs-sdk
```

### 2. Deploy Smart Contracts

Deploy the following contracts to XRPL EVM:

#### Mirror NFT Contract (ERC-721)
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MirrorNFT is ERC721, Ownable {
    uint256 private _tokenIdCounter;
    
    mapping(uint256 => string) private _tokenURIs;
    mapping(uint256 => bytes) private _verificationProofs;
    
    constructor() ERC721("Mirror NFT", "MNFT") {}
    
    function mintMirrorNFT(
        address to,
        uint256 originalTokenId,
        string memory originalContract,
        string memory metadataURI,
        bytes memory proof
    ) external returns (uint256) {
        uint256 tokenId = _tokenIdCounter++;
        _mint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);
        _verificationProofs[tokenId] = proof;
        return tokenId;
    }
    
    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal {
        _tokenURIs[tokenId] = _tokenURI;
    }
    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return _tokenURIs[tokenId];
    }
}
```

#### DID Registry Contract
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DIDRegistry {
    mapping(string => string) private didDocuments;
    mapping(string => address) private didControllers;
    
    event DIDRegistered(string indexed didId, address indexed controller);
    event NFTTethered(string indexed didId, address indexed nftContract, uint256 indexed tokenId);
    
    function registerDID(string memory didId, string memory document) external {
        didDocuments[didId] = document;
        didControllers[didId] = msg.sender;
        emit DIDRegistered(didId, msg.sender);
    }
    
    function tetherNFT(string memory didId, address nftContract, uint256 tokenId) external {
        require(didControllers[didId] == msg.sender, "Not DID controller");
        emit NFTTethered(didId, nftContract, tokenId);
    }
    
    function resolveDID(string memory didId) external view returns (string memory) {
        return didDocuments[didId];
    }
}
```

### 3. Add to Your App

```tsx
import CrossChainVerification from '../components/CrossChainVerification';

function MyProtectedPage() {
  const [hasAccess, setHasAccess] = useState(false);

  return (
    <div>
      {!hasAccess ? (
        <CrossChainVerification
          onVerificationComplete={(results) => {
            console.log('User verified:', results);
            setHasAccess(true);
          }}
          onError={(error) => {
            console.error('Verification failed:', error);
          }}
        />
      ) : (
        <div>🎉 Welcome! You have verified access.</div>
      )}
    </div>
  );
}
```

## 🔄 Workflow

### Step 1: Wallet Connection
```typescript
const walletManager = new CrossChainWalletManager();
const addresses = await walletManager.connectMultiChainWallet();
// Returns: { evm: "0x...", xrpl: "r..." }
```

### Step 2: NFT Verification
```typescript
const nftData = await verifyUnichainNFT(addresses.evm);
// Checks Blockscout API for NFTs from target contract
```

### Step 3: Ownership Proof
```typescript
const proof = await createVerificationSignature(signer, address, nftData);
// Creates cryptographic proof of ownership
```

### Step 4: Mirror NFT Minting
```typescript
const minter = new XRPLEVMNFTMinter(provider, signer);
const mirrors = await minter.mintMirrorNFT(nftData, proof);
// Mints NFTs on XRPL EVM with cross-chain metadata
```

### Step 5: DID Creation
```typescript
const didManager = new CrossChainDIDManager(xrplClient, xrplWallet);
const didResult = await didManager.createOrUpdateDID(nftData, mirrors);
// Creates W3C DID on XRPL with NFT information
```

### Step 6: Cross-Chain Tethering
```typescript
// Links all components together in DID document
const tethering = await createTetheringRecord(mirrors, didResult);
```

## 📊 Data Structures

### NFT Data
```typescript
interface UnichainNFT {
  tokenId: string;
  name?: string;
  symbol?: string;
  metadata?: any;
  imageUrl?: string;
  contractAddress: string;
}
```

### DID Document
```typescript
interface CrossChainDIDDocument {
  '@context': string[];
  id: string; // did:xrpl:{address}
  controller: string[];
  verificationMethod: VerificationMethod[];
  service: ServiceEndpoint[]; // Contains cross-chain NFT registry
}
```

### Verification Results
```typescript
interface VerificationResults {
  originalNFTs: UnichainNFTData;
  mirrorNFTs: MirrorNFTResult[];
  did: DIDCreationResult;
  tethering: TetheringResult;
}
```

## 🧪 Testing

Run the demo test:
```bash
npm run test:cross-chain
```

This simulates the entire workflow with mock data and shows expected outputs.

## 🌐 Live Demo

Visit `/cross-chain` in your application to see the live demo interface.

## 🔮 Future Enhancements

1. **Axelar Integration**: Implement full cross-chain messaging
2. **Multiple NFT Contracts**: Support verification from multiple contracts
3. **Real-time Updates**: Monitor NFT transfers and update DIDs automatically
4. **Advanced Access Control**: Role-based permissions based on NFT traits
5. **Cross-Chain Analytics**: Track cross-chain identity usage

## 🔧 Production Deployment

For production use:

1. Deploy smart contracts to mainnet/production networks
2. Configure production RPC endpoints
3. Set up IPFS for metadata storage
4. Implement proper error handling and monitoring
5. Add rate limiting for API calls
6. Set up cross-chain message validation

## 📝 License

This implementation is part of the Violette application and follows the same licensing terms.

## 🤝 Contributing

This cross-chain system integrates seamlessly with the existing XRPL application architecture and can be extended for additional use cases. 