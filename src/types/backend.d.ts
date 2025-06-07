import { Timestamp } from 'firebase/firestore';
export interface UserProfile {
    id: string;
    createdAt: Timestamp;
    lastActive: Timestamp;
    isOnboarded: boolean;
    privacyLevel: 'strict' | 'balanced' | 'open';
    locationSharingEnabled: boolean;
}
export interface UserSettings {
    notifications: {
        discoveries: boolean;
        recommendations: boolean;
        systemUpdates: boolean;
    };
    privacy: {
        shareLocation: boolean;
        shareTimestamps: boolean;
        anonymousMode: boolean;
    };
    ai: {
        detailLevel: 'minimal' | 'standard' | 'detailed';
        includeEmotions: boolean;
        languagePreference: string;
    };
}
export interface DIDRecord {
    didId: string;
    xrplAddress: string;
    nftTokenId: string;
    createdAt: Timestamp;
    verificationStatus: 'pending' | 'verified' | 'failed';
    publicKey: string;
}
export interface UserAnalytics {
    totalEntries: number;
    averageEntriesPerWeek: number;
    topThemes: string[];
    locationClusters: number;
    discoveryScore: number;
    lastAnalysisUpdate: Timestamp;
}
export interface DescriptionRecord {
    id: string;
    content: string;
    embedding: number[];
    originalHash: string;
    merkleRoot: string;
    location?: {
        latitude: number;
        longitude: number;
        accuracy: number;
        placeName?: string;
    };
    themes: string[];
    sentiment: number;
    confidence: number;
    userId: string;
    timestamp: Timestamp;
    xrplTransaction: {
        hash: string;
        ledgerIndex: number;
        timestamp: Timestamp;
    };
}
export interface DescriptionMetadata {
    processingTime: number;
    aiModelUsed: string;
    contentType: 'photo' | 'text' | 'mixed';
    imageAnalysis?: {
        objects: string[];
        colors: string[];
        composition: string;
    };
    privacyFlags: string[];
}
export interface ContentAnalysis {
    description: string;
    themes: string[];
    sentiment: number;
    confidence: number;
    suggestedTags: string[];
    locationContext?: string;
}
export interface ThemeAnalysis {
    primaryThemes: string[];
    emotions: string[];
    activities: string[];
    objects: string[];
    places: string[];
    people: string[];
}
export interface AIProcessingPipeline {
    analyzeContent(input: {
        photo?: string;
        text?: string;
        location?: LocationData;
    }): Promise<ContentAnalysis>;
    generateEmbedding(description: string): Promise<number[]>;
    extractThemes(description: string): Promise<ThemeAnalysis>;
    sanitizeContent(description: string): Promise<string>;
}
export interface SimilarityCluster {
    id: string;
    centroid: number[];
    userIds: string[];
    locationCluster: GeoCluster;
    commonThemes: string[];
    lastUpdated: Timestamp;
}
export interface GeoCluster {
    centerLat: number;
    centerLng: number;
    radius: number;
    placeName?: string;
    placeType?: string;
}
export interface SimilarUser {
    anonymizedId: string;
    similarityScore: number;
    commonThemes: string[];
    locationOverlap: number;
    timePatternSimilarity: number;
}
export interface Recommendation {
    id: string;
    type: 'location' | 'activity' | 'theme';
    title: string;
    description: string;
    location?: {
        latitude: number;
        longitude: number;
        placeName: string;
    };
    confidenceScore: number;
    basedOnUsers: string[];
    themes: string[];
    estimatedInterest: number;
}
export interface RecommendationItem {
    id: string;
    type: 'place' | 'activity' | 'experience';
    title: string;
    description: string;
    location?: LocationData;
    themes: string[];
    similarityScore: number;
    noveltyScore: number;
    confidenceScore: number;
    generatedAt: Timestamp;
    interactionHistory: InteractionRecord[];
}
export interface InteractionRecord {
    type: 'view' | 'like' | 'dismiss' | 'visit';
    timestamp: Timestamp;
    metadata?: Record<string, any>;
}
export interface UserPreferences {
    preferredThemes: string[];
    avoidedThemes: string[];
    locationRadius: number;
    noveltyPreference: number;
    socialLevel: number;
}
export interface BlockchainRecord {
    txHash: string;
    merkleRoot: string;
    didReference: string;
    entryTimestamp: Timestamp;
    ledgerIndex: number;
    verificationStatus: 'pending' | 'confirmed' | 'failed';
}
export interface MerkleTree {
    nodes: MerkleNode[];
    root: string;
    depth: number;
    entryCount: number;
}
export interface MerkleNode {
    hash: string;
    left?: string;
    right?: string;
    data?: string;
}
export interface MerkleProof {
    leaf: string;
    proof: string[];
    root: string;
    index: number;
}
export interface DIDCreationResult {
    didId: string;
    xrplAddress: string;
    nftTokenId: string;
    transactionHash: string;
    success: boolean;
    error?: string;
}
export interface XRPLTransactionResult {
    hash: string;
    ledgerIndex: number;
    success: boolean;
    fee: string;
    error?: string;
}
export interface VerificationResult {
    isValid: boolean;
    merkleRoot: string;
    blockchainRecord?: BlockchainRecord;
    verifiedAt: Timestamp;
}
export interface DIDResolutionResult {
    didId: string;
    xrplAddress: string;
    nftTokenId: string;
    verificationStatus: string;
    blockchainRecords: BlockchainRecord[];
    lastUpdated: Timestamp;
}
export interface DiaryEntry {
    id: string;
    content: string;
    photos: string[];
    location?: LocationData;
    timestamp: Timestamp;
    mood?: string;
    tags: string[];
    isPrivate: boolean;
    isSynced: boolean;
    localOnly: boolean;
}
export interface DraftEntry {
    id: string;
    content: string;
    photos: string[];
    location?: LocationData;
    lastModified: Timestamp;
    isAutoSaved: boolean;
}
export interface PhotoMetadata {
    id: string;
    filename: string;
    size: number;
    mimeType: string;
    dimensions: {
        width: number;
        height: number;
    };
    location?: LocationData;
    timestamp: Timestamp;
    isCompressed: boolean;
}
export interface SyncOperation {
    id: string;
    type: 'create' | 'update' | 'delete';
    resource: 'entry' | 'photo' | 'settings';
    resourceId: string;
    data?: any;
    priority: number;
    timestamp: Timestamp;
    retryCount: number;
    lastError?: string;
}
export interface SyncResult {
    operationId: string;
    success: boolean;
    error?: string;
    conflictResolution?: 'local' | 'remote' | 'merge';
}
export interface SyncConflict {
    operationId: string;
    localData: any;
    remoteData: any;
    conflictType: 'timestamp' | 'content' | 'deletion';
    suggestedResolution: 'local' | 'remote' | 'merge';
}
export interface LocationData {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude?: number;
    speed?: number;
    heading?: number;
    timestamp: number;
    placeName?: string;
    placeType?: string;
}
export interface TimeRange {
    start: Timestamp;
    end: Timestamp;
}
export interface ClusterUpdateResult {
    clustersCreated: number;
    clustersUpdated: number;
    clustersRemoved: number;
    totalUsers: number;
    processingTime: number;
}
export interface DiscoveryScore {
    overall: number;
    locationExploration: number;
    themeVariety: number;
    socialConnections: number;
    temporalPatterns: number;
}
export interface AuthSystem {
    createAnonymousSession(): Promise<SessionToken>;
    authenticateWithDID(didId: string, signature: string): Promise<AuthResult>;
    verifyPermissions(userId: string, resource: string): Promise<boolean>;
    refreshSession(token: SessionToken): Promise<SessionToken>;
}
export interface SessionToken {
    token: string;
    userId: string;
    expiresAt: Timestamp;
    permissions: string[];
}
export interface AuthResult {
    success: boolean;
    sessionToken?: SessionToken;
    error?: string;
}
export interface DIDManagementService {
    createDID(userMetadata: UserMetadata): Promise<DIDCreationResult>;
    storeMerkleRoot(params: {
        didId: string;
        merkleRoot: string;
        timestamp: number;
        userWallet: any;
    }): Promise<XRPLTransactionResult>;
    verifyMerkleRoot(merkleRoot: string): Promise<VerificationResult>;
    resolveDID(didId: string): Promise<DIDResolutionResult>;
}
export interface UserMetadata {
    anonymizedId: string;
    createdAt: Timestamp;
    privacyPreferences: UserSettings['privacy'];
}
export interface MerkleTreeService {
    createMerkleTree(entries: DiaryEntry[]): MerkleTree;
    generateMerkleRoot(tree: MerkleTree): string;
    generateMerkleProof(tree: MerkleTree, entryIndex: number): MerkleProof;
    verifyMerkleProof(proof: MerkleProof, merkleRoot: string): boolean;
}
export interface SyncManager {
    queueOperation(operation: SyncOperation): Promise<void>;
    processSyncQueue(): Promise<SyncResult[]>;
    resolveConflicts(conflicts: SyncConflict[]): Promise<void>;
    incrementalSync(lastSyncTimestamp: number): Promise<SyncResult>;
}
export interface DiscoveryEngine {
    findSimilarUsers(params: {
        userEmbeddings: number[][];
        locationHistory: LocationData[];
        timeWindow: TimeRange;
        maxResults: number;
    }): Promise<SimilarUser[]>;
    generateRecommendations(params: {
        userId: string;
        similarUsers: SimilarUser[];
        excludeVisited: boolean;
    }): Promise<Recommendation[]>;
    updateUserClusters(): Promise<ClusterUpdateResult>;
    calculateDiscoveryScore(userA: UserProfile, userB: UserProfile): Promise<number>;
}
export interface APIResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: string;
    requestId: string;
}
export interface PaginatedResponse<T> extends APIResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
export interface BackendConfig {
    firebase: {
        projectId: string;
        serviceAccountKey: string;
    };
    xrpl: {
        networkUrl: string;
        isTestnet: boolean;
    };
    ai: {
        anthropicApiKey: string;
        defaultModel: string;
    };
    security: {
        jwtSecret: string;
        corsOrigins: string[];
        rateLimitWindow: number;
        rateLimitMax: number;
    };
    storage: {
        maxFileSize: number;
        allowedImageTypes: string[];
        compressionQuality: number;
    };
}
//# sourceMappingURL=backend.d.ts.map