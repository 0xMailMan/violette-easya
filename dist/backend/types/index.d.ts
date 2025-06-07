export interface UserPreferences {
    theme: 'light' | 'dark' | 'system';
    fontSize: 'small' | 'medium' | 'large';
    locationEnabled: boolean;
    autoSave: boolean;
    exportFormat: 'json' | 'pdf' | 'txt';
}
export interface LocationData {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    country?: string;
    timestamp: number;
}
export interface DiaryEntry {
    id: string;
    content: string;
    photos: string[];
    location?: LocationData;
    mood?: string;
    tags: string[];
    createdAt: number;
    updatedAt: number;
    isDraft: boolean;
}
export interface User {
    isOnboarded: boolean;
    preferences: UserPreferences;
    didId: string | null;
    firstLaunch: boolean;
}
export interface CameraState {
    isActive: boolean;
    hasPermission: boolean | null;
    capturedPhoto: string | null;
    stream: MediaStream | null;
}
export interface UIState {
    activeModal: string | null;
    isMenuOpen: boolean;
    currentRoute: string;
    isLoading: boolean;
    toastMessage: string | null;
}
export interface AppState {
    user: User;
    diary: {
        currentEntry: DiaryEntry | null;
        draftEntries: DiaryEntry[];
        recentEntries: DiaryEntry[];
        searchQuery: string;
        filterDate?: string;
        filterTags: string[];
    };
    camera: CameraState;
    location: {
        isEnabled: boolean;
        currentLocation: LocationData | null;
        hasPermission: boolean | null;
    };
    ui: UIState;
}
export interface DiaryEntryFormData {
    content: string;
    mood?: string;
    tags: string[];
    photos: string[];
    location?: LocationData;
}
//# sourceMappingURL=index.d.ts.map