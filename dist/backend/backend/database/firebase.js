"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.firebaseService = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const config_1 = __importDefault(require("../config"));
class FirebaseService {
    constructor() {
        this.initialized = false;
        this.initializeFirebase();
    }
    initializeFirebase() {
        if (this.initialized)
            return;
        try {
            // Initialize Firebase Admin SDK
            const serviceAccount = JSON.parse(config_1.default.firebase.serviceAccountKey);
            firebase_admin_1.default.initializeApp({
                credential: firebase_admin_1.default.credential.cert(serviceAccount),
                projectId: config_1.default.firebase.projectId,
            });
            this.db = (0, firestore_1.getFirestore)();
            this.initialized = true;
            console.log('Firebase initialized successfully');
        }
        catch (error) {
            console.error('Failed to initialize Firebase:', error);
            throw error;
        }
    }
    // ============================================================================
    // Collection References
    // ============================================================================
    // Users collection and subcollections
    users() {
        return this.db.collection('users');
    }
    userProfile(userId) {
        return this.users().doc(userId);
    }
    userSettings(userId) {
        return this.users().doc(userId).collection('settings').doc('user_settings');
    }
    userDID(userId) {
        return this.users().doc(userId).collection('did').doc('did_record');
    }
    userAnalytics(userId) {
        return this.users().doc(userId).collection('analytics').doc('user_analytics');
    }
    // Descriptions collection
    descriptions() {
        return this.db.collection('descriptions');
    }
    description(descriptionId) {
        return this.descriptions().doc(descriptionId);
    }
    // Similarity clusters collection
    similarityClusters() {
        return this.db.collection('similarity_clusters');
    }
    similarityCluster(clusterId) {
        return this.similarityClusters().doc(clusterId);
    }
    // Recommendations collection
    userRecommendations(userId) {
        return this.db.collection('recommendations').doc(userId).collection('suggestions');
    }
    // Blockchain records collection
    blockchainRecords() {
        return this.db.collection('blockchain_records');
    }
    blockchainRecord(txHash) {
        return this.blockchainRecords().doc(txHash);
    }
    // Entries collection
    userEntries(userId) {
        return this.db.collection('entries').doc(userId).collection('items');
    }
    userEntry(userId, entryId) {
        return this.userEntries(userId).doc(entryId);
    }
    // ============================================================================
    // User Management
    // ============================================================================
    async createUser(userId, userData) {
        const userProfile = {
            id: userId,
            createdAt: firestore_1.Timestamp.now(),
            lastActive: firestore_1.Timestamp.now(),
            isOnboarded: false,
            privacyLevel: 'balanced',
            locationSharingEnabled: true,
            ...userData,
        };
        await this.userProfile(userId).set(userProfile);
    }
    async getUserProfile(userId) {
        const doc = await this.userProfile(userId).get();
        return doc.exists ? doc.data() : null;
    }
    async updateUserProfile(userId, updates) {
        await this.userProfile(userId).update({
            ...updates,
            lastActive: firestore_1.Timestamp.now(),
        });
    }
    async getUserSettings(userId) {
        const doc = await this.userSettings(userId).get();
        return doc.exists ? doc.data() : null;
    }
    async updateUserSettings(userId, settings) {
        await this.userSettings(userId).set(settings, { merge: true });
    }
    // ============================================================================
    // DID Management
    // ============================================================================
    async createDIDRecord(userId, didData) {
        await this.userDID(userId).set(didData);
    }
    async getDIDRecord(userId) {
        const doc = await this.userDID(userId).get();
        return doc.exists ? doc.data() : null;
    }
    async updateDIDVerificationStatus(userId, status) {
        await this.userDID(userId).update({ verificationStatus: status });
    }
    // ============================================================================
    // Description & Embedding Management
    // ============================================================================
    async createDescription(description) {
        await this.description(description.id).set(description);
    }
    async getDescription(descriptionId) {
        const doc = await this.description(descriptionId).get();
        return doc.exists ? doc.data() : null;
    }
    async findSimilarDescriptions(embedding, threshold = 0.8, limit = 10) {
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
    cosineSimilarity(a, b) {
        if (a.length !== b.length)
            return 0;
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
    async createSimilarityCluster(cluster) {
        await this.similarityCluster(cluster.id).set(cluster);
    }
    async getSimilarityCluster(clusterId) {
        const doc = await this.similarityCluster(clusterId).get();
        return doc.exists ? doc.data() : null;
    }
    async updateSimilarityCluster(clusterId, updates) {
        await this.similarityCluster(clusterId).update({
            ...updates,
            lastUpdated: firestore_1.Timestamp.now(),
        });
    }
    async getClustersForUser(userId) {
        const snapshot = await this.similarityClusters()
            .where('userIds', 'array-contains', userId)
            .get();
        return snapshot.docs.map(doc => doc.data());
    }
    async addRecommendation(userId, recommendation) {
        await this.userRecommendations(userId).doc(recommendation.id).set(recommendation);
    }
    async getUserRecommendations(userId, limit = 10) {
        const snapshot = await this.userRecommendations(userId)
            .orderBy('confidenceScore', 'desc')
            .limit(limit)
            .get();
        return snapshot.docs.map(doc => doc.data());
    }
    // ============================================================================
    // Blockchain Integration
    // ============================================================================
    async createBlockchainRecord(record) {
        await this.blockchainRecord(record.txHash).set(record);
    }
    async getBlockchainRecord(txHash) {
        const doc = await this.blockchainRecord(txHash).get();
        return doc.exists ? doc.data() : null;
    }
    async updateBlockchainVerificationStatus(txHash, status) {
        await this.blockchainRecord(txHash).update({ verificationStatus: status });
    }
    async getBlockchainRecordsByDID(didReference) {
        const snapshot = await this.blockchainRecords()
            .where('didReference', '==', didReference)
            .orderBy('entryTimestamp', 'desc')
            .get();
        return snapshot.docs.map(doc => doc.data());
    }
    // ============================================================================
    // Analytics & Metrics
    // ============================================================================
    async updateUserAnalytics(userId, analytics) {
        await this.userAnalytics(userId).set({
            ...analytics,
            lastAnalysisUpdate: firestore_1.Timestamp.now(),
        }, { merge: true });
    }
    async getUserAnalytics(userId) {
        const doc = await this.userAnalytics(userId).get();
        return doc.exists ? doc.data() : null;
    }
    // ============================================================================
    // Utility Methods
    // ============================================================================
    async batchWrite(operations) {
        const batch = this.db.batch();
        // Note: Firestore batch operations would need to be restructured
        // This is a simplified implementation
        for (const operation of operations) {
            await operation();
        }
    }
    async runTransaction(updateFunction) {
        return this.db.runTransaction(updateFunction);
    }
    // ============================================================================
    // Entry Management
    // ============================================================================
    async createEntry(userId, entryData) {
        const docRef = this.userEntries(userId).doc();
        await docRef.set({
            ...entryData,
            createdAt: firestore_1.Timestamp.now(),
            updatedAt: firestore_1.Timestamp.now(),
        });
        return docRef.id;
    }
    async getEntry(userId, entryId) {
        const doc = await this.userEntry(userId, entryId).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }
    async getUserEntries(userId) {
        const snapshot = await this.userEntries(userId)
            .orderBy('createdAt', 'desc')
            .get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
    }
    async updateEntry(userId, entryId, updateData) {
        await this.userEntry(userId, entryId).update({
            ...updateData,
            updatedAt: firestore_1.Timestamp.now(),
        });
    }
    async deleteEntry(userId, entryId) {
        await this.userEntry(userId, entryId).delete();
    }
    // Health check
    async healthCheck() {
        try {
            await this.db.collection('_health').limit(1).get();
            return true;
        }
        catch (error) {
            console.error('Firebase health check failed:', error);
            return false;
        }
    }
}
exports.firebaseService = new FirebaseService();
exports.default = exports.firebaseService;
//# sourceMappingURL=firebase.js.map