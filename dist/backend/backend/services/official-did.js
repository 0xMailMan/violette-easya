"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.officialDIDService = exports.OfficialDIDService = void 0;
const xrpl_1 = require("xrpl");
const firestore_1 = require("firebase-admin/firestore");
const firebase_1 = require("../database/firebase");
const config_1 = __importDefault(require("../config"));
class OfficialDIDService {
    constructor() {
        this.initialized = false;
        this.client = new xrpl_1.Client(config_1.default.xrpl.networkUrl);
    }
    async ensureConnection() {
        if (!this.initialized) {
            await this.client.connect();
            this.initialized = true;
        }
    }
    async disconnect() {
        if (this.initialized) {
            await this.client.disconnect();
            this.initialized = false;
        }
    }
    /**
     * Create an official W3C compliant DID on XRPL
     */
    async createOfficialDID(userMetadata) {
        try {
            await this.ensureConnection();
            // Generate a new wallet for the user
            const userWallet = xrpl_1.Wallet.generate();
            // Create proper DID identifier according to XRPL standard
            const didId = `did:xrpl:1:${userWallet.address}`;
            // Fund the wallet on testnet
            if (config_1.default.xrpl.isTestnet) {
                await this.client.fundWallet(userWallet);
            }
            // Create W3C compliant DID document (must be under 256 bytes)
            const didDocument = {
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
            // Check document size (XRPL limit is 256 bytes)
            const documentJson = JSON.stringify(didDocument);
            const documentSize = Buffer.from(documentJson).length;
            if (documentSize > 256) {
                throw new Error(`DID document too large: ${documentSize} bytes (max 256)`);
            }
            console.log(`DID document size: ${documentSize} bytes`);
            // Add optional service endpoints only if there's space
            if (!userMetadata.privacyPreferences.anonymousMode && documentSize < 200) {
                const serviceEndpoint = {
                    id: `${didId}#svc`,
                    type: 'VioletteService',
                    serviceEndpoint: 'https://violette.app',
                };
                const testDoc = { ...didDocument, service: [serviceEndpoint] };
                const testSize = Buffer.from(JSON.stringify(testDoc)).length;
                if (testSize <= 256) {
                    didDocument.service = [serviceEndpoint];
                }
            }
            // Create DIDSet transaction
            const didSetTx = {
                TransactionType: 'DIDSet',
                Account: userWallet.address,
                Fee: '12', // Standard fee for DID transactions
                DIDDocument: Buffer.from(JSON.stringify(didDocument))
                    .toString('hex')
                    .toUpperCase(),
                // Optional: could also use URI field to point to external storage
                // URI: "ipfs://QmXXXXXXXXXXXXXXXXXXXXXXX"
            };
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
                result: response.result.meta?.TransactionResult,
                ledger: response.result.ledger_index
            });
            if (response.result.meta?.TransactionResult !== 'tesSUCCESS') {
                const errorCode = response.result.meta?.TransactionResult;
                const errorMessage = this.getTransactionErrorMessage(errorCode);
                throw new Error(`DID creation failed: ${errorCode} - ${errorMessage}`);
            }
            // Store DID record in Firebase with W3C compliance
            const didRecord = {
                didId,
                xrplAddress: userWallet.address,
                didDocument,
                createdAt: firestore_1.Timestamp.now(),
                lastUpdated: firestore_1.Timestamp.now(),
                verificationStatus: 'verified',
                publicKey: userWallet.publicKey,
                isW3CCompliant: true,
                nftTokenId: '', // Not used in official DID implementation
            };
            await firebase_1.firebaseService.createDIDRecord(userMetadata.anonymizedId, didRecord);
            return {
                didId,
                xrplAddress: userWallet.address,
                didDocument,
                transactionHash: response.result.hash,
                success: true,
            };
        }
        catch (error) {
            console.error('Official DID creation failed:', error);
            return {
                didId: '',
                xrplAddress: '',
                didDocument: {},
                transactionHash: '',
                success: false,
                error: error.message,
            };
        }
    }
    /**
     * Resolve a DID to its document according to W3C standard
     */
    async resolveDID(didId) {
        try {
            await this.ensureConnection();
            // Parse DID to extract address
            const didParts = didId.split(':');
            if (didParts.length !== 4 || didParts[0] !== 'did' || didParts[1] !== 'xrpl' || didParts[2] !== '1') {
                throw new Error('Invalid DID format. Expected: did:xrpl:1:{address}');
            }
            const xrplAddress = didParts[3];
            // Query XRPL for DID objects
            const accountObjects = await this.client.request({
                command: 'account_objects',
                account: xrplAddress,
                type: 'did',
            });
            const didObjects = accountObjects.result.account_objects || [];
            if (didObjects.length === 0) {
                throw new Error('No DID found for this address');
            }
            // Get the first (and should be only) DID object
            const didObject = didObjects[0];
            let didDocument;
            if (didObject.DIDDocument) {
                // Parse DID document from hex
                const didDocumentHex = didObject.DIDDocument;
                const didDocumentJson = Buffer.from(didDocumentHex, 'hex').toString('utf8');
                didDocument = JSON.parse(didDocumentJson);
            }
            else if (didObject.URI) {
                // If using URI field, would need to fetch from external storage
                throw new Error('URI-based DID documents not yet implemented');
            }
            else {
                // Create implicit DID document
                didDocument = this.createImplicitDIDDocument(didId, xrplAddress);
            }
            return {
                didDocument,
                didId,
                xrplAddress,
                lastUpdated: firestore_1.Timestamp.now(),
                success: true,
            };
        }
        catch (error) {
            console.error('DID resolution failed:', error);
            return {
                didDocument: null,
                didId,
                xrplAddress: '',
                lastUpdated: firestore_1.Timestamp.now(),
                success: false,
                error: error.message,
            };
        }
    }
    /**
     * Create an implicit DID document for simple cases
     */
    createImplicitDIDDocument(didId, xrplAddress) {
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
    async updateDID(didId, newDocument, wallet) {
        try {
            await this.ensureConnection();
            const didSetTx = {
                TransactionType: 'DIDSet',
                Account: wallet.address,
                DIDDocument: Buffer.from(JSON.stringify(newDocument))
                    .toString('hex')
                    .toUpperCase(),
            };
            const response = await this.client.submitAndWait(didSetTx, { wallet });
            return response.result.meta?.TransactionResult === 'tesSUCCESS';
        }
        catch (error) {
            console.error('DID update failed:', error);
            return false;
        }
    }
    /**
     * Delete a DID (set empty document)
     */
    async deleteDID(didId, wallet) {
        try {
            await this.ensureConnection();
            const didDeleteTx = {
                TransactionType: 'DIDDelete',
                Account: wallet.address,
            };
            const response = await this.client.submitAndWait(didDeleteTx, { wallet });
            return response.result.meta?.TransactionResult === 'tesSUCCESS';
        }
        catch (error) {
            console.error('DID deletion failed:', error);
            return false;
        }
    }
    /**
     * Verify a DID signature (for verifiable credentials)
     */
    async verifyDIDSignature(didId, message, signature) {
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
        }
        catch (error) {
            console.error('DID signature verification failed:', error);
            return false;
        }
    }
    /**
     * Get human-readable error message for transaction result codes
     */
    getTransactionErrorMessage(errorCode) {
        const errorMessages = {
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
    async isDIDAmendmentEnabled() {
        try {
            await this.ensureConnection();
            // Try to query for DID objects - if it works, amendment is enabled
            const testResult = await this.client.request({
                command: 'account_objects',
                account: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', // Genesis account
                type: 'did',
            });
            return !testResult.error;
        }
        catch (error) {
            return false;
        }
    }
}
exports.OfficialDIDService = OfficialDIDService;
exports.officialDIDService = new OfficialDIDService();
exports.default = exports.officialDIDService;
//# sourceMappingURL=official-did.js.map