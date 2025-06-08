import { Client, Wallet, xrpToDrops, dropsToXrp } from 'xrpl';
import { MerkleTree } from 'merkletreejs';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { Timestamp } from 'firebase-admin/firestore';
import {
  DIDManagementService,
  MerkleTreeService,
  DIDCreationResult,
  XRPLTransactionResult,
  VerificationResult,
  DIDResolutionResult,
  UserMetadata,
  MerkleTree as MerkleTreeType,
  MerkleNode,
  MerkleProof,
  DiaryEntry,
  BlockchainRecord
} from '../../types/backend';
import config from '../config';
import firebaseService from '../database/firebase';

class BlockchainService implements DIDManagementService, MerkleTreeService {
  private client: Client;
  private initialized = false;

  constructor() {
    this.client = new Client(config.xrpl.networkUrl);
  }

  // ============================================================================
  // XRPL Connection Management
  // ============================================================================

  private async ensureConnection(): Promise<void> {
    if (!this.initialized) {
      await this.client.connect();
      this.initialized = true;
      console.log('XRPL client connected');
    }
  }

  async disconnect(): Promise<void> {
    if (this.initialized) {
      await this.client.disconnect();
      this.initialized = false;
      console.log('XRPL client disconnected');
    }
  }

  // ============================================================================
  // DID Management Implementation
  // ============================================================================

  async createDID(userMetadata: UserMetadata): Promise<DIDCreationResult> {
    try {
      await this.ensureConnection();

      // Generate a new wallet for the user
      const userWallet = Wallet.generate();
      
      // Create unique DID identifier
      const didId = `did:xrpl:${userWallet.address}:${uuidv4()}`;

      // Fund the wallet on testnet (for production, user would need to fund it)
      if (config.xrpl.isTestnet) {
        await this.client.fundWallet(userWallet);
      }

      // Create NFT to represent the DID
      const nftMintTx = {
        TransactionType: 'NFTokenMint' as const,
        Account: userWallet.address,
        NFTTokenTaxon: 0,
        Flags: 8, // tfTransferable
        Memos: [
          {
            Memo: {
              MemoType: Buffer.from('DID_CREATION', 'utf8').toString('hex').toUpperCase(),
              MemoData: Buffer.from(JSON.stringify({
                didId,
                anonymizedId: userMetadata.anonymizedId,
                createdAt: userMetadata.createdAt.toMillis(),
                privacyLevel: userMetadata.privacyPreferences.anonymousMode ? 'strict' : 'balanced'
              }), 'utf8').toString('hex').toUpperCase(),
            },
          },
        ],
      } as any;

      // Submit and wait for validation
      const response = await this.client.submitAndWait(nftMintTx, { wallet: userWallet });
      
      if ((response.result.meta as any)?.TransactionResult !== 'tesSUCCESS') {
        throw new Error(`DID creation failed: ${(response.result.meta as any)?.TransactionResult}`);
      }

      // Extract NFT token ID from the transaction result
      const nftTokenId = this.extractNFTTokenId(response);

      // Store DID record in Firebase
      const didRecord = {
        didId,
        xrplAddress: userWallet.address,
        nftTokenId,
        createdAt: Timestamp.now(),
        verificationStatus: 'verified' as const,
        publicKey: userWallet.publicKey,
      };

      await firebaseService.createDIDRecord(userMetadata.anonymizedId, didRecord);

      return {
        didId,
        xrplAddress: userWallet.address,
        nftTokenId,
        transactionHash: response.result.hash,
        success: true,
      };
    } catch (error) {
      console.error('DID creation failed:', error);
      return {
        didId: '',
        xrplAddress: '',
        nftTokenId: '',
        transactionHash: '',
        success: false,
        error: error.message,
      };
    }
  }

  private extractNFTTokenId(response: any): string {
    // Extract NFT token ID from transaction metadata
    const createdTokens = response.result.meta?.CreatedNFTokens;
    return createdTokens?.[0] || '';
  }

