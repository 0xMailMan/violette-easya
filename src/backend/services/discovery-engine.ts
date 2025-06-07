import { Timestamp } from 'firebase-admin/firestore';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import {
  DiscoveryEngine,
  SimilarUser,
  Recommendation,
  ClusterUpdateResult,
  UserProfile,
  LocationData,
  TimeRange,
  SimilarityCluster,
  GeoCluster,
  RecommendationItem,
  UserPreferences,
  DescriptionRecord,
  DiscoveryScore
} from '../../types/backend';
import firebaseService from '../database/firebase';
import aiProcessingService from './ai-processing';

class DiscoveryEngineService implements DiscoveryEngine {
  private readonly SIMILARITY_THRESHOLD = 0.7;
  private readonly LOCATION_RADIUS_KM = 50;
  private readonly MIN_CLUSTER_SIZE = 3;
  private readonly MAX_RECOMMENDATIONS = 20;

  // ============================================================================
  // Main Discovery Methods
  // ============================================================================

  async findSimilarUsers(params: {
    userEmbeddings: number[][];
    locationHistory: LocationData[];
    timeWindow: TimeRange;
    maxResults: number;
  }): Promise<SimilarUser[]> {
    try {
      const clusters = await firebaseService.similarityClusters().limit(10).get();
      const similarUsers: SimilarUser[] = [];

      for (const clusterDoc of clusters.docs) {
        const cluster = clusterDoc.data();
        
        for (const userId of cluster.userIds) {
          const userDescriptions = await this.getUserDescriptions(userId, params.timeWindow);
          
          if (userDescriptions.length === 0) continue;

          const similarity = this.calculateUserSimilarity(
            params.userEmbeddings,
            userDescriptions.map(d => d.embedding)
          );

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
    } catch (error) {
      console.error('Failed to find similar users:', error);
      return [];
    }
  }

  async generateRecommendations(params: {
    userId: string;
    similarUsers: SimilarUser[];
    excludeVisited: boolean;
  }): Promise<Recommendation[]> {
    try {
      const recommendations: Recommendation[] = [];

      for (const similarUser of params.similarUsers) {
        const userDescriptions = await this.getUserDescriptions(similarUser.anonymizedId);
        
        for (const description of userDescriptions) {
          if (description.location) {
            const recommendation: Recommendation = {
              id: uuidv4(),
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
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      return [];
    }
  }

  async updateUserClusters(): Promise<ClusterUpdateResult> {
    const startTime = Date.now();
    
    try {
      const allDescriptions = await this.getAllUserDescriptions();
      const totalUsers = new Set(allDescriptions.map(d => d.userId)).size;

      // Simple clustering implementation
      const clusters = this.performSimpleClustering(allDescriptions);

      let clustersCreated = 0;
      for (const cluster of clusters) {
        await firebaseService.createSimilarityCluster(cluster);
        clustersCreated++;
      }

      return {
        clustersCreated,
        clustersUpdated: 0,
        clustersRemoved: 0,
        totalUsers,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
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

  async calculateDiscoveryScore(userA: UserProfile, userB: UserProfile): Promise<number> {
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
    } catch (error) {
      console.error('Failed to calculate discovery score:', error);
      return 0;
    }
  }

  // ============================================================================
  // Clustering Algorithms
  // ============================================================================

  private async performKMeansClustering(
    userEmbeddings: { userId: string; embedding: number[] }[]
  ): Promise<SimilarityCluster[]> {
    const k = Math.max(3, Math.floor(Math.sqrt(userEmbeddings.length / 2)));
    const maxIterations = 50;
    const convergenceThreshold = 0.01;

    // Initialize centroids randomly
    let centroids = this.initializeRandomCentroids(userEmbeddings, k);
    let clusters: SimilarityCluster[] = [];

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

  private initializeRandomCentroids(
    userEmbeddings: { userId: string; embedding: number[] }[],
    k: number
  ): number[][] {
    const centroids: number[][] = [];
    const embeddingDim = userEmbeddings[0].embedding.length;
    
    for (let i = 0; i < k; i++) {
      const randomIndex = Math.floor(Math.random() * userEmbeddings.length);
      centroids.push([...userEmbeddings[randomIndex].embedding]);
    }
    
    return centroids;
  }

  private assignUsersToCentroids(
    userEmbeddings: { userId: string; embedding: number[] }[],
    centroids: number[][]
  ): number[][] {
    const assignments: number[][] = centroids.map(() => []);
    
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

  private async createClustersFromAssignments(
    assignments: number[][],
    centroids: number[][]
  ): Promise<SimilarityCluster[]> {
    const clusters: SimilarityCluster[] = [];
    
    for (let i = 0; i < assignments.length; i++) {
      if (assignments[i].length === 0) continue;
      
      const userIds = assignments[i].map(userIndex => `user_${userIndex}`); // Simplified
      const commonThemes = await this.extractCommonThemesForCluster(userIds);
      const locationCluster = await this.calculateLocationCluster(userIds);
      
      clusters.push({
        id: uuidv4(),
        centroid: centroids[i],
        userIds,
        locationCluster,
        commonThemes,
        lastUpdated: Timestamp.now(),
      });
    }
    
    return clusters;
  }

  // ============================================================================
  // Similarity Calculations
  // ============================================================================

  private calculateUserSimilarity(embeddingsA: number[][], embeddingsB: number[][]): number {
    if (embeddingsA.length === 0 || embeddingsB.length === 0) return 0;
    
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
  // Utility Methods
  // ============================================================================

  private calculateEuclideanDistance(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += Math.pow(a[i] - b[i], 2);
    }
    return Math.sqrt(sum);
  }

  // ============================================================================
  // Data Access Helpers
  // ============================================================================

  private async getUserDescriptions(userId: string, timeWindow?: TimeRange): Promise<DescriptionRecord[]> {
    try {
      let query = firebaseService.descriptions().where('userId', '==', userId);
      
      if (timeWindow) {
        query = query
          .where('timestamp', '>=', timeWindow.start)
          .where('timestamp', '<=', timeWindow.end);
      }
      
      const snapshot = await query.get();
      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Failed to get user descriptions:', error);
      return [];
    }
  }

  private extractUserPreferences(userSettings: any): UserPreferences {
    return {
      preferredThemes: userSettings?.preferences?.preferredThemes || [],
      avoidedThemes: userSettings?.preferences?.avoidedThemes || [],
      locationRadius: userSettings?.preferences?.locationRadius || 50,
      noveltyPreference: userSettings?.preferences?.noveltyPreference || 0.7,
      socialLevel: userSettings?.preferences?.socialLevel || 0.5,
    };
  }

  private async getAllUserDescriptions(): Promise<DescriptionRecord[]> {
    try {
      const snapshot = await firebaseService.descriptions().get();
      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Failed to get all descriptions:', error);
      return [];
    }
  }

  private groupDescriptionsByUser(descriptions: DescriptionRecord[]): Map<string, DescriptionRecord[]> {
    const grouped = new Map<string, DescriptionRecord[]>();
    
    for (const desc of descriptions) {
      if (!grouped.has(desc.userId)) {
        grouped.set(desc.userId, []);
      }
      grouped.get(desc.userId)!.push(desc);
    }
    
    return grouped;
  }

  private findCommonElements<T>(arrayA: T[], arrayB: T[]): T[] {
    return arrayA.filter(item => arrayB.includes(item));
  }

  private isActivityTheme(theme: string): boolean {
    const activityKeywords = ['walking', 'running', 'eating', 'shopping', 'reading', 'working', 'studying'];
    return activityKeywords.some(keyword => theme.toLowerCase().includes(keyword));
  }

  private formatActivityTitle(activity: string): string {
    return activity.charAt(0).toUpperCase() + activity.slice(1).replace(/_/g, ' ');
  }

  private formatThemeTitle(theme: string): string {
    return theme.charAt(0).toUpperCase() + theme.slice(1).replace(/_/g, ' ');
  }

  // Placeholder implementations for methods referenced but not fully implemented
  private async findCandidateClusters(embeddings: number[][], locations: LocationData[]): Promise<SimilarityCluster[]> {
    const snapshot = await firebaseService.similarityClusters().limit(10).get();
    return snapshot.docs.map(doc => doc.data());
  }

  private async extractThemesFromEmbeddings(embeddings: number[][]): Promise<string[]> {
    // This would use AI to extract themes from embeddings
    return ['general', 'experience'];
  }

  private async diversifyRecommendations(recommendations: Recommendation[], preferences: UserPreferences): Promise<Recommendation[]> {
    // Simple diversification - ensure variety in types and themes
    const diversified: Recommendation[] = [];
    const seenTypes = new Set<string>();
    const seenThemes = new Set<string>();
    
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
  private async getUserVisitedLocations(userId: string): Promise<LocationData[]> { return []; }
  private async createUserEmbeddingsMatrix(userDescriptions: Map<string, DescriptionRecord[]>): Promise<{ userId: string; embedding: number[] }[]> { return []; }
  private async getAllClusters(): Promise<SimilarityCluster[]> { return []; }
  private updateCentroids(assignments: number[][], userEmbeddings: { userId: string; embedding: number[] }[]): number[][] { return []; }
  private calculateCentroidShift(old: number[][], newCentroids: number[][]): number { return 0; }
  private async extractCommonThemesForCluster(userIds: string[]): Promise<string[]> { return []; }
  private async calculateLocationCluster(userIds: string[]): Promise<GeoCluster> { return { centerLat: 0, centerLng: 0, radius: 0 }; }
  private matchesLocationPreferences(description: DescriptionRecord, preferences: UserPreferences): boolean { return true; }
  private generateLocationDescription(description: DescriptionRecord): string { return description.content; }
  private calculateEstimatedInterest(description: DescriptionRecord, preferences: UserPreferences): number { return 0.7; }
  private async generateActivityDescription(activity: string): Promise<string> { return `Try ${activity} activities`; }
  private calculateActivityInterest(activity: string, preferences: UserPreferences): number { return 0.7; }
  private async analyzeCommonThemes(similarUsers: SimilarUser[]): Promise<{ emerging: string[] }> { return { emerging: [] }; }
  private async generateThemeDescription(theme: string): Promise<string> { return `Explore ${theme} experiences`; }
  private calculateThemeInterest(theme: string, preferences: UserPreferences): number { return 0.7; }
  private calculateThemeSimilarity(themesA: string[], themesB: string[]): number { return 0.5; }
  private calculateTemporalSimilarity(timestampsA: Timestamp[], timestampsB: Timestamp[]): number { return 0.5; }

  private performSimpleClustering(descriptions: DescriptionRecord[]): SimilarityCluster[] {
    const clusters: SimilarityCluster[] = [];
    const userGroups = new Map<string, DescriptionRecord[]>();

    // Group by user
    for (const desc of descriptions) {
      if (!userGroups.has(desc.userId)) {
        userGroups.set(desc.userId, []);
      }
      userGroups.get(desc.userId)!.push(desc);
    }

    // Create simple clusters based on themes
    const themeGroups = new Map<string, string[]>();
    
    for (const [userId, userDescs] of userGroups) {
      const userThemes = userDescs.flatMap(d => d.themes);
      const primaryTheme = userThemes[0] || 'general';
      
      if (!themeGroups.has(primaryTheme)) {
        themeGroups.set(primaryTheme, []);
      }
      themeGroups.get(primaryTheme)!.push(userId);
    }

    // Convert to SimilarityCluster format
    for (const [theme, userIds] of themeGroups) {
      if (userIds.length >= 2) {
        clusters.push({
          id: uuidv4(),
          centroid: new Array(1536).fill(0), // Placeholder
          userIds,
          locationCluster: {
            centerLat: 0,
            centerLng: 0,
            radius: 1000,
          },
          commonThemes: [theme],
          lastUpdated: Timestamp.now(),
        });
      }
    }

    return clusters;
  }
}

export const discoveryEngineService = new DiscoveryEngineService();
export default discoveryEngineService; 