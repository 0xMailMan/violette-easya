"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockchainRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const error_handler_1 = require("../middleware/error-handler");
const blockchain_1 = __importDefault(require("../services/blockchain"));
const firestore_1 = require("firebase-admin/firestore");
const official_did_1 = require("../services/official-did");
const router = (0, express_1.Router)();
exports.blockchainRoutes = router;
// All blockchain routes require authentication
router.use(auth_1.authMiddleware);
// POST /api/blockchain/create-did - Create new DID
router.post('/create-did', (0, auth_1.requirePermission)('blockchain'), (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { privacyPreferences } = req.body;
    const userMetadata = {
        anonymizedId: req.user.userId,
        createdAt: firestore_1.Timestamp.now(),
        privacyPreferences: privacyPreferences || {
            shareLocation: false,
            shareTimestamps: false,
            anonymousMode: true,
        },
    };
    const result = await blockchain_1.default.createDID(userMetadata);
    const response = {
        success: result.success,
        data: result.success ? {
            didId: result.didId,
            xrplAddress: result.xrplAddress,
            nftTokenId: result.nftTokenId,
            transactionHash: result.transactionHash,
        } : undefined,
        error: result.error,
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
    };
    res.status(result.success ? 201 : 400).json(response);
}));
// POST /api/blockchain/store-merkle - Store merkle root
router.post('/store-merkle', (0, auth_1.requirePermission)('blockchain'), (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { didId, merkleRoot, entries, walletSeed } = req.body;
    if (!didId || !merkleRoot || !walletSeed) {
        const response = {
            success: false,
            error: 'DID ID, merkle root, and wallet seed are required',
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
        };
        res.status(400).json(response);
        return;
    }
    // Generate wallet from seed
    const userWallet = blockchain_1.default.generateWalletFromSeed(walletSeed);
    const result = await blockchain_1.default.storeMerkleRoot({
        didId,
        merkleRoot,
        timestamp: Date.now(),
        userWallet,
    });
    const response = {
        success: result.success,
        data: result.success ? {
            transactionHash: result.hash,
            ledgerIndex: result.ledgerIndex,
            fee: result.fee,
        } : undefined,
        error: result.error,
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
    };
    res.status(result.success ? 200 : 400).json(response);
}));
// GET /api/blockchain/verify/:hash - Verify merkle root
router.get('/verify/:hash', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { hash } = req.params;
    if (!hash) {
        const response = {
            success: false,
            error: 'Merkle root hash is required',
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
        };
        res.status(400).json(response);
        return;
    }
    const verification = await blockchain_1.default.verifyMerkleRoot(hash);
    const response = {
        success: true,
        data: {
            isValid: verification.isValid,
            merkleRoot: verification.merkleRoot,
            verifiedAt: verification.verifiedAt,
            blockchainRecord: verification.blockchainRecord,
        },
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
    };
    res.status(200).json(response);
}));
// GET /api/blockchain/resolve-did/:did - Resolve DID
router.get('/resolve-did/:did', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { did } = req.params;
    if (!did) {
        const response = {
            success: false,
            error: 'DID is required',
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
        };
        res.status(400).json(response);
        return;
    }
    try {
        const didResolution = await blockchain_1.default.resolveDID(did);
        const response = {
            success: true,
            data: didResolution,
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
        };
        res.status(200).json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
        };
        res.status(404).json(response);
    }
}));
// POST /api/blockchain/create-merkle-tree - Create Merkle tree from entries
router.post('/create-merkle-tree', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { entries } = req.body;
    if (!Array.isArray(entries) || entries.length === 0) {
        const response = {
            success: false,
            error: 'Entries array is required',
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
        };
        res.status(400).json(response);
        return;
    }
    const merkleTree = blockchain_1.default.createMerkleTree(entries);
    const merkleRoot = blockchain_1.default.generateMerkleRoot(merkleTree);
    const response = {
        success: true,
        data: {
            merkleTree,
            merkleRoot,
            entryCount: entries.length,
        },
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
    };
    res.status(200).json(response);
}));
// POST /api/blockchain/generate-proof - Generate Merkle proof for entry
router.post('/generate-proof', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { merkleTree, entryIndex } = req.body;
    if (!merkleTree || entryIndex === undefined) {
        const response = {
            success: false,
            error: 'Merkle tree and entry index are required',
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
        };
        res.status(400).json(response);
        return;
    }
    const proof = blockchain_1.default.generateMerkleProof(merkleTree, entryIndex);
    const response = {
        success: true,
        data: proof,
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
    };
    res.status(200).json(response);
}));
// POST /api/blockchain/verify-proof - Verify Merkle proof
router.post('/verify-proof', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { proof, merkleRoot } = req.body;
    if (!proof || !merkleRoot) {
        const response = {
            success: false,
            error: 'Proof and merkle root are required',
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
        };
        res.status(400).json(response);
        return;
    }
    const isValid = blockchain_1.default.verifyMerkleProof(proof, merkleRoot);
    const response = {
        success: true,
        data: {
            isValid,
            proof,
            merkleRoot,
            verifiedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
    };
    res.status(200).json(response);
}));
// GET /api/blockchain/network-status - Get XRPL network status
router.get('/network-status', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const networkStatus = await blockchain_1.default.getNetworkStatus();
    const response = {
        success: true,
        data: networkStatus,
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
    };
    res.status(200).json(response);
}));
// POST /api/blockchain/store-merkle-nft - Store Merkle proof as NFT
router.post('/store-merkle-nft', [auth_1.authMiddleware, (0, auth_1.requirePermission)('blockchain')], (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { didId, merkleRoot, entryId, metadata } = req.body;
    if (!didId || !merkleRoot) {
        const response = {
            success: false,
            error: 'DID and merkle root are required',
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
        };
        res.status(400).json(response);
        return;
    }
    try {
        const result = await blockchain_1.default.storeMerkleAsNFT({
            didId,
            merkleRoot,
            entryId,
            metadata,
            userId: req.user.userId,
        });
        const response = {
            success: result.success,
            data: result.success ? {
                nftTokenId: result.nftTokenId,
                transactionHash: result.transactionHash,
                didId: didId,
                merkleRoot: merkleRoot,
            } : undefined,
            error: result.error,
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
        };
        res.status(result.success ? 200 : 400).json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
            requestId: req.requestId,
        };
        res.status(500).json(response);
    }
}));
// Create official W3C compliant DID
router.post('/create-official-did', async (req, res) => {
    try {
        console.log('Creating official W3C compliant DID...');
        const { anonymizedId, privacyPreferences } = req.body;
        if (!anonymizedId) {
            return res.status(400).json({
                success: false,
                error: 'anonymizedId is required'
            });
        }
        // Check if DID amendment is enabled
        const isDIDEnabled = await official_did_1.officialDIDService.isDIDAmendmentEnabled();
        if (!isDIDEnabled) {
            return res.status(503).json({
                success: false,
                error: 'DID amendment not enabled on this XRPL network'
            });
        }
        const userMetadata = {
            anonymizedId,
            createdAt: firestore_1.Timestamp.now(),
            privacyPreferences: privacyPreferences || { anonymousMode: true }
        };
        const result = await official_did_1.officialDIDService.createOfficialDID(userMetadata);
        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: result.error || 'Failed to create official DID'
            });
        }
        console.log('Official DID created successfully:', {
            didId: result.didId,
            xrplAddress: result.xrplAddress,
            transactionHash: result.transactionHash
        });
        return res.json({
            success: true,
            data: {
                didId: result.didId,
                xrplAddress: result.xrplAddress,
                didDocument: result.didDocument,
                transactionHash: result.transactionHash,
                verificationLink: `https://testnet.xrpl.org/transactions/${result.transactionHash}`,
                compliance: 'W3C DID Standard Compliant'
            }
        });
    }
    catch (error) {
        console.error('Official DID creation error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});
// Resolve official DID
router.get('/resolve-did/:didId', async (req, res) => {
    try {
        const { didId } = req.params;
        // URL decode the DID (in case it was encoded)
        const decodedDidId = decodeURIComponent(didId);
        console.log('Resolving DID:', decodedDidId);
        const result = await official_did_1.officialDIDService.resolveDID(decodedDidId);
        if (!result.success) {
            return res.status(404).json({
                success: false,
                error: result.error || 'DID not found'
            });
        }
        return res.json({
            success: true,
            data: {
                didDocument: result.didDocument,
                didId: result.didId,
                xrplAddress: result.xrplAddress,
                lastUpdated: result.lastUpdated,
                accountLink: `https://testnet.xrpl.org/accounts/${result.xrplAddress}`,
                compliance: 'W3C DID Standard Compliant'
            }
        });
    }
    catch (error) {
        console.error('DID resolution error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});
//# sourceMappingURL=blockchain.js.map