  async storeMerkleRoot(params: {
    didId: string;
    merkleRoot: string;
    timestamp: number;
    userWallet: Wallet;
  }): Promise<XRPLTransactionResult> {
    try {
      await this.ensureConnection();

      // Create payment transaction with Merkle root in memo
      const paymentTx = {
        TransactionType: 'Payment' as const,
        Account: params.userWallet.address,
        Destination: params.userWallet.address, // Self-payment
        Amount: '1', // Minimum amount (1 drop)
        Memos: [
          {
            Memo: {
              MemoType: Buffer.from('MERKLE_ROOT', 'utf8').toString('hex').toUpperCase(),
              MemoData: Buffer.from(JSON.stringify({
                didId: params.didId,
                merkleRoot: params.merkleRoot,
                timestamp: params.timestamp,
                entryCount: this.extractEntryCountFromMerkleRoot(params.merkleRoot),
              }), 'utf8').toString('hex').toUpperCase(),
            },
          },
        ],
      } as any;

      const response = await this.client.submitAndWait(paymentTx, { wallet: params.userWallet });

      if ((response.result.meta as any)?.TransactionResult !== 'tesSUCCESS') {
        throw new Error(`Merkle root storage failed: ${(response.result.meta as any)?.TransactionResult}`);
      }

      // Store blockchain record in Firebase
      const blockchainRecord: BlockchainRecord = {
        txHash: response.result.hash,
        merkleRoot: params.merkleRoot,
        didReference: params.didId,
        entryTimestamp: Timestamp.fromMillis(params.timestamp),
        ledgerIndex: response.result.ledger_index || 0,
        verificationStatus: 'confirmed',
      };

      await firebaseService.createBlockchainRecord(blockchainRecord);

      return {
        hash: response.result.hash,
        ledgerIndex: response.result.ledger_index || 0,
        success: true,
        fee: String(dropsToXrp(response.result.Fee || '0')),
      };
    } catch (error) {
      console.error('Merkle root storage failed:', error);
      return {
        hash: '',
        ledgerIndex: 0,
        success: false,
        fee: '0',
        error: error.message,
      };
    }
  }

  private extractEntryCountFromMerkleRoot(merkleRoot: string): number {
    // This would depend on how we encode entry count in the merkle root
    // For now, return 1 as placeholder
    return 1;
  }

  async verifyMerkleRoot(merkleRoot: string): Promise<VerificationResult> {
    try {
      await this.ensureConnection();

      // Get blockchain record from Firebase
      const records = await firebaseService.blockchainRecords()
        .where('merkleRoot', '==', merkleRoot)
        .limit(1)
        .get();

      if (records.empty) {
        return {
          isValid: false,
          merkleRoot,
          verifiedAt: Timestamp.now(),
        };
      }

      const record = records.docs[0].data();

      // Verify transaction exists on XRPL
      const txResponse = await this.client.request({
        command: 'tx',
        transaction: record.txHash,
      });

      const isValid = txResponse.result.validated === true &&
                     (txResponse.result.meta as any)?.TransactionResult === 'tesSUCCESS';

      return {
        isValid,
        merkleRoot,
        blockchainRecord: record,
        verifiedAt: Timestamp.now(),
      };
    } catch (error) {
      console.error('Merkle root verification failed:', error);
      return {
        isValid: false,
        merkleRoot,
        verifiedAt: Timestamp.now(),
      };
    }
  }

