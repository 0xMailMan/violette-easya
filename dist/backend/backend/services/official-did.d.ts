import { Wallet } from 'xrpl';
import { Timestamp } from 'firebase-admin/firestore';
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
export declare class OfficialDIDService {
    private client;
    private initialized;
    constructor();
    private ensureConnection;
    disconnect(): Promise<void>;
    /**
     * Create an official W3C compliant DID on XRPL
     */
    createOfficialDID(userMetadata: {
        anonymizedId: string;
        createdAt: Timestamp;
        privacyPreferences: any;
    }): Promise<OfficialDIDCreationResult>;
    /**
     * Resolve a DID to its document according to W3C standard
     */
    resolveDID(didId: string): Promise<DIDResolutionResult>;
    /**
     * Create an implicit DID document for simple cases
     */
    private createImplicitDIDDocument;
    /**
     * Update a DID document
     */
    updateDID(didId: string, newDocument: DIDDocument, wallet: Wallet): Promise<boolean>;
    /**
     * Delete a DID (set empty document)
     */
    deleteDID(didId: string, wallet: Wallet): Promise<boolean>;
    /**
     * Verify a DID signature (for verifiable credentials)
     */
    verifyDIDSignature(didId: string, message: string, signature: string): Promise<boolean>;
    /**
     * Get human-readable error message for transaction result codes
     */
    private getTransactionErrorMessage;
    /**
     * Check if DID amendment is enabled
     */
    isDIDAmendmentEnabled(): Promise<boolean>;
}
export declare const officialDIDService: OfficialDIDService;
export default officialDIDService;
//# sourceMappingURL=official-did.d.ts.map