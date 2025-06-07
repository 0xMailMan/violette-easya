import admin from 'firebase-admin';
import { 
  getFirestore, 
  Firestore,
  CollectionReference,
  DocumentReference,
  Query,
  Timestamp 
} from 'firebase-admin/firestore';
import config from '../config';
import { 
  UserProfile, 
  UserSettings, 
  DIDRecord, 
  UserAnalytics,
  DescriptionRecord,
  DescriptionMetadata,
  SimilarityCluster,
  RecommendationItem,
  BlockchainRecord
} from '../../types/backend';

class FirebaseService {
  private db!: Firestore;
  private initialized = false;

  constructor() {
    this.initializeFirebase();
  }

  private initializeFirebase(): void {
    if (this.initialized) return;

    try {
      // Initialize Firebase Admin SDK
      const serviceAccount = JSON.parse(config.firebase.serviceAccountKey);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: config.firebase.projectId,
      });

      this.db = getFirestore();
      this.initialized = true;
      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
      throw error;
    }
  }

  // ============================================================================
  // Collection References
  // ============================================================================

  // Users collection and subcollections
  users(): CollectionReference<UserProfile> {
    return this.db.collection('users') as CollectionReference<UserProfile>;
  }

  userProfile(userId: string): DocumentReference<UserProfile> {
    return this.users().doc(userId);
  }

  userSettings(userId: string): DocumentReference<UserSettings> {
    return this.users().doc(userId).collection('settings').doc('user_settings') as DocumentReference<UserSettings>;
  }

  userDID(userId: string): DocumentReference<DIDRecord> {
    return this.users().doc(userId).collection('did').doc('did_record') as DocumentReference<DIDRecord>;
  }

  userAnalytics(userId: string): DocumentReference<UserAnalytics> {
    return this.users().doc(userId).collection('analytics').doc('user_analytics') as DocumentReference<UserAnalytics>;
  }

  // Descriptions collection
  descriptions(): CollectionReference<DescriptionRecord> {
    return this.db.collection('descriptions') as CollectionReference<DescriptionRecord>;
  }

  description(descriptionId: string): DocumentReference<DescriptionRecord> {
    return this.descriptions().doc(descriptionId);
  }

  // Similarity clusters collection
  similarityClusters(): CollectionReference<SimilarityCluster> {
    return this.db.collection('similarity_clusters') as CollectionReference<SimilarityCluster>;
  }

  similarityCluster(clusterId: string): DocumentReference<SimilarityCluster> {
    return this.similarityClusters().doc(clusterId);
  }

  // Recommendations collection
  userRecommendations(userId: string): CollectionReference<RecommendationItem> {
    return this.db.collection('recommendations').doc(userId).collection('suggestions') as CollectionReference<RecommendationItem>;
  }

  // Blockchain records collection
  blockchainRecords(): CollectionReference<BlockchainRecord> {
    return this.db.collection('blockchain_records') as CollectionReference<BlockchainRecord>;
  }

  blockchainRecord(txHash: string): DocumentReference<BlockchainRecord> {
    return this.blockchainRecords().doc(txHash);
  }

  // ============================================================================
  // User Management
  // ============================================================================

  async createUser(userId: string, userData: Partial<UserProfile>): Promise<void> {
    const userProfile: UserProfile = {
      id: userId,
      createdAt: Timestamp.now(),
      lastActive: Timestamp.now(),
      isOnboarded: false,
      privacyLevel: 'balanced',
      locationSharingEnabled: true,
      ...userData,
    };

    await this.userProfile(userId).set(userProfile);
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const doc = await this.userProfile(userId).get();
    return doc.exists ? doc.data() : null;
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    await this.userProfile(userId).update({
      ...updates,
      lastActive: Timestamp.now(),
    });
  }

  async getUserSettings(userId: string): Promise<UserSettings | null> {
    const doc = await this.userSettings(userId).get();
    return doc.exists ? doc.data() : null;
  }

  async updateUserSettings(userId: string, settings: UserSettings): Promise<void> {
    await this.userSettings(userId).set(settings, { merge: true });
  }

  // ============================================================================
  // DID Management
  // ============================================================================

  async createDIDRecord(userId: string, didData: DIDRecord): Promise<void> {
    await this.userDID(userId).set(didData);
  }

  async getDIDRecord(userId: string): Promise<DIDRecord | null> {
    const doc = await this.userDID(userId).get();
    return doc.exists ? doc.data() : null;
  }

  async updateDIDVerificationStatus(
    userId: string, 
    status: 'pending' | 'verified' | 'failed'
  ): Promise<void> {
    await this.userDID(userId).update({ verificationStatus: status });
  }

  // ============================================================================
  // Description & Embedding Management
  // ============================================================================

  async createDescription(description: DescriptionRecord): Promise<void> {
    await this.description(description.id).set(description);
  }

  async getDescription(descriptionId: string): Promise<DescriptionRecord | null> {
    const doc = await this.description(descriptionId).get();
    return doc.exists ? doc.data() : null;
  }

  async findSimilarDescriptions(
    embedding: number[],
    threshold: number = 0.8,
    limit: number = 10
  ): Promise<DescriptionRecord[]> {
    // Note: Firestore doesn't support vector similarity search natively
    // This would need to be implemented with a vector database like Pinecone
    // or using Cloud Functions with custom similarity calculations
    
    // For now, return all descriptions and calculate similarity in memory
    const snapshot = await this.descriptions().limit(limit).get();
    const descriptions = snapshot.docs.map(doc => doc.data());
    
    // Calculate cosine similarity (simplified implementation)
    const similarDescriptions = descriptions
      .map(desc => ({
        ...desc,
        similarity: this.cosineSimilarity(embedding, desc.embedding),
      }))
      .filter(desc => desc.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity);

    return similarDescriptions;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // ============================================================================
  // Clustering & Recommendations
  // ============================================================================

  async createSimilarityCluster(cluster: SimilarityCluster): Promise<void> {
    await this.similarityCluster(cluster.id).set(cluster);
  }

  async getSimilarityCluster(clusterId: string): Promise<SimilarityCluster | null> {
    const doc = await this.similarityCluster(clusterId).get();
    return doc.exists ? doc.data() : null;
  }

  async updateSimilarityCluster(clusterId: string, updates: Partial<SimilarityCluster>): Promise<void> {
    await this.similarityCluster(clusterId).update({
      ...updates,
      lastUpdated: Timestamp.now(),
    });
  }

  async getClustersForUser(userId: string): Promise<SimilarityCluster[]> {
    const snapshot = await this.similarityClusters()
      .where('userIds', 'array-contains', userId)
      .get();
    
    return snapshot.docs.map(doc => doc.data());
  }

  async addRecommendation(userId: string, recommendation: RecommendationItem): Promise<void> {
    await this.userRecommendations(userId).doc(recommendation.id).set(recommendation);
  }

  async getUserRecommendations(userId: string, limit: number = 10): Promise<RecommendationItem[]> {
    const snapshot = await this.userRecommendations(userId)
      .orderBy('confidenceScore', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => doc.data());
  }

  // ============================================================================
  // Blockchain Integration
  // ============================================================================

  async createBlockchainRecord(record: BlockchainRecord): Promise<void> {
    await this.blockchainRecord(record.txHash).set(record);
  }

  async getBlockchainRecord(txHash: string): Promise<BlockchainRecord | null> {
    const doc = await this.blockchainRecord(txHash).get();
    return doc.exists ? doc.data() : null;
  }

  async updateBlockchainVerificationStatus(
    txHash: string, 
    status: 'pending' | 'confirmed' | 'failed'
  ): Promise<void> {
    await this.blockchainRecord(txHash).update({ verificationStatus: status });
  }

  async getBlockchainRecordsByDID(didReference: string): Promise<BlockchainRecord[]> {
    const snapshot = await this.blockchainRecords()
      .where('didReference', '==', didReference)
      .orderBy('entryTimestamp', 'desc')
      .get();
    
    return snapshot.docs.map(doc => doc.data());
  }

  // ============================================================================
  // Analytics & Metrics
  // ============================================================================

  async updateUserAnalytics(userId: string, analytics: Partial<UserAnalytics>): Promise<void> {
    await this.userAnalytics(userId).set({
      ...analytics,
      lastAnalysisUpdate: Timestamp.now(),
    } as UserAnalytics, { merge: true });
  }

  async getUserAnalytics(userId: string): Promise<UserAnalytics | null> {
    const doc = await this.userAnalytics(userId).get();
    return doc.exists ? doc.data() : null;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  async batchWrite(operations: (() => Promise<void>)[]): Promise<void> {
    const batch = this.db.batch();
    
    // Note: Firestore batch operations would need to be restructured
    // This is a simplified implementation
    for (const operation of operations) {
      await operation();
    }
  }

  async runTransaction<T>(updateFunction: (transaction: any) => Promise<T>): Promise<T> {
    return this.db.runTransaction(updateFunction);
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.db.collection('_health').limit(1).get();
      return true;
    } catch (error) {
      console.error('Firebase health check failed:', error);
      return false;
    }
  }
}

export const firebaseService = new FirebaseService();
export default firebaseService; 