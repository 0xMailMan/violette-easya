import { Router } from 'express';
import { authMiddleware, requirePermission } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { APIResponse } from '../../types/backend';
import blockchainService from '../services/blockchain';
import { Timestamp } from 'firebase-admin/firestore';
import { officialDIDService } from '../services/official-did';

const router = Router();

// All blockchain routes require authentication
router.use(authMiddleware);

// POST /api/blockchain/create-did - Create new DID
router.post('/create-did', requirePermission('blockchain'), asyncHandler(async (req, res) => {
  const { privacyPreferences } = req.body;

  const userMetadata = {
    anonymizedId: req.user!.userId,
    createdAt: Timestamp.now(),
    privacyPreferences: privacyPreferences || {
      shareLocation: false,
      shareTimestamps: false,
      anonymousMode: true,
    },
  };

  const result = await blockchainService.createDID(userMetadata);

  const response: APIResponse = {
    success: result.success,
    data: result.success ? {
      didId: result.didId,
      xrplAddress: result.xrplAddress,
      nftTokenId: result.nftTokenId,
      transactionHash: result.transactionHash,
    } : undefined,
    error: result.error,
    timestamp: new Date().toISOString(),
    requestId: req.requestId!,
  };

  res.status(result.success ? 201 : 400).json(response);
}));

// POST /api/blockchain/store-merkle - Store merkle root
router.post('/store-merkle', requirePermission('blockchain'), asyncHandler(async (req, res) => {
  const { didId, merkleRoot, entries, walletSeed } = req.body;

  if (!didId || !merkleRoot || !walletSeed) {
    const response: APIResponse = {
      success: false,
      error: 'DID ID, merkle root, and wallet seed are required',
      timestamp: new Date().toISOString(),
      requestId: req.requestId!,
    };
    res.status(400).json(response);
    return;
  }

  // Generate wallet from seed
  const userWallet = blockchainService.generateWalletFromSeed(walletSeed);

  const result = await blockchainService.storeMerkleRoot({
    didId,
    merkleRoot,
    timestamp: Date.now(),
    userWallet,
  });

  const response: APIResponse = {
    success: result.success,
    data: result.success ? {
      transactionHash: result.hash,
      ledgerIndex: result.ledgerIndex,
      fee: result.fee,
    } : undefined,
    error: result.error,
    timestamp: new Date().toISOString(),
    requestId: req.requestId!,
  };

  res.status(result.success ? 200 : 400).json(response);
}));

// GET /api/blockchain/verify/:hash - Verify merkle root
router.get('/verify/:hash', asyncHandler(async (req, res) => {
  const { hash } = req.params;

  if (!hash) {
    const response: APIResponse = {
      success: false,
      error: 'Merkle root hash is required',
      timestamp: new Date().toISOString(),
      requestId: req.requestId!,
    };
    res.status(400).json(response);
    return;
  }

  const verification = await blockchainService.verifyMerkleRoot(hash);

  const response: APIResponse = {
    success: true,
    data: {
      isValid: verification.isValid,
      merkleRoot: verification.merkleRoot,
      verifiedAt: verification.verifiedAt,
      blockchainRecord: verification.blockchainRecord,
    },
    timestamp: new Date().toISOString(),
    requestId: req.requestId!,
  };

  res.status(200).json(response);
}));

// Note: DID resolution is now handled by the official DID service below

// POST /api/blockchain/create-merkle-tree - Create Merkle tree from entries
router.post('/create-merkle-tree', asyncHandler(async (req, res) => {
  const { entries } = req.body;

  if (!Array.isArray(entries) || entries.length === 0) {
    const response: APIResponse = {
      success: false,
      error: 'Entries array is required',
      timestamp: new Date().toISOString(),
      requestId: req.requestId!,
    };
    res.status(400).json(response);
    return;
  }

  const merkleTree = blockchainService.createMerkleTree(entries);
  const merkleRoot = blockchainService.generateMerkleRoot(merkleTree);

  const response: APIResponse = {
    success: true,
    data: {
      merkleTree,
      merkleRoot,
      entryCount: entries.length,
    },
    timestamp: new Date().toISOString(),
    requestId: req.requestId!,
  };

  res.status(200).json(response);
}));