  async resolveDID(didId: string): Promise<DIDResolutionResult> {
    try {
      // Get DID record from Firebase
      const userQuery = await firebaseService.users()
        .where('did.didId', '==', didId)
        .limit(1)
        .get();

      if (userQuery.empty) {
        throw new Error('DID not found');
      }

      const userId = userQuery.docs[0].id;
      const didRecord = await firebaseService.getDIDRecord(userId);

      if (!didRecord) {
        throw new Error('DID record not found');
      }

      // Get associated blockchain records
      const blockchainRecords = await firebaseService.getBlockchainRecordsByDID(didId);

      return {
        didId: didRecord.didId,
        xrplAddress: didRecord.xrplAddress,
        nftTokenId: didRecord.nftTokenId,
        verificationStatus: didRecord.verificationStatus,
        blockchainRecords,
        lastUpdated: Timestamp.now(),
      };
    } catch (error) {
      console.error('DID resolution failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // Merkle Tree Implementation
  // ============================================================================

  createMerkleTree(entries: DiaryEntry[]): MerkleTreeType {
    try {
      // Create leaf nodes from diary entries
      const leaves = entries.map(entry => {
        // Handle both Firestore Timestamp objects and plain numbers
        const timestamp = typeof entry.timestamp === 'number' 
          ? entry.timestamp 
          : entry.timestamp.toMillis();
          
        const entryData = JSON.stringify({
          id: entry.id,
          contentHash: crypto.createHash('sha256').update(entry.content).digest('hex'),
          timestamp: timestamp,
          tags: entry.tags,
        });
        return crypto.createHash('sha256').update(entryData).digest('hex');
      });

      // Create Merkle tree
      const tree = new MerkleTree(leaves, crypto.createHash('sha256'), { 
        hashLeaves: false, // Leaves are already hashed
        sortPairs: true 
      });

      // Convert to our format
      const merkleNodes: MerkleNode[] = [];
      const treeNodes = tree.getLayersFlat();
      
      treeNodes.forEach((node, index) => {
        merkleNodes.push({
          hash: node.toString('hex'),
          left: index < treeNodes.length / 2 ? treeNodes[index * 2]?.toString('hex') : undefined,
          right: index < treeNodes.length / 2 ? treeNodes[index * 2 + 1]?.toString('hex') : undefined,
        });
      });

      return {
        nodes: merkleNodes,
        root: tree.getRoot().toString('hex'),
        depth: tree.getDepth(),
        entryCount: entries.length,
      };
    } catch (error) {
      console.error('Merkle tree creation failed:', error);
      throw error;
    }
  }

  generateMerkleRoot(tree: MerkleTreeType): string {
    return tree.root;
  }

  generateMerkleProof(tree: MerkleTreeType, entryIndex: number): MerkleProof {
    try {
      // Reconstruct the original MerkleTree object
      const leaves = tree.nodes
        .filter(node => !node.left && !node.right)
        .map(node => Buffer.from(node.hash, 'hex'));

      const merkleTree = new MerkleTree(leaves, crypto.createHash('sha256'), {
        hashLeaves: false,
        sortPairs: true
      });

      const leaf = leaves[entryIndex];
      const proof = merkleTree.getProof(leaf);

      return {
        leaf: leaf.toString('hex'),
        proof: proof.map(p => p.data.toString('hex')),
        root: tree.root,
        index: entryIndex,
      };
    } catch (error) {
      console.error('Merkle proof generation failed:', error);
      throw error;
    }
  }

  verifyMerkleProof(proof: MerkleProof, merkleRoot: string): boolean {
    try {
      const leaf = Buffer.from(proof.leaf, 'hex');
      const proofBuffers = proof.proof.map(p => ({ data: Buffer.from(p, 'hex'), position: 'right' as const }));
      
      return MerkleTree.verify(proofBuffers, leaf, Buffer.from(merkleRoot, 'hex'), crypto.createHash('sha256'));
    } catch (error) {
      console.error('Merkle proof verification failed:', error);
      return false;
    }
  }

  // ============================================================================
  // Batch Operations
  // ============================================================================

  async batchStoreMerkleRoots(batches: Array<{
    didId: string;
    merkleRoot: string;
    timestamp: number;
    userWallet: Wallet;
  }>): Promise<XRPLTransactionResult[]> {
    const results = await Promise.allSettled(
      batches.map(batch => this.storeMerkleRoot(batch))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`Batch merkle storage failed for item ${index}:`, result.reason);
        return {
          hash: '',
          ledgerIndex: 0,
          success: false,
          fee: '0',
          error: result.reason.message,
        };
      }
    });
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  async getAccountInfo(address: string): Promise<any> {
    try {
      await this.ensureConnection();
      const response = await this.client.request({
        command: 'account_info',
        account: address,
      });
      return response.result.account_data;
    } catch (error) {
      console.error('Failed to get account info:', error);
      return null;
    }
  }

  async getCurrentLedgerIndex(): Promise<number> {
    try {
      await this.ensureConnection();
      const response = await this.client.request({
        command: 'ledger_current',
      });
      return response.result.ledger_current_index;
    } catch (error) {
      console.error('Failed to get current ledger index:', error);
      return 0;
    }
  }

  async estimateTransactionFee(): Promise<string> {
    try {
      await this.ensureConnection();
      const response = await this.client.request({
        command: 'server_info',
      });
      return String(response.result.info.validated_ledger?.base_fee_xrp || '0.00001');
    } catch (error) {
      console.error('Failed to estimate transaction fee:', error);
      return '0.00001'; // Default fee
    }
  }

  generateWalletFromSeed(seed: string): Wallet {
    return Wallet.fromSeed(seed);
  }

  validateXRPAddress(address: string): boolean {
    try {
      // Simple validation - XRPL addresses start with 'r' and are 25-34 characters
      return /^r[1-9A-HJ-NP-Za-km-z]{24,33}$/.test(address);
    } catch (error) {
      return false;
    }
  }

  // ============================================================================
  // Health Check & Monitoring
  // ============================================================================

  async healthCheck(): Promise<boolean> {
    try {
      await this.ensureConnection();
      const response = await this.client.request({
        command: 'server_info',
      });
      return response.result.info.server_state === 'full';
    } catch (error) {
      console.error('XRPL health check failed:', error);
      return false;
    }
  }

  async getNetworkStatus(): Promise<{
    connected: boolean;
    ledgerIndex: number;
    serverState: string;
    baseFee: string;
  }> {
    try {
      await this.ensureConnection();
      const response = await this.client.request({
        command: 'server_info',
      });

      return {
        connected: this.initialized,
        ledgerIndex: response.result.info.validated_ledger?.seq || 0,
        serverState: response.result.info.server_state || 'unknown',
        baseFee: String(response.result.info.validated_ledger?.base_fee_xrp || '0.00001'),
      };
    } catch (error) {
      console.error('Failed to get network status:', error);
      return {
        connected: false,
        ledgerIndex: 0,
        serverState: 'unknown',
        baseFee: '0.00001',
      };
    }
  }
}

export const blockchainService = new BlockchainService();
export default blockchainService; 