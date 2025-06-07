"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.discoveryEngineService = void 0;
const firestore_1 = require("firebase-admin/firestore");
const uuid_1 = require("uuid");
const firebase_1 = __importDefault(require("../database/firebase"));
class DiscoveryEngineService {
    constructor() {
        this.SIMILARITY_THRESHOLD = 0.7;
        this.LOCATION_RADIUS_KM = 50;
        this.MIN_CLUSTER_SIZE = 3;
        this.MAX_RECOMMENDATIONS = 20;
    }
    // ============================================================================
    // Main Discovery Methods
    // ============================================================================
    async findSimilarUsers(params) {
        try {
            const clusters = await firebase_1.default.similarityClusters().limit(10).get();
            const similarUsers = [];
            for (const clusterDoc of clusters.docs) {
                const cluster = clusterDoc.data();
                for (const userId of cluster.userIds) {
                    const userDescriptions = await this.getUserDescriptions(userId, params.timeWindow);
                    if (userDescriptions.length === 0)
                        continue;
                    const similarity = this.calculateUserSimilarity(params.userEmbeddings, userDescriptions.map(d => d.embedding));
                    if (similarity >= this.SIMILARITY_THRESHOLD) {
                        const userThemes = userDescriptions.flatMap(d => d.themes);
                        similarUsers.push({
                            anonymizedId: userId,
                            similarityScore: similarity,
                            commonThemes: userThemes,
                            locationOverlap: 0.5,
                            timePatternSimilarity: 0.5,
                        });
                    }
                }
            }
            return similarUsers
                .sort((a, b) => b.similarityScore - a.similarityScore)
                .slice(0, params.maxResults);
        }
        catch (error) {
            console.error('Failed to find similar users:', error);
            return [];
        }
    }
    async generateRecommendations(params) {
        try {
            const recommendations = [];
            for (const similarUser of params.similarUsers) {
                const userDescriptions = await this.getUserDescriptions(similarUser.anonymizedId);
                for (const description of userDescriptions) {
                    if (description.location) {
                        const recommendation = {
                            id: (0, uuid_1.v4)(),
                            type: 'location',
                            title: description.location.placeName || 'Interesting Place',
                            description: description.content,
                            location: {
                                latitude: description.location.latitude,
                                longitude: description.location.longitude,
                                placeName: description.location.placeName || 'Unknown Place',
                            },
                            confidenceScore: similarUser.similarityScore * 0.8,
                            basedOnUsers: [similarUser.anonymizedId],
                            themes: description.themes,
                            estimatedInterest: 0.7,
                        };
                        recommendations.push(recommendation);
                    }
                }
            }
            return recommendations.slice(0, this.MAX_RECOMMENDATIONS);
        }
        catch (error) {
            console.error('Failed to generate recommendations:', error);
            return [];
        }
    }
    async updateUserClusters() {
        const startTime = Date.now();
        try {
            const allDescriptions = await this.getAllUserDescriptions();
            const totalUsers = new Set(allDescriptions.map(d => d.userId)).size;
            // Simple clustering implementation
            const clusters = this.performSimpleClustering(allDescriptions);
            let clustersCreated = 0;
            for (const cluster of clusters) {
                await firebase_1.default.createSimilarityCluster(cluster);
                clustersCreated++;
            }
            return {
                clustersCreated,
                clustersUpdated: 0,
                clustersRemoved: 0,
                totalUsers,
                processingTime: Date.now() - startTime,
            };
        }
        catch (error) {
            console.error('Failed to update user clusters:', error);
            return {
                clustersCreated: 0,
                clustersUpdated: 0,
                clustersRemoved: 0,
                totalUsers: 0,
                processingTime: Date.now() - startTime,
            };
        }
    }
    async calculateDiscoveryScore(userA, userB) {
        try {
            const [descriptionsA, descriptionsB] = await Promise.all([
                this.getUserDescriptions(userA.id),
                this.getUserDescriptions(userB.id),
            ]);
            if (descriptionsA.length === 0 || descriptionsB.length === 0) {
                return 0;
            }
            const embeddingsA = descriptionsA.map(d => d.embedding);
            const embeddingsB = descriptionsB.map(d => d.embedding);
            return this.calculateUserSimilarity(embeddingsA, embeddingsB);
        }
        catch (error) {
            console.error('Failed to calculate discovery score:', error);
            return 0;
        }
    }
    // ============================================================================
    // Clustering Algorithms
    // ============================================================================
    async performKMeansClustering(userEmbeddings) {
        const k = Math.max(3, Math.floor(Math.sqrt(userEmbeddings.length / 2)));
        const maxIterations = 50;
        const convergenceThreshold = 0.01;
        // Initialize centroids randomly
        let centroids = this.initializeRandomCentroids(userEmbeddings, k);
        let clusters = [];
        for (let iteration = 0; iteration < maxIterations; iteration++) {
            // Assign users to nearest centroid
            const assignments = this.assignUsersToCentroids(userEmbeddings, centroids);
            // Create clusters
            const newClusters = await this.createClustersFromAssignments(assignments, centroids);
            // Update centroids
            const newCentroids = this.updateCentroids(assignments, userEmbeddings);
            // Check for convergence
            const centroidShift = this.calculateCentroidShift(centroids, newCentroids);
            centroids = newCentroids;
            clusters = newClusters;
            if (centroidShift < convergenceThreshold) {
                console.log(`K-means converged after ${iteration + 1} iterations`);
                break;
            }
        }
        return clusters.filter(cluster => cluster.userIds.length >= this.MIN_CLUSTER_SIZE);
    }
    initializeRandomCentroids(userEmbeddings, k) {
        const centroids = [];
        const embeddingDim = userEmbeddings[0].embedding.length;
        for (let i = 0; i < k; i++) {
            const randomIndex = Math.floor(Math.random() * userEmbeddings.length);
            centroids.push([...userEmbeddings[randomIndex].embedding]);
        }
        return centroids;
    }
    assignUsersToCentroids(userEmbeddings, centroids) {
        const assignments = centroids.map(() => []);
        userEmbeddings.forEach((user, userIndex) => {
            let nearestCentroid = 0;
            let minDistance = this.calculateEuclideanDistance(user.embedding, centroids[0]);
            for (let i = 1; i < centroids.length; i++) {
                const distance = this.calculateEuclideanDistance(user.embedding, centroids[i]);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestCentroid = i;
                }
            }
            assignments[nearestCentroid].push(userIndex);
        });
        return assignments;
    }
    async createClustersFromAssignments(assignments, centroids) {
        const clusters = [];
        for (let i = 0; i < assignments.length; i++) {
            if (assignments[i].length === 0)
                continue;
            const userIds = assignments[i].map(userIndex => `user_${userIndex}`); // Simplified
            const commonThemes = await this.extractCommonThemesForCluster(userIds);
            const locationCluster = await this.calculateLocationCluster(userIds);
            clusters.push({
                id: (0, uuid_1.v4)(),
                centroid: centroids[i],
                userIds,
                locationCluster,
                commonThemes,
                lastUpdated: firestore_1.Timestamp.now(),
            });
        }
        return clusters;
    }
    // ============================================================================
    // Similarity Calculations
    // ============================================================================
    calculateUserSimilarity(embeddingsA, embeddingsB) {
        if (embeddingsA.length === 0 || embeddingsB.length === 0)
            return 0;
        let totalSimilarity = 0;
        let comparisons = 0;
        for (const embA of embeddingsA) {
            for (const embB of embeddingsB) {
                totalSimilarity += this.cosineSimilarity(embA, embB);
                comparisons++;
            }
        }
        return comparisons > 0 ? totalSimilarity / comparisons : 0;
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
    // Utility Methods
    // ============================================================================
    calculateEuclideanDistance(a, b) {
        let sum = 0;
        for (let i = 0; i < a.length; i++) {
            sum += Math.pow(a[i] - b[i], 2);
        }
        return Math.sqrt(sum);
    }
    // ============================================================================
    // Data Access Helpers
    // ============================================================================
    async getUserDescriptions(userId, timeWindow) {
        try {
            let query = firebase_1.default.descriptions().where('userId', '==', userId);
            if (timeWindow) {
                query = query
                    .where('timestamp', '>=', timeWindow.start)
                    .where('timestamp', '<=', timeWindow.end);
            }
            const snapshot = await query.get();
            return snapshot.docs.map(doc => doc.data());
        }
        catch (error) {
            console.error('Failed to get user descriptions:', error);
            return [];
        }
    }
    extractUserPreferences(userSettings) {
        return {
            preferredThemes: userSettings?.preferences?.preferredThemes || [],
            avoidedThemes: userSettings?.preferences?.avoidedThemes || [],
            locationRadius: userSettings?.preferences?.locationRadius || 50,
            noveltyPreference: userSettings?.preferences?.noveltyPreference || 0.7,
            socialLevel: userSettings?.preferences?.socialLevel || 0.5,
        };
    }
    async getAllUserDescriptions() {
        try {
            const snapshot = await firebase_1.default.descriptions().get();
            return snapshot.docs.map(doc => doc.data());
        }
        catch (error) {
            console.error('Failed to get all descriptions:', error);
            return [];
        }
    }
    groupDescriptionsByUser(descriptions) {
        const grouped = new Map();
        for (const desc of descriptions) {
            if (!grouped.has(desc.userId)) {
                grouped.set(desc.userId, []);
            }
            grouped.get(desc.userId).push(desc);
        }
        return grouped;
    }
    findCommonElements(arrayA, arrayB) {
        return arrayA.filter(item => arrayB.includes(item));
    }
    isActivityTheme(theme) {
        const activityKeywords = ['walking', 'running', 'eating', 'shopping', 'reading', 'working', 'studying'];
        return activityKeywords.some(keyword => theme.toLowerCase().includes(keyword));
    }
    formatActivityTitle(activity) {
        return activity.charAt(0).toUpperCase() + activity.slice(1).replace(/_/g, ' ');
    }
    formatThemeTitle(theme) {
        return theme.charAt(0).toUpperCase() + theme.slice(1).replace(/_/g, ' ');
    }
    // Placeholder implementations for methods referenced but not fully implemented
    async findCandidateClusters(embeddings, locations) {
        const snapshot = await firebase_1.default.similarityClusters().limit(10).get();
        return snapshot.docs.map(doc => doc.data());
    }
    async extractThemesFromEmbeddings(embeddings) {
        // This would use AI to extract themes from embeddings
        return ['general', 'experience'];
    }
    async diversifyRecommendations(recommendations, preferences) {
        // Simple diversification - ensure variety in types and themes
        const diversified = [];
        const seenTypes = new Set();
        const seenThemes = new Set();
        // Sort by confidence score first
        recommendations.sort((a, b) => b.confidenceScore - a.confidenceScore);
        for (const rec of recommendations) {
            const hasNewType = !seenTypes.has(rec.type);
            const hasNewTheme = rec.themes.some(theme => !seenThemes.has(theme));
            if (hasNewType || hasNewTheme || diversified.length < 5) {
                diversified.push(rec);
                seenTypes.add(rec.type);
                rec.themes.forEach(theme => seenThemes.add(theme));
            }
        }
        return diversified;
    }
    // Additional placeholder methods
    async getUserVisitedLocations(userId) { return []; }
    async createUserEmbeddingsMatrix(userDescriptions) { return []; }
    async getAllClusters() { return []; }
    updateCentroids(assignments, userEmbeddings) { return []; }
    calculateCentroidShift(old, newCentroids) { return 0; }
    async extractCommonThemesForCluster(userIds) { return []; }
    async calculateLocationCluster(userIds) { return { centerLat: 0, centerLng: 0, radius: 0 }; }
    matchesLocationPreferences(description, preferences) { return true; }
    generateLocationDescription(description) { return description.content; }
    calculateEstimatedInterest(description, preferences) { return 0.7; }
    async generateActivityDescription(activity) { return `Try ${activity} activities`; }
    calculateActivityInterest(activity, preferences) { return 0.7; }
    async analyzeCommonThemes(similarUsers) { return { emerging: [] }; }
    async generateThemeDescription(theme) { return `Explore ${theme} experiences`; }
    calculateThemeInterest(theme, preferences) { return 0.7; }
    calculateThemeSimilarity(themesA, themesB) { return 0.5; }
    calculateTemporalSimilarity(timestampsA, timestampsB) { return 0.5; }
    performSimpleClustering(descriptions) {
        const clusters = [];
        const userGroups = new Map();
        // Group by user
        for (const desc of descriptions) {
            if (!userGroups.has(desc.userId)) {
                userGroups.set(desc.userId, []);
            }
            userGroups.get(desc.userId).push(desc);
        }
        // Create simple clusters based on themes
        const themeGroups = new Map();
        for (const [userId, userDescs] of userGroups) {
            const userThemes = userDescs.flatMap(d => d.themes);
            const primaryTheme = userThemes[0] || 'general';
            if (!themeGroups.has(primaryTheme)) {
                themeGroups.set(primaryTheme, []);
            }
            themeGroups.get(primaryTheme).push(userId);
        }
        // Convert to SimilarityCluster format
        for (const [theme, userIds] of themeGroups) {
            if (userIds.length >= 2) {
                clusters.push({
                    id: (0, uuid_1.v4)(),
                    centroid: new Array(1536).fill(0), // Placeholder
                    userIds,
                    locationCluster: {
                        centerLat: 0,
                        centerLng: 0,
                        radius: 1000,
                    },
                    commonThemes: [theme],
                    lastUpdated: firestore_1.Timestamp.now(),
                });
            }
        }
        return clusters;
    }
}
exports.discoveryEngineService = new DiscoveryEngineService();
exports.default = exports.discoveryEngineService;
//# sourceMappingURL=discovery-engine.js.map