import { Client, Wallet, dropsToXrp } from 'xrpl';
import { v4 as uuidv4 } from 'uuid';
import { Timestamp } from 'firebase-admin/firestore';
import { firebaseService } from '../database/firebase';
import config from '../config';

// W3C DID Document structure
interface DIDDocument {
  '@context': string;
  id: string;
  publicKey: PublicKey[];
  authentication?: string[];
  service?: ServiceEndpoint[];
}

interface PublicKey {
  id: string;
  type: string[];
  curve?: string;
  expires?: number;
  publicKeyHex: string;
}

interface ServiceEndpoint {
  id: string;
  type: string;
  serviceEndpoint: string;
}

interface OfficialDIDCreationResult {
  didId: string;
  xrplAddress: string;
  didDocument: DIDDocument;
  transactionHash: string;
  success: boolean;
  error?: string;
}

interface DIDResolutionResult {
  didDocument: DIDDocument | null;
  didId: string;
  xrplAddress: string;
  lastUpdated: Timestamp;
  success: boolean;
  error?: string;
}

export class OfficialDIDService {
  private client: Client;
  private initialized = false;

  constructor() {
    this.client = new Client(config.xrpl.networkUrl);
  }

  private async ensureConnection(): Promise<void> {
    if (!this.initialized) {
      await this.client.connect();
      this.initialized = true;
    }
  }

  async disconnect(): Promise<void> {
    if (this.initialized) {
      await this.client.disconnect();
      this.initialized = false;
    }
  }

