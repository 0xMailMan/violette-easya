// Cross-Chain NFT Verification Types

export interface NetworkConfig {
  chainId: number | string;
  name: string;
  rpc: string;
  explorer: string;
}

export interface ContractConfig {
  targetNFT?: string;
  mirrorNFT?: string;
  didRegistry?: string;
}

export interface CrossChainNetworks {
  unichain: NetworkConfig;
  xrplEvm: {
    devnet: NetworkConfig;
    testnet: NetworkConfig;
  };
  xrpl: {
    testnet: string;
    mainnet: string;
  };
}

export interface CrossChainContracts {
  unichain: ContractConfig;
  xrplEvm: ContractConfig;
}

// NFT Types
export interface UnichainNFT {
  tokenId: string;
  name?: string;
  symbol?: string;
  metadata?: any;
  imageUrl?: string;
  contractAddress: string;
}

export interface UnichainNFTData {
  hasNFTs: boolean;
  nfts: UnichainNFT[];
}

export interface MirrorNFTResult {
  originalTokenId: string;
  mirrorTokenId: string;
  transactionHash: string;
  metadataURI: string;
}

// Verification Types
export interface VerificationMessage {
  action: string;
  unichain_address: string;
  nft_contract: string;
  nft_tokens: string[];
  timestamp: string;
  nonce: string;
}

export interface VerificationProof {
  message: string;
  signature: string;
  verified: boolean;
}

// Wallet Types
export interface UserAddresses {
  evm: string | null;
  xrpl: string | null;
}

export interface WalletConnection {
  evmProvider: any;
  evmSigner: any;
  xrplClient: any;
  xrplWallet: any;
  userAddresses: UserAddresses;
}

// DID Types
export interface CrossChainDIDDocument {
  '@context': string[];
  id: string;
  controller: string[];
  verificationMethod: VerificationMethod[];
  service: ServiceEndpoint[];
}

export interface VerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyMultibase?: string;
  publicKeyHex?: string;
}

export interface ServiceEndpoint {
  id: string;
  type: string;
  serviceEndpoint: {
    unichain_nfts: UnichainNFT[];
    xrpl_evm_mirrors: MirrorNFTResult[];
    last_updated: string;
  };
}

export interface DIDCreationResult {
  success: boolean;
  transactionHash: string;
  nftokenId?: string;
  didDocument: CrossChainDIDDocument;
}

// Tethering Types
export interface TetheringData {
  did: string;
  xrpl_evm_nfts: {
    contract: string;
    tokenId: string;
    transactionHash: string;
  }[];
  tethering_timestamp: string;
}

export interface TetheringResult {
  success: boolean;
  tethering: TetheringData;
  crossChainMessageHash?: string;
}

// Application State Types
export interface CrossChainAppState {
  isConnected: boolean;
  isVerified: boolean;
  walletAddresses: UserAddresses;
  nftData?: UnichainNFTData;
  mirrorNFTs?: MirrorNFTResult[];
  didResult?: DIDCreationResult;
  tetheringResult?: TetheringResult;
  status: {
    type: 'idle' | 'connecting' | 'checking' | 'signing' | 'minting' | 'did' | 'tethering' | 'success' | 'error' | 'denied';
    message: string;
  };
}

// API Response Types
export interface BlockscoutResponse {
  items?: Array<{
    id: string;
    token?: {
      address: string;
      name: string;
      symbol: string;
    };
    metadata?: any;
    image_url?: string;
  }>;
}

// Error Types
export interface CrossChainError {
  code: string;
  message: string;
  details?: any;
}

// Event Types
export interface CrossChainEvent {
  type: 'wallet_connected' | 'nft_verified' | 'mirror_minted' | 'did_created' | 'tethering_complete' | 'error';
  data: any;
  timestamp: string;
} 