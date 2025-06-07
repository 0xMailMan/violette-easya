import { DiscoveryEngine, SimilarUser, Recommendation, ClusterUpdateResult, UserProfile, LocationData, TimeRange } from '../../types/backend';
declare class DiscoveryEngineService implements DiscoveryEngine {
    private readonly SIMILARITY_THRESHOLD;
    private readonly LOCATION_RADIUS_KM;
    private readonly MIN_CLUSTER_SIZE;
    private readonly MAX_RECOMMENDATIONS;
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
    private performKMeansClustering;
    private initializeRandomCentroids;
    private assignUsersToCentroids;
    private createClustersFromAssignments;
    private calculateUserSimilarity;
    private cosineSimilarity;
    private calculateEuclideanDistance;
    private getUserDescriptions;
    private extractUserPreferences;
    private getAllUserDescriptions;
    private groupDescriptionsByUser;
    private findCommonElements;
    private isActivityTheme;
    private formatActivityTitle;
    private formatThemeTitle;
    private findCandidateClusters;
    private extractThemesFromEmbeddings;
    private diversifyRecommendations;
    private getUserVisitedLocations;
    private createUserEmbeddingsMatrix;
    private getAllClusters;
    private updateCentroids;
    private calculateCentroidShift;
    private extractCommonThemesForCluster;
    private calculateLocationCluster;
    private matchesLocationPreferences;
    private generateLocationDescription;
    private calculateEstimatedInterest;
    private generateActivityDescription;
    private calculateActivityInterest;
    private analyzeCommonThemes;
    private generateThemeDescription;
    private calculateThemeInterest;
    private calculateThemeSimilarity;
    private calculateTemporalSimilarity;
    private performSimpleClustering;
}
export declare const discoveryEngineService: DiscoveryEngineService;
export default discoveryEngineService;
//# sourceMappingURL=discovery-engine.d.ts.map