// POST /api/blockchain/generate-proof - Generate Merkle proof for entry
router.post('/generate-proof', asyncHandler(async (req, res) => {
  const { merkleTree, entryIndex } = req.body;

  if (!merkleTree || entryIndex === undefined) {
    const response: APIResponse = {
      success: false,
      error: 'Merkle tree and entry index are required',
      timestamp: new Date().toISOString(),
      requestId: req.requestId!,
    };
    res.status(400).json(response);
    return;
  }

  const proof = blockchainService.generateMerkleProof(merkleTree, entryIndex);

  const response: APIResponse = {
    success: true,
    data: proof,
    timestamp: new Date().toISOString(),
    requestId: req.requestId!,
  };

  res.status(200).json(response);
}));

// POST /api/blockchain/verify-proof - Verify Merkle proof
router.post('/verify-proof', asyncHandler(async (req, res) => {
  const { proof, merkleRoot } = req.body;

  if (!proof || !merkleRoot) {
    const response: APIResponse = {
      success: false,
      error: 'Proof and merkle root are required',
      timestamp: new Date().toISOString(),
      requestId: req.requestId!,
    };
    res.status(400).json(response);
    return;
  }

  const isValid = blockchainService.verifyMerkleProof(proof, merkleRoot);

  const response: APIResponse = {
    success: true,
    data: {
      isValid,
      proof,
      merkleRoot,
      verifiedAt: new Date().toISOString(),
    },
    timestamp: new Date().toISOString(),
    requestId: req.requestId!,
  };

  res.status(200).json(response);
}));

// GET /api/blockchain/network-status - Get XRPL network status
router.get('/network-status', asyncHandler(async (req, res) => {
  const networkStatus = await blockchainService.getNetworkStatus();

  const response: APIResponse = {
    success: true,
    data: networkStatus,
    timestamp: new Date().toISOString(),
    requestId: req.requestId!,
  };

  res.status(200).json(response);
}));

// POST /api/blockchain/store-merkle-nft - Store Merkle proof as NFT
router.post('/store-merkle-nft', [authMiddleware, requirePermission('blockchain')], asyncHandler(async (req, res) => {
  const { didId, merkleRoot, entryId, metadata } = req.body;

  if (!didId || !merkleRoot) {
    const response: APIResponse = {
      success: false,
      error: 'DID and merkle root are required',
      timestamp: new Date().toISOString(),
      requestId: req.requestId!,
    };
    res.status(400).json(response);
    return;
  }

  try {
    const result = await blockchainService.storeMerkleAsNFT({
      didId,
      merkleRoot,
      entryId,
      metadata,
      userId: req.user!.userId,
    });

    const response: APIResponse = {
      success: result.success,
      data: result.success ? {
        nftTokenId: result.nftTokenId,
        transactionHash: result.transactionHash,
        didId: didId,
        merkleRoot: merkleRoot,
      } : undefined,
      error: result.error,
      timestamp: new Date().toISOString(),
      requestId: req.requestId!,
    };

    res.status(result.success ? 200 : 400).json(response);
  } catch (error) {
    const response: APIResponse = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      requestId: req.requestId!,
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
    const isDIDEnabled = await officialDIDService.isDIDAmendmentEnabled();
    if (!isDIDEnabled) {
      return res.status(503).json({
        success: false,
        error: 'DID amendment not enabled on this XRPL network'
      });
    }

    const userMetadata = {
      anonymizedId,
      createdAt: Timestamp.now(),
      privacyPreferences: privacyPreferences || { anonymousMode: true }
    };

    const result = await officialDIDService.createOfficialDID(userMetadata);

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

  } catch (error) {
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

    const result = await officialDIDService.resolveDID(decodedDidId);

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

  } catch (error) {
    console.error('DID resolution error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

export { router as blockchainRoutes }; 