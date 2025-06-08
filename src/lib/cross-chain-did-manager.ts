import * as xrpl from 'xrpl';
import { 
  CrossChainDIDDocument, 
  DIDCreationResult, 
  UnichainNFTData, 
  MirrorNFTResult, 
  VerificationMethod, 
  ServiceEndpoint 
} from '../types/cross-chain';
import { CONTRACTS } from './cross-chain-config';

export class CrossChainDIDManager {
  private client: xrpl.Client;
  private wallet: xrpl.Wallet;

  constructor(client: xrpl.Client, wallet: xrpl.Wallet) {
    this.client = client;
    this.wallet = wallet;
  }

  /**
   * Create or update DID document with cross-chain NFT information
   */
  async createOrUpdateDID(
    nftData: UnichainNFTData,
    mirrorNFTResults: MirrorNFTResult[]
  ): Promise<DIDCreationResult> {
    try {
      const didDocument = this.createDIDDocument(nftData, mirrorNFTResults);
      
      // Store DID document on XRPL
      const result = await this.storeDIDOnXRPL(didDocument);
      
      return {
        success: true,
        transactionHash: result.transactionHash,
        nftokenId: result.nftokenId,
        didDocument
      };
    } catch (error) {
      throw new Error(`DID creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create W3C compliant DID document
   */
  private createDIDDocument(
    nftData: UnichainNFTData,
    mirrorNFTResults: MirrorNFTResult[]
  ): CrossChainDIDDocument {
    const didId = `did:xrpl:${this.wallet.address}`;

    const verificationMethod: VerificationMethod = {
      id: `${didId}#key-1`,
      type: "Ed25519VerificationKey2020",
      controller: didId,
      publicKeyHex: this.wallet.publicKey
    };

    const serviceEndpoint: ServiceEndpoint = {
      id: `${didId}#cross-chain-nft-registry`,
      type: "CrossChainNFTRegistry",
      serviceEndpoint: {
        unichain_nfts: nftData.nfts,
        xrpl_evm_mirrors: mirrorNFTResults,
        last_updated: new Date().toISOString()
      }
    };

    return {
      '@context': [
        "https://www.w3.org/ns/did/v1",
        "https://w3id.org/security/v1"
      ],
      id: didId,
      controller: [this.wallet.address],
      verificationMethod: [verificationMethod],
      service: [serviceEndpoint]
    };
  }

  /**
   * Store DID document on XRPL
   */
  private async storeDIDOnXRPL(didDocument: CrossChainDIDDocument): Promise<{
    transactionHash: string;
    nftokenId?: string;
  }> {
    try {
      // Method 1: Try using DIDSet transaction (if supported)
      const result = await this.createDIDWithNFToken(didDocument);
      return result;
    } catch (error) {
      console.warn('DIDSet transaction failed, falling back to Account Set:', error);
      // Method 2: Fall back to AccountSet with Domain field
      return await this.createDIDWithAccountSet(didDocument);
    }
  }

  /**
   * Create DID using NFToken method
   */
  private async createDIDWithNFToken(didDocument: CrossChainDIDDocument): Promise<{
    transactionHash: string;
    nftokenId: string;
  }> {
    const documentJson = JSON.stringify(didDocument);
    const documentHex = Buffer.from(documentJson, 'utf8').toString('hex').toUpperCase();

    if (documentHex.length > 2048) { // XRPL memo limit
      throw new Error('DID document too large for NFToken URI field');
    }

    const nftokenMintTx: xrpl.NFTokenMint = {
      TransactionType: 'NFTokenMint',
      Account: this.wallet.address,
      NFTokenTaxon: 0,
      URI: documentHex,
      Flags: 8 // tfTransferable
    };

    const prepared = await this.client.autofill(nftokenMintTx);
    const signed = this.wallet.sign(prepared);
    const result = await this.client.submitAndWait(signed.tx_blob);

    if (result.result.meta?.TransactionResult !== 'tesSUCCESS') {
      throw new Error(`NFToken creation failed: ${result.result.meta?.TransactionResult}`);
    }

    const nftokenId = this.extractNFTokenID(result);
    
    return {
      transactionHash: result.result.hash,
      nftokenId: nftokenId || 'unknown'
    };
  }

  /**
   * Create DID using AccountSet with Domain field
   */
  private async createDIDWithAccountSet(didDocument: CrossChainDIDDocument): Promise<{
    transactionHash: string;
  }> {
    // For AccountSet, we need to compress the DID document significantly
    const minimalDocument = {
      id: didDocument.id,
      type: "CrossChainDID",
      nfts: {
        unichain: didDocument.service[0].serviceEndpoint.unichain_nfts.length,
        xrpl_evm: didDocument.service[0].serviceEndpoint.xrpl_evm_mirrors.length
      },
      timestamp: new Date().toISOString()
    };

    const documentJson = JSON.stringify(minimalDocument);
    const documentHex = Buffer.from(documentJson, 'utf8').toString('hex').toUpperCase();

    if (documentHex.length > 512) { // Conservative limit for Domain field
      throw new Error('Even minimal DID document too large for Domain field');
    }

    const accountSetTx: xrpl.AccountSet = {
      TransactionType: 'AccountSet',
      Account: this.wallet.address,
      Domain: documentHex
    };

    const prepared = await this.client.autofill(accountSetTx);
    const signed = this.wallet.sign(prepared);
    const result = await this.client.submitAndWait(signed.tx_blob);

    if (result.result.meta?.TransactionResult !== 'tesSUCCESS') {
      throw new Error(`AccountSet failed: ${result.result.meta?.TransactionResult}`);
    }

    return {
      transactionHash: result.result.hash
    };
  }

  /**
   * Extract NFToken ID from transaction result
   */
  private extractNFTokenID(result: any): string | null {
    try {
      const affectedObjects = result.result.meta?.AffectedNodes || [];
      for (const node of affectedObjects) {
        if (node.CreatedNode?.LedgerEntryType === 'NFToken') {
          return node.CreatedNode.NewFields?.NFTokenID;
        }
        if (node.ModifiedNode?.LedgerEntryType === 'NFTokenPage') {
          // Look for new NFTokens in the page
          const finalFields = node.ModifiedNode.FinalFields;
          const previousFields = node.ModifiedNode.PreviousFields;
          if (finalFields?.NFTokens && previousFields?.NFTokens) {
            // Find the difference to get the new token
            const newTokens = finalFields.NFTokens.filter((token: any) => 
              !previousFields.NFTokens.some((prevToken: any) => 
                prevToken.NFToken.NFTokenID === token.NFToken.NFTokenID
              )
            );
            if (newTokens.length > 0) {
              return newTokens[0].NFToken.NFTokenID;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error extracting NFToken ID:', error);
    }
    return null;
  }

  /**
   * Resolve an existing DID document
   */
  async resolveDID(didId: string): Promise<CrossChainDIDDocument | null> {
    try {
      // Parse DID to extract address
      const didParts = didId.split(':');
      if (didParts.length < 3 || didParts[0] !== 'did' || didParts[1] !== 'xrpl') {
        throw new Error('Invalid DID format');
      }

      const xrplAddress = didParts[2];

      // Try to find DID in NFTokens first
      const nfTokens = await this.getNFTokensForAddress(xrplAddress);
      for (const token of nfTokens) {
        if (token.URI) {
          try {
            const documentJson = Buffer.from(token.URI, 'hex').toString('utf8');
            const document = JSON.parse(documentJson);
            if (document.id === didId) {
              return document;
            }
          } catch (e) {
            // Not a valid DID document, continue
          }
        }
      }

      // Fall back to AccountSet Domain field
      const accountInfo = await this.client.request({
        command: 'account_info',
        account: xrplAddress
      });

      const domain = accountInfo.result.account_data.Domain;
      if (domain) {
        try {
          const documentJson = Buffer.from(domain, 'hex').toString('utf8');
          const minimalDocument = JSON.parse(documentJson);
          
          // Reconstruct full DID document from minimal version
          return this.reconstructDIDDocument(minimalDocument);
        } catch (e) {
          console.error('Failed to parse Domain field as DID document:', e);
        }
      }

      return null;
    } catch (error) {
      console.error('DID resolution failed:', error);
      return null;
    }
  }

  /**
   * Get NFTokens for an address
   */
  private async getNFTokensForAddress(address: string): Promise<any[]> {
    try {
      const response = await this.client.request({
        command: 'account_nfts',
        account: address
      });
      return response.result.account_nfts || [];
    } catch (error) {
      console.error('Failed to get NFTokens:', error);
      return [];
    }
  }

  /**
   * Reconstruct full DID document from minimal version
   */
  private reconstructDIDDocument(minimalDocument: any): CrossChainDIDDocument {
    return {
      '@context': [
        "https://www.w3.org/ns/did/v1",
        "https://w3id.org/security/v1"
      ],
      id: minimalDocument.id,
      controller: [this.wallet.address],
      verificationMethod: [{
        id: `${minimalDocument.id}#key-1`,
        type: "Ed25519VerificationKey2020",
        controller: minimalDocument.id,
        publicKeyHex: this.wallet.publicKey
      }],
      service: [{
        id: `${minimalDocument.id}#cross-chain-nft-registry`,
        type: "CrossChainNFTRegistry",
        serviceEndpoint: {
          unichain_nfts: [], // Would need to be reconstructed from other sources
          xrpl_evm_mirrors: [], // Would need to be reconstructed from other sources
          last_updated: minimalDocument.timestamp || new Date().toISOString()
        }
      }]
    };
  }

  /**
   * Update existing DID with new NFT information
   */
  async updateDIDWithNFTData(
    didId: string,
    newNFTData: UnichainNFTData,
    newMirrorResults: MirrorNFTResult[]
  ): Promise<DIDCreationResult> {
    try {
      // Resolve existing DID
      const existingDID = await this.resolveDID(didId);
      
      if (!existingDID) {
        // Create new DID if it doesn't exist
        return await this.createOrUpdateDID(newNFTData, newMirrorResults);
      }

      // Merge existing and new NFT data
      const mergedNFTs = [
        ...existingDID.service[0].serviceEndpoint.unichain_nfts,
        ...newNFTData.nfts
      ];

      const mergedMirrors = [
        ...existingDID.service[0].serviceEndpoint.xrpl_evm_mirrors,
        ...newMirrorResults
      ];

      // Remove duplicates
      const uniqueNFTs = mergedNFTs.filter((nft, index, self) => 
        index === self.findIndex(n => n.tokenId === nft.tokenId)
      );

      const uniqueMirrors = mergedMirrors.filter((mirror, index, self) => 
        index === self.findIndex(m => m.originalTokenId === mirror.originalTokenId)
      );

      // Create updated DID document
      const updatedDocument: CrossChainDIDDocument = {
        ...existingDID,
        service: [{
          ...existingDID.service[0],
          serviceEndpoint: {
            unichain_nfts: uniqueNFTs,
            xrpl_evm_mirrors: uniqueMirrors,
            last_updated: new Date().toISOString()
          }
        }]
      };

      // Store updated DID
      const result = await this.storeDIDOnXRPL(updatedDocument);
      
      return {
        success: true,
        transactionHash: result.transactionHash,
        nftokenId: result.nftokenId,
        didDocument: updatedDocument
      };
    } catch (error) {
      throw new Error(`DID update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 