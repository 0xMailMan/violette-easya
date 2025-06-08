import { CrossChainNetworks, CrossChainContracts } from '../types/cross-chain';

export const NETWORKS: CrossChainNetworks = {
  unichain: {
    chainId: '0x515', // 1301
    name: 'Unichain Sepolia Testnet',
    rpc: 'https://sepolia.unichain.org',
    explorer: 'https://unichain-sepolia.blockscout.com'
  },
  xrplEvm: {
    devnet: {
      chainId: 1440002,
      name: 'XRPL EVM Devnet',
      rpc: 'https://rpc.devnet.xrplevm.org',
      explorer: 'https://explorer.devnet.xrplevm.org'
    },
    testnet: {
      chainId: 1449000,
      name: 'XRPL EVM Testnet',
      rpc: 'https://rpc.testnet.xrplevm.org',
      explorer: 'https://explorer.testnet.xrplevm.org'
    }
  },
  xrpl: {
    testnet: 'wss://s.altnet.rippletest.net:51233',
    mainnet: 'wss://xrplcluster.com'
  }
};

export const CONTRACTS: CrossChainContracts = {
  unichain: {
    targetNFT: '0x22C1f6050E56d2876009903609a2cC3fEf83B415'
  },
  xrplEvm: {
    // These would be deployed contract addresses
    mirrorNFT: process.env.NEXT_PUBLIC_MIRROR_NFT_CONTRACT || '0x742d35cc6634c0532925a3b8d0c8e86b8e8b8a3f',
    didRegistry: process.env.NEXT_PUBLIC_DID_REGISTRY_CONTRACT || '0x123d35cc6634c0532925a3b8d0c8e86b8e8b8a3f'
  }
};

// Mirror NFT Contract ABI (simplified)
export const MIRROR_NFT_ABI = [
  "function mintMirrorNFT(address to, uint256 originalTokenId, string memory originalContract, string memory metadataURI, bytes memory proof) external returns (uint256)",
  "function tokenURI(uint256 tokenId) external view returns (string memory)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function balanceOf(address owner) external view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];

// DID Registry Contract ABI
export const DID_REGISTRY_ABI = [
  "function registerDID(string memory didId, string memory document) external",
  "function updateDID(string memory didId, string memory document) external",
  "function resolveDID(string memory didId) external view returns (string memory)",
  "function tetherNFT(string memory didId, address nftContract, uint256 tokenId) external",
  "event DIDRegistered(string indexed didId, address indexed controller)",
  "event NFTTethered(string indexed didId, address indexed nftContract, uint256 indexed tokenId)"
];

// API Endpoints
export const API_ENDPOINTS = {
  unichain: {
    nftQuery: (address: string) => 
      `https://unichain-sepolia.blockscout.com/api/v2/addresses/${address}/nft?type=ERC-721,ERC-1155`,
    transaction: (hash: string) => 
      `https://unichain-sepolia.blockscout.com/api/v2/transactions/${hash}`,
  },
  ipfs: {
    gateway: 'https://ipfs.io/ipfs/',
    pinata: 'https://api.pinata.cloud/pinning/pinFileToIPFS'
  }
};

// Cross-chain messaging configuration for Axelar
export const AXELAR_CONFIG = {
  environment: process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet',
  networks: {
    'xrpl-evm-devnet': 'xrpl-evm-devnet',
    'unichain-sepolia': 'unichain-sepolia'
  },
  gatewayContracts: {
    xrplEvm: process.env.NEXT_PUBLIC_AXELAR_GATEWAY_XRPL_EVM || '0xAxelarGatewayXRPLEVM',
    unichain: process.env.NEXT_PUBLIC_AXELAR_GATEWAY_UNICHAIN || '0xAxelarGatewayUnichain'
  }
};

// Default configuration
export const DEFAULT_CONFIG = {
  defaultXRPLNetwork: 'testnet',
  defaultXRPLEVMNetwork: 'devnet',
  transactionTimeout: 30000, // 30 seconds
  retryAttempts: 3,
  metadataStoragePreference: 'ipfs' // or 'firebase'
}; 