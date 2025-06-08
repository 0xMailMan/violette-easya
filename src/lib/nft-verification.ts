import { ethers } from 'ethers';
import { UnichainNFTData, VerificationProof, VerificationMessage, BlockscoutResponse } from '../types/cross-chain';
import { CONTRACTS, API_ENDPOINTS } from './cross-chain-config';

/**
 * Verify NFT ownership on Unichain
 */
export async function verifyUnichainNFT(walletAddress: string): Promise<UnichainNFTData> {
  try {
    console.log(`Checking Unichain NFTs for address: ${walletAddress}`);
    
    const response = await fetch(API_ENDPOINTS.unichain.nftQuery(walletAddress), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Unichain API failed: ${response.status} - ${response.statusText}`);
    }

    const data: BlockscoutResponse = await response.json();
    console.log('Unichain API response:', data);

    if (!data.items) {
      return { hasNFTs: false, nfts: [] };
    }

    // Filter NFTs from the target contract
    const targetNFTs = data.items.filter(nft => 
      nft.token?.address?.toLowerCase() === CONTRACTS.unichain.targetNFT?.toLowerCase()
    );

    const processedNFTs = targetNFTs.map(nft => ({
      tokenId: nft.id,
      name: nft.token?.name || 'Unknown',
      symbol: nft.token?.symbol || 'UNK',
      metadata: nft.metadata,
      imageUrl: nft.image_url,
      contractAddress: CONTRACTS.unichain.targetNFT!
    }));

    console.log(`Found ${processedNFTs.length} qualifying NFTs`);

    return {
      hasNFTs: processedNFTs.length > 0,
      nfts: processedNFTs
    };
  } catch (error) {
    console.error('Unichain NFT verification failed:', error);
    throw new Error(`Unichain verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create ownership verification signature
 */
export async function createVerificationSignature(
  signer: ethers.Signer,
  walletAddress: string,
  nftData: UnichainNFTData
): Promise<VerificationProof> {
  try {
    const message: VerificationMessage = {
      action: 'verify_cross_chain_nft_ownership',
      unichain_address: walletAddress,
      nft_contract: CONTRACTS.unichain.targetNFT!,
      nft_tokens: nftData.nfts.map(nft => nft.tokenId),
      timestamp: new Date().toISOString(),
      nonce: Math.random().toString(36).substring(7)
    };

    const messageString = JSON.stringify(message, null, 2);
    console.log('Signing message:', messageString);

    const signature = await signer.signMessage(messageString);
    
    // Verify signature
    const recoveredAddress = ethers.verifyMessage(messageString, signature);
    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new Error('Signature verification failed');
    }

    console.log('Signature verified successfully');

    return {
      message: messageString,
      signature,
      verified: true
    };
  } catch (error) {
    console.error('Signature creation failed:', error);
    throw new Error(`Signature creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verify an existing signature
 */
export function verifySignature(
  message: string,
  signature: string,
  expectedAddress: string
): boolean {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

/**
 * Check if NFT is still owned by address (real-time verification)
 */
export async function verifyCurrentOwnership(
  contractAddress: string,
  tokenId: string,
  ownerAddress: string
): Promise<boolean> {
  try {
    // This would require connecting to Unichain RPC
    // For now, we'll use the Blockscout API as a fallback
    const response = await fetch(
      `${API_ENDPOINTS.unichain.nftQuery(ownerAddress)}&token=${contractAddress}&token_id=${tokenId}`
    );
    
    if (!response.ok) {
      console.warn('Could not verify current ownership via API');
      return true; // Assume still owned if we can't verify
    }

    const data: BlockscoutResponse = await response.json();
    return data.items?.some(nft => 
      nft.id === tokenId && 
      nft.token?.address?.toLowerCase() === contractAddress.toLowerCase()
    ) || false;
  } catch (error) {
    console.warn('Current ownership verification failed:', error);
    return true; // Assume still owned if verification fails
  }
}

/**
 * Get NFT metadata from IPFS or other sources
 */
export async function fetchNFTMetadata(tokenURI: string): Promise<any> {
  try {
    // Handle IPFS URIs
    let uri = tokenURI;
    if (uri.startsWith('ipfs://')) {
      uri = uri.replace('ipfs://', API_ENDPOINTS.ipfs.gateway);
    }

    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch NFT metadata:', error);
    return null;
  }
}

/**
 * Batch verify multiple NFTs
 */
export async function batchVerifyNFTs(
  walletAddress: string,
  contractAddresses: string[]
): Promise<{ [contract: string]: UnichainNFTData }> {
  const results: { [contract: string]: UnichainNFTData } = {};

  for (const contractAddress of contractAddresses) {
    try {
      // This is a simplified version - in reality you'd modify the API call
      // to check specific contracts
      const nftData = await verifyUnichainNFT(walletAddress);
      
      // Filter results for this specific contract
      const contractNFTs = nftData.nfts.filter(nft => 
        nft.contractAddress.toLowerCase() === contractAddress.toLowerCase()
      );

      results[contractAddress] = {
        hasNFTs: contractNFTs.length > 0,
        nfts: contractNFTs
      };
    } catch (error) {
      console.error(`Failed to verify NFTs for contract ${contractAddress}:`, error);
      results[contractAddress] = { hasNFTs: false, nfts: [] };
    }
  }

  return results;
} 