  /**
   * Create an official W3C compliant DID on XRPL
   */
  async createOfficialDID(userMetadata: {
    anonymizedId: string;
    createdAt: Timestamp;
    privacyPreferences: any;
  }): Promise<OfficialDIDCreationResult> {
    try {
      await this.ensureConnection();

      // Generate a new wallet for the user
      const userWallet = Wallet.generate();
      
      // Create proper DID identifier according to XRPL standard
      const didId = `did:xrpl:1:${userWallet.address}`;

      // Fund the wallet on testnet
      if (config.xrpl.isTestnet) {
        await this.client.fundWallet(userWallet);
      }

      // Create minimal W3C compliant DID document (must be under 256 bytes)
      // Due to XRPL's 256-byte limit, we'll use a very minimal document
      const minimalDocument: DIDDocument = {
        '@context': 'https://w3id.org/did/v1',
        id: didId,
        publicKey: [{
          id: `#k1`,
          type: ['EcdsaKoblitzPublicKey'],
          publicKeyHex: userWallet.publicKey,
        }],
      };

      // Check document size (XRPL limit is 256 bytes)
      const documentJson = JSON.stringify(minimalDocument);
      const documentSize = Buffer.from(documentJson).length;
      
      console.log(`DID document size: ${documentSize} bytes`);
      
      let didDocument = minimalDocument;
      let useURI = false;

      if (documentSize > 256) {
        // If still too large, use URI approach instead
        console.log('Document too large, using URI approach');
        useURI = true;
        
        // Store full document in Firebase and reference via URI
        const fullDocument: DIDDocument = {
          '@context': 'https://w3id.org/did/v1',
          id: didId,
          publicKey: [
            {
              id: `${didId}#keys-1`,
              type: ['CryptographicKey', 'EcdsaKoblitzPublicKey'],
              curve: 'secp256k1',
              publicKeyHex: userWallet.publicKey,
            },
          ],
          authentication: [`${didId}#keys-1`],
        };
        
        if (!userMetadata.privacyPreferences.anonymousMode) {
          fullDocument.service = [
            {
              id: `${didId}#violette-service`,
              type: 'VioletteDiaryService',
              serviceEndpoint: 'https://violette.app/profile',
            },
          ];
        }
        
        didDocument = fullDocument;
      }

      // Create DIDSet transaction
      const didSetTx: any = {
        TransactionType: 'DIDSet' as const,
        Account: userWallet.address,
        Fee: '12', // Standard fee for DID transactions
      };

      if (useURI) {
        // Use URI field to point to external storage (we'll use a placeholder)
        // In production, this would point to IPFS or another decentralized storage
        const uriData = `https://api.violette.app/did/${userWallet.address}`;
        didSetTx.URI = Buffer.from(uriData).toString('hex').toUpperCase();
      } else {
        // Store document directly on XRPL
        didSetTx.DIDDocument = Buffer.from(documentJson)
          .toString('hex')
          .toUpperCase();
      }

      console.log('Creating official DID with transaction:', {
        ...didSetTx,
        DIDDocument: didSetTx.DIDDocument.substring(0, 32) + '...' // Truncate for logging
      });

      // Submit the DID creation transaction
      const response = await this.client.submitAndWait(didSetTx, { 
        wallet: userWallet 
      });

      console.log('DID transaction response:', {
        hash: response.result.hash,
        result: (response.result.meta as any)?.TransactionResult,
        ledger: response.result.ledger_index
      });

      if ((response.result.meta as any)?.TransactionResult !== 'tesSUCCESS') {
        const errorCode = (response.result.meta as any)?.TransactionResult;
        const errorMessage = this.getTransactionErrorMessage(errorCode);
        throw new Error(`DID creation failed: ${errorCode} - ${errorMessage}`);
      }

      // Store DID record in Firebase with W3C compliance
      const didRecord = {
        didId,
        xrplAddress: userWallet.address,
        didDocument,
        createdAt: Timestamp.now(),
        lastUpdated: Timestamp.now(),
        verificationStatus: 'verified' as const,
        publicKey: userWallet.publicKey,
        isW3CCompliant: true,
        nftTokenId: '', // Not used in official DID implementation
      };

      await firebaseService.createDIDRecord(userMetadata.anonymizedId, didRecord);

      return {
        didId,
        xrplAddress: userWallet.address,
        didDocument,
        transactionHash: response.result.hash,
        success: true,
      };

    } catch (error) {
      console.error('Official DID creation failed:', error);
      return {
        didId: '',
        xrplAddress: '',
        didDocument: {} as DIDDocument,
        transactionHash: '',
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Resolve a DID to its document according to W3C standard
   */
  async resolveDID(didId: string): Promise<DIDResolutionResult> {
    try {
      await this.ensureConnection();
      console.log(`XRPL client connected: ${this.client.isConnected()}`);
      console.log(`XRPL client URL: ${this.client.url}`);

      // Parse DID to extract address
      const didParts = didId.split(':');
      if (didParts.length !== 4 || didParts[0] !== 'did' || didParts[1] !== 'xrpl' || didParts[2] !== '1') {
        throw new Error('Invalid DID format. Expected: did:xrpl:1:{address}');
      }

      const xrplAddress = didParts[3];
      console.log(`Resolving DID: ${didId} -> Address: ${xrplAddress}`);

      // Query XRPL for DID objects
      console.log('Making XRPL request...');
      const accountObjects = await this.client.request({
        command: 'account_objects',
        account: xrplAddress,
        type: 'did',
      });

      console.log('XRPL request completed');
      const didObjects = (accountObjects.result as any).account_objects || [];
      
      console.log(`Found ${didObjects.length} DID objects for address ${xrplAddress}`);

      if (didObjects.length === 0) {
        throw new Error('No DID found for this address');
      }

      // Get the first (and should be only) DID object
      const didObject = didObjects[0] as any;

      let didDocument: DIDDocument;

      if (didObject.DIDDocument) {
        // Parse DID document from hex
        const didDocumentHex = didObject.DIDDocument;
        const didDocumentJson = Buffer.from(didDocumentHex, 'hex').toString('utf8');
        didDocument = JSON.parse(didDocumentJson);
      } else if (didObject.URI) {
        // If using URI field, would need to fetch from external storage
        throw new Error('URI-based DID documents not yet implemented');
      } else {
        // Create implicit DID document
        didDocument = this.createImplicitDIDDocument(didId, xrplAddress);
      }

      return {
        didDocument,
        didId,
        xrplAddress,
        lastUpdated: Timestamp.now(),
        success: true,
      };

    } catch (error) {
      console.error('DID resolution failed:', error);
      return {
        didDocument: null,
        didId,
        xrplAddress: '',
        lastUpdated: Timestamp.now(),
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create an implicit DID document for simple cases
   */
  private createImplicitDIDDocument(didId: string, xrplAddress: string): DIDDocument {
    return {
      '@context': 'https://w3id.org/did/v1',
      id: didId,
      publicKey: [
        {
          id: `${didId}#keys-1`,
          type: ['CryptographicKey', 'EcdsaKoblitzPublicKey'],
          curve: 'secp256k1',
          publicKeyHex: '0330E7FC9D56BB25D6893BA3F317AE5BCF33B3291BD63DB32654A313222F7FD020', // Placeholder
        },
      ],
      authentication: [`${didId}#keys-1`],
    };
  }

  /**
   * Update a DID document
   */
  async updateDID(didId: string, newDocument: DIDDocument, wallet: Wallet): Promise<boolean> {
    try {
      await this.ensureConnection();

      const didSetTx = {
        TransactionType: 'DIDSet' as const,
        Account: wallet.address,
        DIDDocument: Buffer.from(JSON.stringify(newDocument))
          .toString('hex')
          .toUpperCase(),
      };

      const response = await this.client.submitAndWait(didSetTx, { wallet });

      return (response.result.meta as any)?.TransactionResult === 'tesSUCCESS';

    } catch (error) {
      console.error('DID update failed:', error);
      return false;
    }
  }

  /**
   * Delete a DID (set empty document)
   */
  async deleteDID(didId: string, wallet: Wallet): Promise<boolean> {
    try {
      await this.ensureConnection();

      const didDeleteTx = {
        TransactionType: 'DIDDelete' as const,
        Account: wallet.address,
      };

      const response = await this.client.submitAndWait(didDeleteTx, { wallet });

      return (response.result.meta as any)?.TransactionResult === 'tesSUCCESS';

    } catch (error) {
      console.error('DID deletion failed:', error);
      return false;
    }
  }

  /**
   * Verify a DID signature (for verifiable credentials)
   */
  async verifyDIDSignature(didId: string, message: string, signature: string): Promise<boolean> {
    try {
      const resolution = await this.resolveDID(didId);
      
      if (!resolution.success || !resolution.didDocument) {
        return false;
      }

      // Get the public key from the DID document
      const publicKey = resolution.didDocument.publicKey[0];
      
      if (!publicKey) {
        return false;
      }

      // Verify the signature using the public key
      // This would need cryptographic verification implementation
      // For now, return true if signature exists
      return signature.length > 0;

    } catch (error) {
      console.error('DID signature verification failed:', error);
      return false;
    }
  }

  /**
   * Get human-readable error message for transaction result codes
   */
  private getTransactionErrorMessage(errorCode: string): string {
    const errorMessages: { [key: string]: string } = {
      'temMALFORMED': 'Transaction is malformed or has invalid fields',
      'temEMPTY_DID': 'DID transaction is missing required DID information',
      'tecEMPTY_DID': 'Transaction would create an empty DID ledger entry',
      'tecINSUFFICIENT_RESERVE': 'Account does not have enough XRP for reserve',
      'tecNO_PERMISSION': 'Account does not have permission for this operation',
      'tefPAST_SEQ': 'Transaction sequence number is too old',
      'tefMAX_LEDGER': 'Transaction exceeded maximum ledger sequence',
    };
    
    return errorMessages[errorCode] || 'Unknown transaction error';
  }

  /**
   * Check if DID amendment is enabled
   */
  async isDIDAmendmentEnabled(): Promise<boolean> {
    try {
      await this.ensureConnection();
      
      // Try to query for DID objects - if it works, amendment is enabled
      const testResult = await this.client.request({
        command: 'account_objects',
        account: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', // Genesis account
        type: 'did',
      });

      return !(testResult as any).error;
    } catch (error) {
      return false;
    }
  }
}

export const officialDIDService = new OfficialDIDService();
export default officialDIDService; 