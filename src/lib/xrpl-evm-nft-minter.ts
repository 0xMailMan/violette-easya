import { ethers } from 'ethers';
import { UnichainNFTData, VerificationProof, MirrorNFTResult } from '../types/cross-chain';
import { NETWORKS, CONTRACTS, MIRROR_NFT_ABI } from './cross-chain-config';

export class XRPLEVMNFTMinter {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;

  constructor(provider?: ethers.BrowserProvider, signer?: ethers.Signer) {
    this.provider = provider || null;
    this.signer = signer || null;
  }

  /**
   * Switch to XRPL EVM network
   */
  async switchToXRPLEVM(network: 'devnet' | 'testnet' = 'devnet'): Promise<void> {
    const networkConfig = NETWORKS.xrplEvm[network];
    
    if (!window.ethereum) {
      throw new Error('EVM wallet not found');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${networkConfig.chainId.toString(16)}` }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        // Network not added, add it
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${networkConfig.chainId.toString(16)}`,
            chainName: networkConfig.name,
            nativeCurrency: { name: 'XRP', symbol: 'XRP', decimals: 18 },
            rpcUrls: [networkConfig.rpc],
            blockExplorerUrls: [networkConfig.explorer]
          }],
        });
      } else {
        throw switchError;
      }
    }

    // Update provider and signer after network switch
    this.provider = new ethers.BrowserProvider(window.ethereum);
    this.signer = await this.provider.getSigner();
  }

  /**
   * Mint mirror NFTs on XRPL EVM sidechain
   */
  async mintMirrorNFT(
    originalNFTData: UnichainNFTData,
    verificationProof: VerificationProof
  ): Promise<MirrorNFTResult[]> {
    if (!this.provider || !this.signer) {
      throw new Error('Provider or signer not initialized');
    }

    // Switch to XRPL EVM network first
    await this.switchToXRPLEVM('devnet');

    if (!CONTRACTS.xrplEvm.mirrorNFT) {
      throw new Error('Mirror NFT contract address not configured');
    }

    const contract = new ethers.Contract(
      CONTRACTS.xrplEvm.mirrorNFT,
      MIRROR_NFT_ABI,
      this.signer
    );

    const results: MirrorNFTResult[] = [];
    const signerAddress = await this.signer.getAddress();

    for (const nft of originalNFTData.nfts) {
      try {
        console.log(`Minting mirror NFT for token ${nft.tokenId}...`);

        // Create metadata for the mirror NFT
        const metadataURI = await this.createMirrorMetadata(nft, verificationProof);
        
        // Encode verification proof as bytes
        const proofBytes = ethers.toUtf8Bytes(JSON.stringify(verificationProof));

        // Estimate gas first
        const gasEstimate = await contract.mintMirrorNFT.estimateGas(
          signerAddress,
          nft.tokenId,
          CONTRACTS.unichain.targetNFT!,
          metadataURI,
          proofBytes
        );

        console.log(`Gas estimate: ${gasEstimate.toString()}`);

        // Mint the mirror NFT
        const tx = await contract.mintMirrorNFT(
          signerAddress,
          nft.tokenId,
          CONTRACTS.unichain.targetNFT!,
          metadataURI,
          proofBytes,
          {
            gasLimit: gasEstimate + BigInt(50000) // Add buffer
          }
        );

        console.log(`Transaction sent: ${tx.hash}`);

        // Wait for confirmation
        const receipt = await tx.wait();
        
        if (!receipt) {
          throw new Error('Transaction receipt not available');
        }

        const mintedTokenId = this.extractTokenIdFromReceipt(receipt);

        results.push({
          originalTokenId: nft.tokenId,
          mirrorTokenId: mintedTokenId,
          transactionHash: receipt.hash,
          metadataURI
        });

        console.log(`Mirror NFT minted successfully: ${mintedTokenId}`);
      } catch (error) {
        console.error(`Failed to mint mirror NFT for token ${nft.tokenId}:`, error);
        // Continue with other NFTs even if one fails
      }
    }

    if (results.length === 0) {
      throw new Error('Failed to mint any mirror NFTs');
    }

    return results;
  }

  /**
   * Create metadata for mirror NFT
   */
  private async createMirrorMetadata(
    originalNFT: any,
    verificationProof: VerificationProof
  ): Promise<string> {
    const metadata = {
      name: `Mirror: ${originalNFT.name}`,
      description: `Mirrored NFT from Unichain contract ${CONTRACTS.unichain.targetNFT}`,
      image: originalNFT.imageUrl || 'https://via.placeholder.com/300x300?text=Mirror+NFT',
      external_url: `${NETWORKS.unichain.explorer}/token/${CONTRACTS.unichain.targetNFT}?a=${originalNFT.tokenId}`,
      attributes: [
        {
          trait_type: "Original Chain",
          value: "Unichain"
        },
        {
          trait_type: "Original Token ID",
          value: originalNFT.tokenId
        },
        {
          trait_type: "Original Contract",
          value: CONTRACTS.unichain.targetNFT
        },
        {
          trait_type: "Mirror Chain",
          value: "XRPL EVM"
        },
        {
          trait_type: "Verification Timestamp",
          value: new Date().toISOString()
        },
        {
          trait_type: "Cross Chain Verified",
          value: "true"
        }
      ],
      verification_proof: {
        signature: verificationProof.signature,
        message_hash: ethers.keccak256(ethers.toUtf8Bytes(verificationProof.message)),
        verified_at: new Date().toISOString()
      },
      cross_chain_metadata: {
        source_chain: "unichain",
        source_contract: CONTRACTS.unichain.targetNFT,
        source_token_id: originalNFT.tokenId,
        mirror_chain: "xrpl-evm",
        bridge_timestamp: new Date().toISOString()
      }
    };

    // Upload metadata to IPFS or your preferred storage
    const metadataURI = await this.uploadMetadata(metadata);
    return metadataURI;
  }

  /**
   * Extract token ID from transaction receipt
   */
  private extractTokenIdFromReceipt(receipt: ethers.TransactionReceipt): string {
    // Look for Transfer event
    const transferTopic = ethers.id("Transfer(address,address,uint256)");
    
    for (const log of receipt.logs) {
      if (log.topics[0] === transferTopic) {
        // Token ID is the 3rd topic (index 2)
        const tokenId = BigInt(log.topics[3]);
        return tokenId.toString();
      }
    }

    // Fallback: try to parse logs with the contract interface
    try {
      const iface = new ethers.Interface(MIRROR_NFT_ABI);
      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog(log);
          if (parsed?.name === 'Transfer' && parsed.args?.tokenId) {
            return parsed.args.tokenId.toString();
          }
        } catch (e) {
          // Continue to next log
        }
      }
    } catch (error) {
      console.error('Error parsing logs:', error);
    }

    throw new Error('Could not extract token ID from transaction receipt');
  }

  /**
   * Upload metadata to storage (IPFS, etc.)
   */
  private async uploadMetadata(metadata: any): Promise<string> {
    // For demo purposes, we'll create a data URI
    // In production, upload to IPFS or your preferred storage
    
    try {
      // Simple in-memory storage for demo
      const metadataJson = JSON.stringify(metadata, null, 2);
      const base64Data = Buffer.from(metadataJson).toString('base64');
      const dataURI = `data:application/json;base64,${base64Data}`;
      
      console.log('Metadata created as data URI');
      return dataURI;
      
      // TODO: Implement actual IPFS upload
      // const ipfsHash = await uploadToIPFS(metadata);
      // return `ipfs://${ipfsHash}`;
    } catch (error) {
      console.error('Failed to upload metadata:', error);
      // Return a placeholder URI
      return `https://api.example.com/metadata/${Date.now()}`;
    }
  }

  /**
   * Get mirror NFT details
   */
  async getMirrorNFTDetails(tokenId: string): Promise<any> {
    if (!this.provider || !CONTRACTS.xrplEvm.mirrorNFT) {
      throw new Error('Provider or contract not configured');
    }

    const contract = new ethers.Contract(
      CONTRACTS.xrplEvm.mirrorNFT,
      MIRROR_NFT_ABI,
      this.provider
    );

    try {
      const [tokenURI, owner] = await Promise.all([
        contract.tokenURI(tokenId),
        contract.ownerOf(tokenId)
      ]);

      return {
        tokenId,
        tokenURI,
        owner,
        metadata: await this.fetchMetadataFromURI(tokenURI)
      };
    } catch (error) {
      throw new Error(`Failed to get mirror NFT details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetch metadata from URI
   */
  private async fetchMetadataFromURI(uri: string): Promise<any> {
    try {
      if (uri.startsWith('data:application/json;base64,')) {
        const base64Data = uri.split(',')[1];
        return JSON.parse(Buffer.from(base64Data, 'base64').toString());
      }
      
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch metadata:', error);
      return null;
    }
  }
} 