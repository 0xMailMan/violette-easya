"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockchainService = void 0;
const xrpl_1 = require("xrpl");
const merkletreejs_1 = require("merkletreejs");
const crypto_1 = __importDefault(require("crypto"));
const uuid_1 = require("uuid");
const firestore_1 = require("firebase-admin/firestore");
const config_1 = __importDefault(require("../config"));
const firebase_1 = __importDefault(require("../database/firebase"));
class BlockchainService {
    constructor() {
        this.initialized = false;
        this.client = new xrpl_1.Client(config_1.default.xrpl.networkUrl);
    }
    // ============================================================================
    // XRPL Connection Management
    // ============================================================================
    async ensureConnection() {
        if (!this.initialized) {
            await this.client.connect();
            this.initialized = true;
            console.log('XRPL client connected');
        }
    }
    async disconnect() {
        if (this.initialized) {
            await this.client.disconnect();
            this.initialized = false;
            console.log('XRPL client disconnected');
        }
    }
    // ============================================================================
    // DID Management Implementation
    // ============================================================================
    async createDID(userMetadata) {
        try {
            await this.ensureConnection();
            // Generate a new wallet for the user
            const userWallet = xrpl_1.Wallet.generate();
            // Create unique DID identifier
            const didId = `did:xrpl:${userWallet.address}:${(0, uuid_1.v4)()}`;
            // Fund the wallet on testnet (for production, user would need to fund it)
            if (config_1.default.xrpl.isTestnet) {
                await this.client.fundWallet(userWallet);
            }
            // Create NFT to represent the DID - use direct object without type constraints
            const nftMintTx = {
                TransactionType: 'NFTokenMint',
                Account: userWallet.address,
                NFTokenTaxon: 0,
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
            };
            // Submit and wait for validation
            const response = await this.client.submitAndWait(nftMintTx, { wallet: userWallet });
            if (response.result.meta?.TransactionResult !== 'tesSUCCESS') {
                throw new Error(`DID creation failed: ${response.result.meta?.TransactionResult}`);
            }
            // Extract NFT token ID from the transaction result
            const nftTokenId = this.extractNFTTokenId(response);
            // Store DID record in Firebase
            const didRecord = {
                didId,
                xrplAddress: userWallet.address,
                nftTokenId,
                createdAt: firestore_1.Timestamp.now(),
                verificationStatus: 'verified',
                publicKey: userWallet.publicKey,
            };
            await firebase_1.default.createDIDRecord(userMetadata.anonymizedId, didRecord);
            return {
                didId,
                xrplAddress: userWallet.address,
                nftTokenId,
                transactionHash: response.result.hash,
                success: true,
            };
        }
        catch (error) {
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
    extractNFTTokenId(response) {
        // Extract NFT token ID from transaction metadata
        const createdTokens = response.result.meta?.CreatedNFTokens;
        return createdTokens?.[0] || '';
    }
    async storeMerkleRoot(params) {
        try {
            await this.ensureConnection();
            // Create payment transaction with Merkle root in memo
            const paymentTx = {
                TransactionType: 'Payment',
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
            };
            const response = await this.client.submitAndWait(paymentTx, { wallet: params.userWallet });
            if (response.result.meta?.TransactionResult !== 'tesSUCCESS') {
                throw new Error(`Merkle root storage failed: ${response.result.meta?.TransactionResult}`);
            }
            // Store blockchain record in Firebase
            const blockchainRecord = {
                txHash: response.result.hash,
                merkleRoot: params.merkleRoot,
                didReference: params.didId,
                entryTimestamp: firestore_1.Timestamp.fromMillis(params.timestamp),
                ledgerIndex: response.result.ledger_index || 0,
                verificationStatus: 'confirmed',
            };
            await firebase_1.default.createBlockchainRecord(blockchainRecord);
            return {
                hash: response.result.hash,
                ledgerIndex: response.result.ledger_index || 0,
                success: true,
                fee: String((0, xrpl_1.dropsToXrp)(response.result.Fee || '0')),
            };
        }
        catch (error) {
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
    extractEntryCountFromMerkleRoot(merkleRoot) {
        // This would depend on how we encode entry count in the merkle root
        // For now, return 1 as placeholder
        return 1;
    }
    async verifyMerkleRoot(merkleRoot) {
        try {
            await this.ensureConnection();
            // Get blockchain record from Firebase
            const records = await firebase_1.default.blockchainRecords()
                .where('merkleRoot', '==', merkleRoot)
                .limit(1)
                .get();
            if (records.empty) {
                return {
                    isValid: false,
                    merkleRoot,
                    verifiedAt: firestore_1.Timestamp.now(),
                };
            }
            const record = records.docs[0].data();
            // Verify transaction exists on XRPL
            const txResponse = await this.client.request({
                command: 'tx',
                transaction: record.txHash,
            });
            const isValid = txResponse.result.validated === true &&
                txResponse.result.meta?.TransactionResult === 'tesSUCCESS';
            return {
                isValid,
                merkleRoot,
                blockchainRecord: record,
                verifiedAt: firestore_1.Timestamp.now(),
            };
        }
        catch (error) {
            console.error('Merkle root verification failed:', error);
            return {
                isValid: false,
                merkleRoot,
                verifiedAt: firestore_1.Timestamp.now(),
            };
        }
    }
    async resolveDID(didId) {
        try {
            // Get DID record from Firebase
            const userQuery = await firebase_1.default.users()
                .where('did.didId', '==', didId)
                .limit(1)
                .get();
            if (userQuery.empty) {
                throw new Error('DID not found');
            }
            const userId = userQuery.docs[0].id;
            const didRecord = await firebase_1.default.getDIDRecord(userId);
            if (!didRecord) {
                throw new Error('DID record not found');
            }
            // Get associated blockchain records
            const blockchainRecords = await firebase_1.default.getBlockchainRecordsByDID(didId);
            return {
                didId: didRecord.didId,
                xrplAddress: didRecord.xrplAddress,
                nftTokenId: didRecord.nftTokenId,
                verificationStatus: didRecord.verificationStatus,
                blockchainRecords,
                lastUpdated: firestore_1.Timestamp.now(),
            };
        }
        catch (error) {
            console.error('DID resolution failed:', error);
            throw error;
        }
    }
    // ============================================================================
    // Merkle Tree Implementation
    // ============================================================================
    createMerkleTree(entries) {
        try {
            // Create leaf nodes from diary entries
            const leaves = entries.map(entry => {
                // Handle both Firestore Timestamp objects and plain numbers
                const timestamp = typeof entry.timestamp === 'number'
                    ? entry.timestamp
                    : entry.timestamp.toMillis();
                const entryData = JSON.stringify({
                    id: entry.id,
                    contentHash: crypto_1.default.createHash('sha256').update(entry.content).digest('hex'),
                    timestamp: timestamp,
                    tags: entry.tags,
                });
                return crypto_1.default.createHash('sha256').update(entryData).digest('hex');
            });
            // Create Merkle tree
            const tree = new merkletreejs_1.MerkleTree(leaves, crypto_1.default.createHash('sha256'), {
                hashLeaves: false, // Leaves are already hashed
                sortPairs: true
            });
            // Convert to our format
            const merkleNodes = [];
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
        }
        catch (error) {
            console.error('Merkle tree creation failed:', error);
            throw error;
        }
    }
    generateMerkleRoot(tree) {
        return tree.root;
    }
    generateMerkleProof(tree, entryIndex) {
        try {
            // Reconstruct the original MerkleTree object
            const leaves = tree.nodes
                .filter(node => !node.left && !node.right)
                .map(node => Buffer.from(node.hash, 'hex'));
            const merkleTree = new merkletreejs_1.MerkleTree(leaves, crypto_1.default.createHash('sha256'), {
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
        }
        catch (error) {
            console.error('Merkle proof generation failed:', error);
            throw error;
        }
    }
    verifyMerkleProof(proof, merkleRoot) {
        try {
            const leaf = Buffer.from(proof.leaf, 'hex');
            const proofBuffers = proof.proof.map(p => ({ data: Buffer.from(p, 'hex'), position: 'right' }));
            return merkletreejs_1.MerkleTree.verify(proofBuffers, leaf, Buffer.from(merkleRoot, 'hex'), crypto_1.default.createHash('sha256'));
        }
        catch (error) {
            console.error('Merkle proof verification failed:', error);
            return false;
        }
    }
    // ============================================================================
    // Batch Operations
    // ============================================================================
    async batchStoreMerkleRoots(batches) {
        const results = await Promise.allSettled(batches.map(batch => this.storeMerkleRoot(batch)));
        return results.map((result, index) => {
            if (result.status === 'fulfilled') {
                return result.value;
            }
            else {
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
    async getAccountInfo(address) {
        try {
            await this.ensureConnection();
            const response = await this.client.request({
                command: 'account_info',
                account: address,
            });
            return response.result.account_data;
        }
        catch (error) {
            console.error('Failed to get account info:', error);
            return null;
        }
    }
    async getCurrentLedgerIndex() {
        try {
            await this.ensureConnection();
            const response = await this.client.request({
                command: 'ledger_current',
            });
            return response.result.ledger_current_index;
        }
        catch (error) {
            console.error('Failed to get current ledger index:', error);
            return 0;
        }
    }
    async estimateTransactionFee() {
        try {
            await this.ensureConnection();
            const response = await this.client.request({
                command: 'server_info',
            });
            return String(response.result.info.validated_ledger?.base_fee_xrp || '0.00001');
        }
        catch (error) {
            console.error('Failed to estimate transaction fee:', error);
            return '0.00001'; // Default fee
        }
    }
    generateWalletFromSeed(seed) {
        return xrpl_1.Wallet.fromSeed(seed);
    }
    validateXRPAddress(address) {
        try {
            // Simple validation - XRPL addresses start with 'r' and are 25-34 characters
            return /^r[1-9A-HJ-NP-Za-km-z]{24,33}$/.test(address);
        }
        catch (error) {
            return false;
        }
    }
    // ============================================================================
    // Health Check & Monitoring
    // ============================================================================
    async healthCheck() {
        try {
            await this.ensureConnection();
            const response = await this.client.request({
                command: 'server_info',
            });
            return response.result.info.server_state === 'full';
        }
        catch (error) {
            console.error('XRPL health check failed:', error);
            return false;
        }
    }
    async getNetworkStatus() {
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
        }
        catch (error) {
            console.error('Failed to get network status:', error);
            return {
                connected: false,
                ledgerIndex: 0,
                serverState: 'unknown',
                baseFee: '0.00001',
            };
        }
    }
    // ============================================================================
    // NFT Storage for Merkle Proofs
    // ============================================================================
    async storeMerkleAsNFT(params) {
        try {
            await this.ensureConnection();
            // Get DID record to find the associated wallet
            const didRecord = await firebase_1.default.getDIDRecord(params.userId);
            if (!didRecord) {
                return {
                    success: false,
                    error: 'DID not found for user',
                };
            }
            // For demonstration purposes, generate a new wallet to fund and use for NFT minting
            // In production, you'd either store the private key securely or use a different approach
            const userWallet = xrpl_1.Wallet.generate();
            // Fund the wallet on testnet
            if (config_1.default.xrpl.isTestnet) {
                await this.client.fundWallet(userWallet);
            }
            // Create NFT with merkle proof data
            const nftMintTx = {
                TransactionType: 'NFTokenMint',
                Account: userWallet.address,
                NFTokenTaxon: 1, // Use taxon 1 for merkle proof NFTs
                Flags: 8, // tfTransferable
                Memos: [
                    {
                        Memo: {
                            MemoType: Buffer.from('MERKLE_PROOF', 'utf8').toString('hex').toUpperCase(),
                            MemoData: Buffer.from(JSON.stringify({
                                didId: params.didId,
                                merkleRoot: params.merkleRoot,
                                entryId: params.entryId,
                                timestamp: Date.now(),
                                metadata: params.metadata,
                            }), 'utf8').toString('hex').toUpperCase(),
                        },
                    },
                ],
            };
            // Submit and wait for validation
            const prepared = await this.client.autofill(nftMintTx);
            const signed = userWallet.sign(prepared);
            const result = await this.client.submitAndWait(signed.tx_blob);
            if (result.result.meta?.TransactionResult === 'tesSUCCESS') {
                // Extract NFT Token ID from result
                const nftTokenId = this.extractNFTTokenId(result);
                // Store NFT record in Firebase (simplified for now)
                console.log('NFT minted successfully:', {
                    nftTokenId,
                    didId: params.didId,
                    merkleRoot: params.merkleRoot,
                    transactionHash: result.result.hash,
                });
                return {
                    success: true,
                    nftTokenId,
                    transactionHash: result.result.hash,
                };
            }
            else {
                return {
                    success: false,
                    error: `Transaction failed: ${result.result.meta?.TransactionResult}`,
                };
            }
        }
        catch (error) {
            console.error('Merkle NFT storage failed:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }
}
exports.blockchainService = new BlockchainService();
exports.default = exports.blockchainService;
//# sourceMappingURL=blockchain.js.map