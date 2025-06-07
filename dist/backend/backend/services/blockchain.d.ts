import { Wallet } from 'xrpl';
import { DIDManagementService, MerkleTreeService, DIDCreationResult, XRPLTransactionResult, VerificationResult, DIDResolutionResult, UserMetadata, MerkleTree as MerkleTreeType, MerkleProof, DiaryEntry } from '../../types/backend';
declare class BlockchainService implements DIDManagementService, MerkleTreeService {
    private client;
    private initialized;
    constructor();
    private ensureConnection;
    disconnect(): Promise<void>;
    createDID(userMetadata: UserMetadata): Promise<DIDCreationResult>;
    private extractNFTTokenId;
    storeMerkleRoot(params: {
        didId: string;
        merkleRoot: string;
        timestamp: number;
        userWallet: Wallet;
    }): Promise<XRPLTransactionResult>;
    private extractEntryCountFromMerkleRoot;
    verifyMerkleRoot(merkleRoot: string): Promise<VerificationResult>;
    resolveDID(didId: string): Promise<DIDResolutionResult>;
    createMerkleTree(entries: DiaryEntry[]): MerkleTreeType;
    generateMerkleRoot(tree: MerkleTreeType): string;
    generateMerkleProof(tree: MerkleTreeType, entryIndex: number): MerkleProof;
    verifyMerkleProof(proof: MerkleProof, merkleRoot: string): boolean;
    batchStoreMerkleRoots(batches: Array<{
        didId: string;
        merkleRoot: string;
        timestamp: number;
        userWallet: Wallet;
    }>): Promise<XRPLTransactionResult[]>;
    getAccountInfo(address: string): Promise<any>;
    getCurrentLedgerIndex(): Promise<number>;
    estimateTransactionFee(): Promise<string>;
    generateWalletFromSeed(seed: string): Wallet;
    validateXRPAddress(address: string): boolean;
    healthCheck(): Promise<boolean>;
    getNetworkStatus(): Promise<{
        connected: boolean;
        ledgerIndex: number;
        serverState: string;
        baseFee: string;
    }>;
}
export declare const blockchainService: BlockchainService;
export default blockchainService;
//# sourceMappingURL=blockchain.d.ts.map