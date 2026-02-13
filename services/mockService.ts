import { Location, LocationType, User, Filters, FriendshipStatus, Route, Review, ActivityFeedItem, LocationEvent, GalleryItem, Report, FriendUser, Invite, MapBounds } from '../types';
import { BADGES, LEVEL_THRESHOLDS, DEFAULT_LOCATION_IMAGES } from '../constants';
import client, { databases, storage, account, APPWRITE_DATABASE_ID, APPWRITE_BUCKET_ID, APPWRITE_PROJECT_ID } from './appwriteClient';
export { client, databases, storage, account, APPWRITE_DATABASE_ID };
import {
    Account,
    ID,
    Query,
    Databases,
    Storage,
    Permission,
    Role
} from 'appwrite';

// --- FILE UPLOAD ---
// Caching for performance
let locationCache: {
    lat: number;
    lng: number;
    timestamp: number;
    data: Location[];
} | null = null;
const CACHE_STALE_MS = 60000; // 1 minute
const CACHE_DISTANCE_THRESHOLD = 0.05; // ~50m

export const uploadFile = async (file: File): Promise<string> => {
    try {
        const result = await storage.createFile(
            APPWRITE_BUCKET_ID,
            ID.unique(),
            file
        );
        // Get view URL
        const fileUrl = storage.getFileView(APPWRITE_BUCKET_ID, result.$id);
        return fileUrl.toString();
    } catch (e: any) {
        console.error("Upload failed:", e);
        throw e;
    }
};

// MOCK ROUTES
const MOCK_ROUTES: Route[] = [
    {
        id: 'r1',
        creatorId: 'u1',
        creatorName: 'Ana Clara',
        creatorAvatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d',
        name: 'Esquenta e Balada',
        description: 'Começa leve no barzinho, termina destruindo na pista.',
        likes: 124,
        completions: 45,
        stops: [
            { locationId: '1', locationName: 'Bar do Zé', order: 1 },
            { locationId: '2', locationName: 'Neon Club', order: 2 }
        ]
    },
    {
        id: 'r2',
        creatorId: 'u2',
        creatorName: 'João Silva',
        creatorAvatar: 'https://i.pravatar.cc/150?u=a04258a2462d826712d',
        name: 'Rota Gastronômica',
        description: 'Só pra quem aguenta comer muito e beber pouco.',
        likes: 89,
        completions: 12,
        stops: [
            { locationId: '3', locationName: 'Food Truck Park', order: 1 },
            { locationId: '4', locationName: 'Sorveteria 10/10', order: 2 }
        ]
    }
];

export const getNearbyRoutes = async (): Promise<Route[]> => {
    return new Promise((resolve) => {
        setTimeout(() => resolve(MOCK_ROUTES), 800);
    });
};

// --- GEOCODING ---
export const geocodeAddress = async (address: string, bias?: { lat: number, lng: number }): Promise<{ lat: number, lng: number } | null> => {
    if (!address || address.length < 5) return null;
    try {
        console.log(`[Geocoding] Searching for: ${address} (Bias: ${bias ? `${bias.lat}, ${bias.lng}` : 'None'})`);

        // Define a race between the fetch and a 10s timeout
        // Switch to Nominatim for better address parsing accuracy
        let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1&countrycodes=br&email=contact@dirole.app`;
        if (bias) {
            url += `&lat=${bias.lat}&lon=${bias.lng}`;
        }

        const fetchPromise = fetch(url);
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Geocoding Timeout")), 10000)
        );

        const response = await Promise.race([fetchPromise, timeoutPromise]);
        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
            const result = data[0];
            const lat = parseFloat(result.lat);
            const lng = parseFloat(result.lon);
            console.log(`[Geocoding] Found (Nominatim): ${lat}, ${lng}`);
            return { lat, lng };
        }
        return null;
    } catch (e) {
        console.warn("[Geocoding] Error or Timeout:", e);
        return null;
    }
};

// --- HAPTIC FEEDBACK ---
export const triggerHaptic = (pattern: number | number[] = 10) => {
    if (navigator.vibrate) {
        navigator.vibrate(pattern);
    }
};

// --- PUSH NOTIFICATIONS ---
export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return false;

    if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }
    return Notification.permission === 'granted';
};

export const sendLocalNotification = async (title: string, body: string, url: string = '/') => {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
        try {
            // Try to use Service Worker for notification (Better for Mobile/PWA)
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.ready;
                if (registration) {
                    return registration.showNotification(title, {
                        body,
                        icon: '/icon.png', // Ensure you have an icon in public folder
                        badge: '/badge.png', // Android status bar icon
                        vibrate: [200, 100, 200],
                        tag: 'dirole-notification',
                        renotify: true,
                        data: { url } // Critical for the click handler in sw.js
                    } as any);
                }
            }

            // Fallback to standard API
            const options: any = {
                body,
                icon: '/icon.png',
                vibrate: [200, 100, 200],
                tag: 'dirole-notification',
                data: { url }
            };
            new Notification(title, options);
        } catch (e) {
            console.warn("Erro ao enviar notificação:", e);
        }
    }
};

const STORAGE_KEY = 'dirole_user_profile';

// --- BLOCKING SYSTEM ---

export const blockUser = async (blockerId: string, blockedId: string): Promise<boolean> => {
    try {
        await databases.createDocument(
            APPWRITE_DATABASE_ID,
            'blocked_users',
            ID.unique(),
            {
                blocker_id: blockerId,
                blocked_id: blockedId
            }
        );
        return true;
    } catch (e: any) {
        console.error("[Appwrite] Error blocking user:", e.message);
        return false;
    }
};

export const getBlockedUsers = async (userId: string): Promise<string[]> => {
    // TEMPORARY FIX: Collection 'blocked_users' might not exist yet.
    // Returning empty array to prevent 404s and app crash.
    // console.warn("[Appwrite] getBlockedUsers: Blocked users collection not ready. Returning empty list.");
    return [];

    /* 
    // ORIGINAL CODE (Commented out until collection is verified)
    try {
        const response = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            'blocked_users', // Ensure this ID exists in Appwrite
            [
                Query.equal('blocker_id', userId)
            ]
        );
        return response.documents.map((doc: any) => doc.blocked_id);
    } catch (e: any) {
        console.error("[Appwrite] getBlockedUsers error:", e.message);
        return [];
    }
    */
};

// --- USER PROFILE MANAGEMENT ---

export const uploadAvatar = async (userId: string, webPath: string): Promise<string | null> => {
    try {
        console.log(`[Appwrite Storage] Uploading avatar for user: ${userId}`);
        console.log(`[Appwrite Storage] Source webPath: ${webPath}`);

        const response = await fetch(webPath);
        if (!response.ok) {
            throw new Error(`Local file fetch failed: ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        console.log(`[Appwrite Storage] Blob size: ${blob.size} bytes`);
        console.log(`[Appwrite Storage] Blob type: ${blob.type}`);

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (blob.size === 0) {
            throw new Error("File is empty (0 bytes)");
        }
        if (blob.size > maxSize) {
            throw new Error(`File too large: ${(blob.size / 1024 / 1024).toFixed(2)}MB (max 5MB)`);
        }

        const file = new File([blob], `avatar_${userId}.jpg`, { type: 'image/jpeg' });
        console.log(`[Appwrite Storage] File created: ${file.name}, ${file.size} bytes`);

        const result = await storage.createFile(
            APPWRITE_BUCKET_ID,
            ID.unique(),
            file
        );

        console.log(`[Appwrite Storage] Upload SUCCESS! File ID: ${result.$id}`);

        // Use SDK method to get proper view URL (includes correct endpoint + auth)
        const viewUrl = storage.getFileView(APPWRITE_BUCKET_ID, result.$id);

        console.log("[Appwrite Storage] SDK View URL:", viewUrl.toString());

        // Test if URL is accessible
        try {
            const testResponse = await fetch(viewUrl.toString());
            console.log(`[Appwrite Storage] URL Test: ${testResponse.status} ${testResponse.statusText}`);
            if (!testResponse.ok) {
                console.error("[Appwrite Storage] URL is NOT accessible! Status:", testResponse.status);
            } else {
                console.log("[Appwrite Storage] ✅ URL is accessible!");
            }
        } catch (testErr) {
            console.error("[Appwrite Storage] URL accessibility test failed:", testErr);
        }

        return viewUrl.toString();
    } catch (e: any) {
        console.error("[Appwrite Storage] FATAL ERROR in uploadAvatar:", e.message || e);
        console.error("[Appwrite Storage] Full error object:", e);
        return null;
    }
};

export const isNicknameAvailable = async (nickname: string, excludeUserId?: string): Promise<boolean> => {
    try {
        const cleanNickname = nickname.trim().toLowerCase();
        if (!cleanNickname) return false;

        const response = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            'profiles',
            [
                Query.equal('nickname', cleanNickname),
                Query.limit(1)
            ]
        );

        if (response.documents.length === 0) return true;

        // If we are checking for an update, it's okay if the found user is the current user
        if (excludeUserId && response.documents[0].userId === excludeUserId) return true;

        return false;
    } catch (e: any) {
        console.error("[Appwrite] isNicknameAvailable error:", e.message);
        return false;
    }
};

export const syncUserProfile = async (authId: string, meta: any): Promise<User | null> => {
    try {
        console.log(`[Appwrite Sync] Syncing user profile for ${authId}`);

        let profileDoc;

        try {
            console.log(`[Appwrite Sync] Attempting to fetch profile by ID: ${authId}`);
            profileDoc = await databases.getDocument(
                APPWRITE_DATABASE_ID,
                'profiles',
                authId
            );
            console.log("[Appwrite Sync] Profile found by ID.");
        } catch (getErr: any) {
            console.log(`[Appwrite Sync] getDocument failed (${getErr.code}). Falling back to listDocuments...`);
            const response = await databases.listDocuments(
                APPWRITE_DATABASE_ID,
                'profiles',
                [Query.equal('userId', authId), Query.limit(1)]
            );
            if (response.documents.length > 0) {
                profileDoc = response.documents[0];
                console.log("[Appwrite Sync] Profile found by userId query.");
            }
        }

        if (!profileDoc) {
            console.log("[Appwrite Sync] Profile not found. Creating profile with ID:", authId);
            try {
                // Gender normalization to avoid Appwrite validation errors
                const getSafeGender = (g: string) => {
                    const normalized = (g || '').toLowerCase();
                    if (normalized.includes('masc')) return 'Masculino';
                    if (normalized.includes('fem')) return 'Feminino';
                    return 'Outro';
                };

                const profileData = {
                    userId: authId,
                    name: meta.full_name || meta.name || 'Novo Usuário',
                    nickname: meta.nickname || '',
                    email: meta.email || '',
                    avatar: meta.avatar || meta.avatar_url || '😎',
                    points: 0,
                    xp: 0,
                    level: 1,
                    gender: getSafeGender(meta.gender),
                    badges: JSON.stringify([]),
                    favorites: JSON.stringify([])
                };
                console.log("[Appwrite Sync] Creating document with data:", JSON.stringify(profileData, null, 2));

                profileDoc = await databases.createDocument(
                    APPWRITE_DATABASE_ID,
                    'profiles',
                    authId,
                    profileData,
                    [
                        Permission.read(Role.any()),
                        Permission.update(Role.user(authId)),
                        Permission.delete(Role.user(authId))
                    ]
                );
                console.log("[Appwrite Sync] Profile created successfully:", profileDoc.$id);
            } catch (createError: any) {
                console.error("[Appwrite Sync] Create profile error. Code:", createError.code, "Message:", createError.message);

                if (createError.code === 409 || createError.message?.includes('already exists')) {
                    console.error("[Appwrite Sync] 404/409 Conflict Detected! O documento existe mas é invisível para o usuário.");
                    throw new Error("CONFLITO DE PERMISSÃO: O seu perfil já existe no Appwrite mas o app não tem permissão para lê-lo. Verifique as 'Permissions' da coleção 'profiles' no Console do Appwrite.");
                } else {
                    throw createError;
                }
            }
        } else {
            console.log("[Appwrite Sync] Profile found. ID:", profileDoc.$id);
        }

        // Update existing profile with new data if provided
        const updateData: any = {};
        if (meta.name || meta.full_name) updateData.name = meta.full_name || meta.name;
        if (meta.nickname) updateData.nickname = meta.nickname;
        if (meta.email) updateData.email = meta.email;
        if (meta.avatar || meta.avatar_url) updateData.avatar = meta.avatar || meta.avatar_url;
        if (meta.gender) updateData.gender = meta.gender;

        // Only update if there's data to update
        if (Object.keys(updateData).length > 0) {
            profileDoc = await databases.updateDocument(
                APPWRITE_DATABASE_ID,
                'profiles',
                profileDoc.$id,
                updateData
            );
            console.log("[Appwrite Sync] Profile updated successfully");
        }

        const user: User = {
            id: profileDoc.userId,
            name: profileDoc.name,
            nickname: profileDoc.nickname,
            email: profileDoc.email,
            avatar: profileDoc.avatar,
            points: profileDoc.points || 0,
            xp: profileDoc.xp || 0,
            level: profileDoc.level || 1,
            badges: [],
            favorites: []
        };

        try {
            if (profileDoc.badges) user.badges = JSON.parse(profileDoc.badges);
        } catch (e) { console.warn("[Appwrite Sync] Failed to parse badges:", profileDoc.badges); }

        try {
            if (profileDoc.favorites) user.favorites = JSON.parse(profileDoc.favorites);
        } catch (e) { console.warn("[Appwrite Sync] Failed to parse favorites:", profileDoc.favorites); }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        return user;
    } catch (e: any) {
        console.error("[Appwrite Sync] Major sync error:", e);
        return null;
    }
};

export const updateUserProfile = async (userId: string, data: Partial<User>): Promise<{ success: boolean, error?: string }> => {
    try {
        // 1. Check nickname uniqueness if it's being updated
        if (data.nickname) {
            const available = await isNicknameAvailable(data.nickname, userId);
            if (!available) {
                return { success: false, error: "Este apelido já está em uso." };
            }
        }

        const response = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            'profiles',
            [Query.equal('userId', userId), Query.limit(1)]
        );

        if (response.documents.length > 0) {
            await databases.updateDocument(
                APPWRITE_DATABASE_ID,
                'profiles',
                response.documents[0].$id,
                {
                    name: data.name,
                    nickname: data.nickname,
                    avatar: data.avatar
                }
            );
            return { success: true };
        }
        return { success: false, error: "Perfil não encontrado." };
    } catch (e: any) {
        console.error("[Appwrite] updateUserProfile failed:", e.message);
        return { success: false, error: e.message };
    }
};

export const getUserProfile = (): User | null => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (!parsed.favorites) parsed.favorites = [];
            if (!parsed.xp) parsed.xp = 0;
            if (!parsed.level) parsed.level = 1;
            if (!parsed.badges) parsed.badges = [];
            return parsed;
        } catch (e) {
            console.error("Corrupted local profile, clearing...", e);
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }
    }
    return null;
};

export const getUserById = async (userId: string): Promise<User | null> => {
    try {
        const response = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            'profiles',
            [Query.equal('userId', userId), Query.limit(1)]
        );

        if (response.documents.length === 0) return null;
        const profileDoc = response.documents[0] as any;

        return {
            id: profileDoc.userId,
            name: profileDoc.name,
            nickname: profileDoc.nickname,
            email: profileDoc.email,
            avatar: profileDoc.avatar,
            points: profileDoc.points || 0,
            xp: profileDoc.xp || 0,
            level: profileDoc.level || 1,
            badges: profileDoc.badges ? JSON.parse(profileDoc.badges) : [],
            favorites: []
        };
    } catch (e: any) {
        console.error("[Appwrite] Error fetching user by ID:", e.message);
        return null;
    }
};

export const saveUserProfileLocal = (name: string, avatar: string): User => {
    const current = getUserProfile();
    const newUser: User = {
        id: `guest_${Math.random().toString(36).substr(2, 9)}`,
        name,
        avatar,
        points: 0,
        xp: 0,
        level: 1,
        badges: [],
        favorites: []
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    return newUser;
};

export const updateUserProgress = async (userId: string, pointsToAdd: number) => {
    if (userId.startsWith('guest_')) return;

    const local = getUserProfile();
    if (local && local.id === userId) {
        local.points = (local.points || 0) + pointsToAdd;
        local.xp = (local.xp || 0) + pointsToAdd;

        const nextLevel = LEVEL_THRESHOLDS.find((l: any) => l.level === (local.level || 1) + 1);
        if (nextLevel && local.xp >= nextLevel.xp) {
            local.level = (local.level || 1) + 1;
            triggerHaptic([50, 100, 50, 100]);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(local));
    }

    try {
        const response = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            'profiles',
            [Query.equal('userId', userId), Query.limit(1)]
        );

        if (response.documents.length > 0) {
            const doc = response.documents[0] as any;
            let newPoints = (doc.points || 0) + pointsToAdd;
            let newXp = (doc.xp || 0) + pointsToAdd;
            let newLevel = doc.level || 1;

            const nextLvl = LEVEL_THRESHOLDS.find((l: any) => l.level === newLevel + 1);
            if (nextLvl && newXp >= nextLvl.xp) {
                newLevel++;
            }

            await databases.updateDocument(
                APPWRITE_DATABASE_ID,
                'profiles',
                doc.$id,
                {
                    points: newPoints,
                    xp: newXp,
                    level: newLevel
                }
            );
        }
    } catch (e) {
        console.error("Erro ao salvar progresso no Appwrite:", e);
    }
};

export const toggleFavorite = async (locationId: string): Promise<User | null> => {
    const user = getUserProfile();
    if (!user) return null;

    triggerHaptic(15);

    const exists = user.favorites.includes(locationId);
    let newFavorites = [];

    if (exists) {
        newFavorites = user.favorites.filter(id => id !== locationId);
    } else {
        newFavorites = [...user.favorites, locationId];
    }

    user.favorites = newFavorites;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));

    if (!user.id.startsWith('guest_')) {
        try {
            const response = await databases.listDocuments(
                APPWRITE_DATABASE_ID,
                'profiles',
                [Query.equal('userId', user.id), Query.limit(1)]
            );
            if (response.documents.length > 0) {
                await databases.updateDocument(
                    APPWRITE_DATABASE_ID,
                    'profiles',
                    response.documents[0].$id,
                    {
                        favorites: JSON.stringify(newFavorites)
                    }
                );
            }
        } catch (e: any) { console.error("[Appwrite] toggleFavorite failed:", e.message); }
    }

    return user;
};

// --- FRIENDSHIP SERVICES ---

export const getSuggestedUsers = (): FriendUser[] => {
    return [];
};

export const searchUsers = async (query: string, currentUserId: string): Promise<FriendUser[]> => {
    const cleanQuery = query.replace('@', '').trim();
    if (!cleanQuery || cleanQuery.length < 2) return [];
    if (currentUserId.startsWith('guest_')) return [];

    try {
        const blockedIds = await getBlockedUsers(currentUserId);

        // Search in Appwrite profiles - Optimized with server-side filtering
        const response = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            'profiles',
            [
                Query.or([
                    Query.contains('name', cleanQuery),
                    Query.contains('nickname', cleanQuery)
                ]),
                Query.notEqual('userId', currentUserId),
                Query.limit(50)
            ]
        );

        const profiles = response.documents.filter((p: any) => !blockedIds.includes(p.userId));

        // Fetch friendships - Optimized with Or query
        const fResponse = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            'friendships',
            [
                Query.or([
                    Query.equal('requester_id', currentUserId),
                    Query.equal('receiver_id', currentUserId)
                ])
            ]
        );

        const myFriendships = fResponse.documents;

        return profiles.map((p: any) => {
            const friendship = myFriendships.find((f: any) =>
                (f.requester_id === currentUserId && f.receiver_id === p.userId) ||
                (f.receiver_id === currentUserId && f.requester_id === p.userId)
            );

            let status = FriendshipStatus.NONE;
            let fId = undefined;

            if (friendship) {
                fId = friendship.$id;
                if (friendship.status === 'accepted') status = FriendshipStatus.ACCEPTED;
                else if (friendship.requester_id === currentUserId) status = FriendshipStatus.PENDING_SENT;
                else status = FriendshipStatus.PENDING_RECEIVED;
            }

            return {
                id: p.userId,
                name: p.name,
                nickname: p.nickname,
                avatar: p.avatar,
                points: p.points || 0,
                xp: p.xp || 0,
                level: p.level || 1,
                badges: p.badges ? JSON.parse(p.badges) : [],
                favorites: p.favorites ? JSON.parse(p.favorites) : [],
                friendshipStatus: status,
                friendshipId: fId
            };
        });
    } catch (e: any) {
        console.error("[Appwrite] searchUsers error:", e.message);
        return [];
    }
};

export const getFriends = async (currentUserId: string): Promise<FriendUser[]> => {
    if (currentUserId.startsWith('guest_')) return [];

    console.log(`[Appwrite] Fetching friends for ${currentUserId}...`);

    try {
        const blockedIds = await getBlockedUsers(currentUserId);

        const fResponse = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            'friendships',
            [
                Query.or([
                    Query.equal('requester_id', currentUserId),
                    Query.equal('receiver_id', currentUserId)
                ])
            ]
        );

        const friendships = fResponse.documents;

        if (friendships.length > 0) {
            const friendIds = friendships.map((f: any) => f.requester_id === currentUserId ? f.receiver_id : f.requester_id);
            const safeFriendIds = friendIds.filter((id: string) => !blockedIds.includes(id));

            if (safeFriendIds.length > 0) {
                // Fetch profiles for these IDs
                // Appwrite doesn't have "in" query, so we might need multiple calls or list all and filter
                // For a few friends, we can list and filter if under 100
                const pResponse = await databases.listDocuments(
                    APPWRITE_DATABASE_ID,
                    'profiles',
                    [Query.equal('userId', safeFriendIds)]
                );

                const profiles = pResponse.documents;

                return profiles.map((p: any) => {
                    const f = friendships.find((fr: any) => fr.requester_id === p.userId || fr.receiver_id === p.userId);
                    let status = FriendshipStatus.NONE;
                    if (f.status === 'accepted') status = FriendshipStatus.ACCEPTED;
                    else if (f.requester_id === currentUserId) status = FriendshipStatus.PENDING_SENT;
                    else status = FriendshipStatus.PENDING_RECEIVED;

                    return {
                        id: p.userId,
                        name: p.name,
                        nickname: p.nickname,
                        avatar: p.avatar,
                        points: p.points || 0,
                        xp: p.xp || 0,
                        level: p.level || 1,
                        badges: p.badges ? JSON.parse(p.badges) : [],
                        favorites: p.favorites ? JSON.parse(p.favorites) : [],
                        friendshipStatus: status,
                        friendshipId: f.$id
                    };
                });
            }
        }
    } catch (e: any) {
        console.error("[Appwrite] getFriends error:", e.message);
    }

    return [];
};

export const sendFriendRequest = async (currentUserId: string, targetUserId: string): Promise<{ success: boolean, error?: string }> => {
    console.log(`[Appwrite] Attempting to send friend request from ${currentUserId} to ${targetUserId}`);

    if (!currentUserId || !targetUserId) {
        return { success: false, error: "IDs de usuário ausentes" };
    }

    if (currentUserId.startsWith('guest_')) {
        return { success: false, error: "Usuários convidados não podem enviar convites" };
    }

    if (currentUserId === targetUserId) {
        return { success: false, error: "Você não pode adicionar a si mesmo" };
    }

    try {
        // Check if relationship already exists
        const existing = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            'friendships',
            [
                Query.or([
                    Query.and([Query.equal('requester_id', currentUserId), Query.equal('receiver_id', targetUserId)]),
                    Query.and([Query.equal('requester_id', targetUserId), Query.equal('receiver_id', currentUserId)])
                ])
            ]
        );

        if (existing.total > 0) {
            const rel = existing.documents[0];
            if (rel.status === 'accepted') return { success: false, error: "Vocês já são amigos!" };
            if (rel.status === 'pending') {
                if (rel.requester_id === currentUserId) return { success: false, error: "Você já enviou um convite." };
                else return { success: false, error: "Você já tem um convite pendente desta pessoa." };
            }
        }

        const doc = await databases.createDocument(
            APPWRITE_DATABASE_ID,
            'friendships',
            ID.unique(),
            {
                requester_id: currentUserId,
                receiver_id: targetUserId,
                status: 'pending'
            },
            [
                Permission.read(Role.user(currentUserId)),
                Permission.read(Role.users()), // Allow other users to see the request
                Permission.update(Role.user(currentUserId)),
                Permission.update(Role.users()), // Allow the target user to update status to accepted/rejected
                Permission.delete(Role.user(currentUserId)),
                Permission.delete(Role.users()) // Allow either party to delete/cancel
            ]
        );
        console.log(`[Appwrite] ✅ Friend request created! Doc ID: ${doc.$id}`);
        return { success: true };
    } catch (e: any) {
        console.error("[Appwrite] ❌ FATAL Error sending friend request:", e);
        return {
            success: false,
            error: e.message || "Erro desconhecido no Appwrite"
        };
    }
};

export const respondToFriendRequest = async (friendshipId: string, accept: boolean): Promise<boolean> => {
    try {
        const currentUser = await account.get();

        // Debug logs commented out after validation
        /*
        try {
            const doc = await databases.getDocument(APPWRITE_DATABASE_ID, 'friendships', friendshipId);
            console.log(`[DEBUG] Friendship Doc:`, doc);
            console.log(`[DEBUG] Doc Permissions:`, doc.$permissions);
            console.log(`[DEBUG] Current User:`, currentUser.$id);
            console.log(`[DEBUG] Match Requester?`, doc.requester_id === currentUser.$id);
            console.log(`[DEBUG] Match Receiver?`, doc.receiver_id === currentUser.$id);
        } catch (fetchErr) {
            console.warn("[DEBUG] Could not fetch doc to check permissions:", fetchErr);
        }
        */

        console.log(`[FriendRequest] Processing ${friendshipId} action. Accept: ${accept}.`);

        if (accept) {
            await databases.updateDocument(
                APPWRITE_DATABASE_ID,
                'friendships',
                friendshipId,
                { status: 'accepted' }
            );
        } else {
            console.log(`[FriendRequest] Attempting delete...`);
            await databases.deleteDocument(
                APPWRITE_DATABASE_ID,
                'friendships',
                friendshipId
            );
        }
        return true;
    } catch (e: any) {
        console.error("[Appwrite] respondToFriendRequest failed:", e.message);
        return false;
    }
};

// --- INVITES ---

export const sendInvites = async (
    fromUser: User,
    friendIds: string[],
    locationId: string,
    locationName: string,
    message?: string
): Promise<boolean> => {
    if (fromUser.id.startsWith('guest_')) return false;

    try {
        const promises = friendIds.map(friendId =>
            databases.createDocument(
                APPWRITE_DATABASE_ID,
                'invites',
                ID.unique(),
                {
                    from_user_id: fromUser.id,
                    to_user_id: friendId,
                    location_id: locationId,
                    location_name: locationName,
                    message: message || "Bora pro rolê!",
                    status: 'pending'
                }
            )
        );
        await Promise.all(promises);
        return true;
    } catch (e: any) {
        console.error("[Appwrite] Erro ao enviar convite:", e.message);
        return true;
    }
};

export const getPendingInvites = async (userId: string): Promise<Invite[]> => {
    try {
        const response = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            'invites',
            [Query.equal('to_user_id', userId), Query.equal('status', 'pending')]
        );

        return response.documents.map((i: any) => ({
            id: i.$id,
            fromUserId: i.from_user_id,
            toUserId: i.to_user_id,
            locationId: i.location_id,
            locationName: i.location_name,
            message: i.message,
            status: i.status,
            createdAt: new Date(i.$createdAt)
        }));
    } catch (e: any) {
        console.error("[Appwrite] getPendingInvites failed:", e.message);
        return [];
    }
};

export const updateInviteStatus = async (inviteId: string, status: 'accepted' | 'declined'): Promise<boolean> => {
    try {
        await databases.updateDocument(
            APPWRITE_DATABASE_ID,
            'invites',
            inviteId,
            { status }
        );
        return true;
    } catch (e: any) {
        console.error("[Appwrite] updateInviteStatus failed:", e.message);
        return false;
    }
};

export const getPendingFriendRequests = async (userId: string): Promise<FriendUser[]> => {
    try {
        const response = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            'friendships',
            [Query.equal('receiver_id', userId), Query.equal('status', 'pending')]
        );

        if (response.documents.length === 0) return [];

        const requesterIds = response.documents.map((f: any) => f.requester_id);

        // Fetch profiles - Optimized to only fetch the requesters
        const pResponse = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            'profiles',
            [Query.equal('userId', requesterIds)]
        );

        const profiles = pResponse.documents;

        return profiles.map((p: any) => {
            const f = response.documents.find((fr: any) => fr.requester_id === p.userId);
            return {
                id: p.userId,
                name: p.name,
                nickname: p.nickname,
                avatar: p.avatar,
                points: p.points || 0,
                xp: p.xp || 0,
                level: p.level || 1,
                badges: p.badges ? JSON.parse(p.badges) : [],
                favorites: p.favorites ? JSON.parse(p.favorites) : [],
                friendshipStatus: FriendshipStatus.PENDING_RECEIVED,
                friendshipId: f?.$id
            };
        });
    } catch (e: any) {
        console.error("[Appwrite] getPendingFriendRequests failed:", e.message);
        return [];
    }
};

// --- REAL DATA SERVICE ---

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// OPEN STREET MAP / PHOTON FETCHING

const determineOpenStatus = (type: LocationType): { isOpen: boolean, hours: string } => {
    const hour = new Date().getHours();
    let isOpen = false;
    let hours = '';

    switch (type) {
        case LocationType.BALADA:
            isOpen = hour >= 22 || hour < 6;
            hours = '22:00 - 06:00';
            break;
        case LocationType.PUB:
        case LocationType.BAR:
            isOpen = hour >= 17 || hour < 2;
            hours = '17:00 - 02:00';
            break;
        case LocationType.RESTAURANTE:
            isOpen = (hour >= 11 && hour < 15) || (hour >= 18 && hour < 23);
            hours = '11:00-15:00 • 18:00-23:00';
            break;
        default:
            isOpen = hour >= 9 && hour < 20;
            hours = '09:00 - 20:00';
    }
    return { isOpen, hours };
};

const mapExternalToLocation = (item: any, source: 'osm' | 'photon'): Location => {
    let lat = 0;
    let lon = 0;
    let name = '';
    let address = '';
    let type = LocationType.BAR;

    if (source === 'osm') {
        lat = item.lat || item.center?.lat;
        lon = item.lon || item.center?.lon;
        name = item.tags.name || 'Local Sem Nome';

        const street = item.tags['addr:street'] || item.tags.street || '';
        const number = item.tags['addr:housenumber'] || '';
        const city = item.tags['addr:city'] || item.tags.city || '';
        const district = item.tags['addr:suburb'] || '';

        if (street) {
            address = `${street}${number ? ', ' + number : ''}`;
            if (district) address += ` - ${district}`;
        } else if (district) {
            address = `${district}${city ? ', ' + city : ''}`;
        } else if (city) {
            address = `${city}, PR`;
        } else {
            address = 'Endereço no mapa';
        }

        const rawType = item.tags.amenity || item.tags.leisure || item.tags.shop || item.tags.cuisine;
        const nameLower = name.toLowerCase();

        if (['nightclub', 'dance', 'stripclub', 'casino'].includes(rawType)) {
            type = LocationType.BALADA;
        }
        else if (['pub', 'biergarten'].includes(rawType)) {
            type = LocationType.PUB;
        }
        else if (rawType === 'restaurant' || rawType === 'food_court') {
            type = LocationType.RESTAURANTE;
        }
        else if (['bar', 'lounge', 'taproom', 'beverages', 'alcohol', 'tobacco'].includes(rawType)) {
            type = LocationType.BAR;
        }
        else if (rawType === 'fast_food') {
            if (nameLower.includes('janela') || nameLower.includes('porks') || nameLower.includes('garden') || nameLower.includes('quintal') || nameLower.includes('bar')) {
                type = LocationType.BAR;
            } else if (nameLower.includes('burger') || nameLower.includes('pizza') || nameLower.includes('sushi')) {
                type = LocationType.RESTAURANTE;
            } else if (nameLower.includes('espetinho') || nameLower.includes('lanche') || nameLower.includes('dog')) {
                type = LocationType.OUTRO;
            } else {
                type = LocationType.OUTRO;
            }
        }
        else {
            if (nameLower.includes('club') || nameLower.includes('boate')) type = LocationType.BALADA;
            else if (nameLower.includes('pub')) type = LocationType.PUB;
            else if (nameLower.includes('bistrô') || nameLower.includes('restaurante') || nameLower.includes('grill') || nameLower.includes('pizzaria')) type = LocationType.RESTAURANTE;
            else type = LocationType.BAR;
        }

    } else if (source === 'photon') {
        lat = item.geometry.coordinates[1];
        lon = item.geometry.coordinates[0];
        name = item.properties.name || 'Local';
        const p = item.properties;
        const street = p.street || p.road || '';
        const number = p.housenumber || '';
        const district = p.district || p.suburb || '';
        const city = p.city || p.town || '';
        if (street) {
            address = `${street}, ${number}`;
            if (district) address += ` - ${district}`;
            else if (city) address += ` - ${city}`;
        } else if (district) {
            address = `${district}${city ? ', ' + city : ''}`;
        } else {
            address = `${city}, Brasil`;
        }
        if (!address || address.length < 3) address = 'Ver no mapa';
        const osmValue = p.osm_value;
        const nameLower = name.toLowerCase();
        if (osmValue === 'nightclub' || osmValue === 'dance') type = LocationType.BALADA;
        else if (osmValue === 'pub') type = LocationType.PUB;
        else if (nameLower.includes('janela') || nameLower.includes('porks')) type = LocationType.BAR;
        else if (osmValue === 'restaurant') type = LocationType.RESTAURANTE;
        else if (nameLower.includes('restaurante') || nameLower.includes('bistrô')) type = LocationType.RESTAURANTE;
        else type = LocationType.BAR;
    }

    const { isOpen, hours } = determineOpenStatus(type);

    return {
        id: `temp_${source}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name,
        address,
        type,
        latitude: lat,
        longitude: lon,
        verified: true,
        votesForVerification: 10,
        imageUrl: DEFAULT_LOCATION_IMAGES[type] || DEFAULT_LOCATION_IMAGES[LocationType.OUTRO],
        stats: { avgPrice: 0, avgCrowd: 0, avgGender: 0, avgVibe: 0, reviewCount: 0, lastUpdated: new Date() },
        isOpen,
        openingHours: hours,
        reviews: []
    };
};

const fetchFromOSM = async (lat: number, lng: number, radius: number = 15000): Promise<Location[]> => {
    const query = `
    [out:json][timeout:15];
    (
      node["amenity"~"bar|pub|nightclub|biergarten|lounge|taproom|stripclub|restaurant|fast_food|cafe"](around:${radius},${lat},${lng});
      way["amenity"~"bar|pub|nightclub|biergarten|lounge|taproom|stripclub|restaurant|fast_food|cafe"](around:${radius},${lat},${lng});
      node["shop"~"beverages|alcohol|tobacco"](around:${radius},${lat},${lng});
    );
    out center 40;
  `;

    try {
        const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(id);

        if (!response.ok) return [];
        const text = await response.text();
        if (text.trim().startsWith('<')) return [];
        const data = JSON.parse(text);
        if (!data.elements) return [];

        return data.elements.map((el: any) => mapExternalToLocation(el, 'osm')).filter((l: any) => l.name && l.name !== 'Local Sem Nome');
    } catch (error) {
        return [];
    }
};

const fetchFromPhoton = async (lat: number, lng: number): Promise<Location[]> => {
    try {
        const url1 = `https://photon.komoot.io/api/?q=bar&lat=${lat}&lon=${lng}&limit=10&lang=pt`;
        const url2 = `https://photon.komoot.io/api/?q=restaurante&lat=${lat}&lon=${lng}&limit=10&lang=pt`;
        const url3 = `https://photon.komoot.io/api/?q=balada&lat=${lat}&lon=${lng}&limit=5&lang=pt`;

        const [res1, res2, res3] = await Promise.all([fetch(url1), fetch(url2), fetch(url3)]);

        const data1 = res1.ok ? await res1.json() : { features: [] };
        const data2 = res2.ok ? await res2.json() : { features: [] };
        const data3 = res3.ok ? await res3.json() : { features: [] };

        const allFeatures = [...data1.features, ...data2.features, ...data3.features];

        return allFeatures
            .filter((f: any) => {
                const val = f.properties.osm_value;
                if (val === 'supermarket' || val === 'convenience') return false;
                return true;
            })
            .map((f: any) => mapExternalToLocation(f, 'photon'));
    } catch (e) {
        return [];
    }
}

const fetchFromFoursquare = async (lat: number, lng: number): Promise<Location[]> => {
    // @ts-ignore
    const apiKey = import.meta.env.VITE_FOURSQUARE_API_KEY;
    if (!apiKey) return [];

    try {
        const url = `https://api.foursquare.com/v3/places/search?ll=${lat},${lng}&radius=5000&categories=13000&limit=30`;
        const options = {
            method: 'GET',
            headers: {
                accept: 'application/json',
                Authorization: apiKey
            }
        };

        const response = await fetch(url, options);
        if (!response.ok) return [];

        const data = await response.json();
        if (!data.results) return [];

        return data.results.map((place: any) => {
            let type = LocationType.BAR;
            // Map Foursquare Categories to our types
            const cats = place.categories || [];
            const catNames = cats.map((c: any) => c.name.toLowerCase()).join(' ');

            if (catNames.includes('nightclub') || catNames.includes('dance') || catNames.includes('club')) {
                type = LocationType.BALADA;
            } else if (catNames.includes('pub')) {
                type = LocationType.PUB;
            } else if (catNames.includes('restaurant') || catNames.includes('diner') || catNames.includes('bistro')) {
                type = LocationType.RESTAURANTE;
            }

            const { isOpen, hours } = determineOpenStatus(type);

            return {
                id: place.fsq_id,
                name: place.name,
                address: place.location.formatted_address || place.location.address || 'Endereço não informado',
                type: type,
                latitude: place.geocodes?.main?.latitude || 0,
                longitude: place.geocodes?.main?.longitude || 0,
                imageUrl: DEFAULT_LOCATION_IMAGES[type],
                verified: true,
                votesForVerification: 5,
                stats: {
                    avgPrice: 0,
                    avgCrowd: 0,
                    avgGender: 0,
                    avgVibe: 0,
                    reviewCount: 0,
                    lastUpdated: new Date()
                },
                isOpen,
                openingHours: hours,
                reviews: []
            };
        });
    } catch (e) {
        console.warn("Foursquare fetch error:", e);
        return [];
    }
}

export const searchLocations = async (query: string, userLat: number, userLng: number): Promise<Location[]> => {
    if (!query || query.length < 2) return [];

    let dbResults: Location[] = [];
    try {
        const response = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            'locations',
            [Query.limit(50)]
        );

        dbResults = response.documents
            .filter((row: any) =>
                row.name?.toLowerCase().includes(query.toLowerCase()) ||
                row.nome?.toLowerCase().includes(query.toLowerCase())
            )
            .map((row: any) => {
                const stats = row.stats ? JSON.parse(row.stats) : { avgCrowd: 0, avgVibe: 0, avgPrice: 0, reviewCount: 0 };
                const { isOpen, hours } = determineOpenStatus(row.type as LocationType);
                return {
                    id: row.$id,
                    name: row.name || row.nome || 'Sem Nome',
                    address: row.address || row.endereco || '',
                    type: row.type as LocationType,
                    latitude: row.lat || row.latitude || 0,
                    longitude: row.lng || row.longitude || 0,
                    imageUrl: row.image_url || row.imageUrl || '',
                    verified: row.verified || false,
                    votesForVerification: row.votes_for_verification || 0,
                    isOfficial: row.is_official || false,
                    ownerId: row.owner_id || '',
                    officialDescription: row.official_description || '',
                    instagram: row.instagram || '',
                    whatsapp: row.whatsapp || '',
                    stats: stats,
                    isOpen,
                    openingHours: hours,
                    reviews: [],
                    distance: calculateDistance(userLat, userLng, row.lat || row.latitude, row.lng || row.longitude)
                };
            });
    } catch (e: any) { console.warn("[Appwrite] searchLocations failed:", e.message); }

    let apiResults: Location[] = [];
    try {
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=${userLat}&lon=${userLng}&limit=20&lang=pt`;
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            apiResults = data.features.map((f: any) => {
                const loc = mapExternalToLocation(f, 'photon');
                loc.distance = calculateDistance(userLat, userLng, loc.latitude, loc.longitude);
                return loc;
            });
        }
    } catch (e) { console.warn(e); }

    const merged = [...dbResults];
    for (const apiLoc of apiResults) {
        const isDuplicate = merged.some(dbLoc =>
            dbLoc.name === apiLoc.name ||
            (Math.abs(dbLoc.latitude - apiLoc.latitude) < 0.0005 && Math.abs(dbLoc.longitude - apiLoc.longitude) < 0.0005)
        );
        if (!isDuplicate) {
            merged.push(apiLoc);
        }
    }

    return merged.sort((a, b) => (a.distance || 0) - (b.distance || 0));
};

const generateFallbackLocations = (centerLat: number, centerLng: number, count: number = 10): Location[] => {
    const types = [LocationType.BAR, LocationType.BALADA, LocationType.PUB, LocationType.RESTAURANTE];
    const names = [
        "Bar da Esquina", "Arena Show", "Pub Central", "Boteco do Amigo", "Club Neon",
        "Lounge 42", "Taverna Rock", "Rooftop View", "Garden Beer", "Bistrô Sabor", "Cantina Italiana"
    ];

    return Array.from({ length: count }).map((_, i) => {
        const type = types[i % types.length];
        const latOffset = (Math.random() - 0.5) * 0.08;
        const lngOffset = (Math.random() - 0.5) * 0.08;
        const { isOpen, hours } = determineOpenStatus(type);

        return {
            id: `temp_fallback_${Date.now()}_${i}`,
            name: `${names[i % names.length]} (Sugerido)`,
            address: "Localização Aproximada",
            type: type,
            latitude: centerLat + latOffset,
            longitude: centerLng + lngOffset,
            imageUrl: DEFAULT_LOCATION_IMAGES[type],
            verified: true,
            votesForVerification: 10,
            stats: {
                avgPrice: Number((Math.random() * 3).toFixed(1)),
                avgCrowd: Number((Math.random() * 3).toFixed(1)),
                avgGender: Number((Math.random() * 3).toFixed(1)),
                avgVibe: Number((1.5 + Math.random() * 1.5).toFixed(1)),
                reviewCount: Math.floor(Math.random() * 50),
                lastUpdated: new Date()
            },
            isOpen,
            openingHours: hours,
            reviews: []
        };
    });
};

export const getNearbyRoles = async (lat: number, lng: number, bounds?: MapBounds): Promise<Location[]> => {
    // Optimization: Return cache if within threshold and not stale
    if (locationCache && !bounds) {
        const dist = calculateDistance(lat, lng, locationCache.lat, locationCache.lng);
        const isFresh = Date.now() - locationCache.timestamp < CACHE_STALE_MS;
        if (dist < CACHE_DISTANCE_THRESHOLD && isFresh) {
            console.log(`[Cache] Using cached locations (${Math.round(dist * 1000)}m shift)`);
            return locationCache.data.map(loc => ({
                ...loc,
                distance: Math.round(calculateDistance(lat, lng, loc.latitude, loc.longitude))
            })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
        }
    }

    try {
        console.log(`[Appwrite] Fetching locations near [${lat}, ${lng}]`, bounds ? `within bounds` : '');

        const queries = [Query.limit(100)];
        if (bounds) {
            // Buffer of ~1km toNorth/South (0.01 degree is approx 1.1km)
            queries.push(Query.greaterThan('lat', bounds.south - 0.01));
            queries.push(Query.lessThan('lat', bounds.north + 0.01));
            queries.push(Query.greaterThan('lng', bounds.west - 0.01));
            queries.push(Query.lessThan('lng', bounds.east + 0.01));
        }

        const response = await databases.listDocuments(APPWRITE_DATABASE_ID, 'locations', queries);
        const dbLocations: Location[] = response.documents.map((doc: any) => {
            const stats = doc.stats ? JSON.parse(doc.stats) : { avgCrowd: 0, avgVibe: 0, avgPrice: 0, avgGender: 0, reviewCount: 0, lastUpdated: new Date() };
            return {
                id: doc.$id,
                name: doc.name,
                type: doc.type as LocationType,
                latitude: doc.lat || doc.latitude || 0,
                longitude: doc.lng || doc.longitude || 0,
                address: doc.address || '',
                officialDescription: doc.official_description || '',
                imageUrl: doc.image_url || doc.imageUrl || '',
                isOfficial: doc.is_official || false,
                verified: doc.verified || false,
                votesForVerification: doc.votes_for_verification || 0,
                stats: stats,
                isOpen: true,
                openingHours: '24/7',
                reviews: []
            };
        });

        const finalLocations = dbLocations.map(loc => ({
            ...loc,
            distance: Math.round(calculateDistance(lat, lng, loc.latitude, loc.longitude))
        })).sort((a, b) => (a.distance || 0) - (b.distance || 0));

        // Update Cache
        if (!bounds) {
            locationCache = {
                lat,
                lng,
                timestamp: Date.now(),
                data: dbLocations
            };
        }

        return finalLocations;
    } catch (e: any) {
        console.error("[Appwrite] Error in getNearbyRoles:", e.message);
        return generateFallbackLocations(lat, lng, 10);
    }
};

export const createLocation = async (data: Omit<Location, 'id' | 'stats' | 'distance' | 'reviews' | 'verified' | 'votesForVerification' | 'isOpen' | 'openingHours'>): Promise<Location> => {
    try {
        console.log("[Appwrite] Creating location:", data.name);

        const payload = {
            name: data.name,
            address: data.address || '',
            type: data.type,
            lat: data.latitude,
            lng: data.longitude,
            image_url: data.imageUrl || DEFAULT_LOCATION_IMAGES[data.type],
            verified: !!data.isOfficial,
            is_official: !!data.isOfficial,
            stats: JSON.stringify({ avgCrowd: 0, avgVibe: 0, avgPrice: 0, reviewCount: 0, lastUpdated: new Date().toISOString() }),
            votes_for_verification: data.isOfficial ? 10 : 0,
            owner_id: data.ownerId || '',
            official_description: data.officialDescription || '',
            instagram: data.instagram || '',
            whatsapp: data.whatsapp || ''
        };

        const result = await databases.createDocument(
            APPWRITE_DATABASE_ID,
            'locations',
            ID.unique(),
            payload
        );

        return {
            id: result.$id,
            name: result.name,
            type: result.type as LocationType,
            latitude: result.lat,
            longitude: result.lng,
            address: result.address,
            officialDescription: result.official_description,
            imageUrl: result.image_url,
            isOfficial: result.is_official,
            verified: result.verified,
            votesForVerification: result.votes_for_verification,
            stats: JSON.parse(result.stats),
            isOpen: true,
            openingHours: '24/7',
            reviews: []
        };
    } catch (e: any) {
        console.error("[Appwrite] createLocation failed:", e.message);
        throw e;
    }
};

export const verifyLocation = async (id: string, userId?: string): Promise<Location | null> => {
    try {
        // 1. Check if user already verified this (if userId provided)
        if (userId) {
            try {
                const existing = await databases.listDocuments(
                    APPWRITE_DATABASE_ID,
                    'verifications',
                    [
                        Query.equal('location_id', id),
                        Query.equal('user_id', userId),
                        Query.limit(1)
                    ]
                );
                if (existing.total > 0) {
                    console.warn("[VerifyLocation] User already verified this location.");
                    return null;
                }
            } catch (e) {
                console.warn("[VerifyLocation] Verifications collection might not exist, skipping check.");
            }
        }

        const doc = await databases.getDocument(APPWRITE_DATABASE_ID, 'locations', id);
        const newCount = (doc.votes_for_verification || 0) + 1;
        const newVerified = doc.verified || newCount >= 10;

        const response = await databases.updateDocument(
            APPWRITE_DATABASE_ID,
            'locations',
            id,
            {
                votes_for_verification: newCount,
                verified: newVerified
            }
        );

        // 2. Track that this user verified (Fire and forget, try-catch included)
        if (userId) {
            databases.createDocument(
                APPWRITE_DATABASE_ID,
                'verifications',
                ID.unique(),
                {
                    location_id: id,
                    user_id: userId
                }
            ).catch(err => console.warn("[VerifyLocation] Could not save verification record:", err.message));
        }

        const stats = response.stats ? JSON.parse(response.stats) : { avgCrowd: 0, avgVibe: 0, avgPrice: 0, reviewCount: 0 };
        return {
            id: response.$id,
            name: response.name,
            type: response.type as LocationType,
            latitude: response.lat,
            longitude: response.lng,
            address: response.address,
            officialDescription: response.official_description,
            imageUrl: response.image_url,
            isOfficial: response.is_official,
            verified: response.verified,
            votesForVerification: response.votes_for_verification,
            stats: stats,
            isOpen: true,
            openingHours: '24/7',
            reviews: []
        };
    } catch (e: any) {
        console.error("[Appwrite] verifyLocation failed:", e.message);
        return null;
    }
};

export const checkVerification = async (locationId: string, userId: string): Promise<boolean> => {
    try {
        const response = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            'verifications',
            [
                Query.equal('location_id', locationId),
                Query.equal('user_id', userId),
                Query.limit(1)
            ]
        );
        return response.total > 0;
    } catch (e) {
        return false;
    }
};

export const claimBusiness = async (locationId: string, ownerId: string, details: any): Promise<boolean> => {
    try {
        await databases.updateDocument(
            APPWRITE_DATABASE_ID,
            'locations',
            locationId,
            {
                is_official: true,
                verified: true,
                owner_id: ownerId,
                official_description: details.description || '',
                instagram: details.instagram || '',
                whatsapp: details.whatsapp || ''
            }
        );
        triggerHaptic([50, 100, 50]);
        return true;
    } catch (e: any) {
        console.error("[Appwrite] claimBusiness failed:", e.message);
        return false;
    }
};

export const getReviewsForLocation = async (locationId: string): Promise<Review[]> => {
    if (locationId.startsWith('temp_')) return [];

    try {
        const response = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            'reviews',
            [
                Query.equal('locationId', locationId),
                Query.orderDesc('$createdAt')
            ]
        );

        return response.documents.map((r: any) => ({
            id: r.$id,
            locationId: r.locationId,
            userId: r.userId,
            userName: r.userName,
            userAvatar: r.userAvatar,
            price: r.price || 0,
            crowd: r.crowd || 0,
            gender: r.gender || 0,
            vibe: r.vibe || 0,
            comment: r.comment || '',
            createdAt: new Date(r.$createdAt)
        }));
    } catch (e: any) {
        console.warn("[getReviewsForLocation] Failed to fetch from Appwrite:", e.message);
        return [];
    }
};
// ⚠️ ATENÇÃO: Esta função assume que você rodou o SQL de RESET do banco
// ⚠️ ATENÇÃO: Esta função assume que você rodou o SQL de RESET do banco
export const submitReview = async (review: Review, locationContext?: Location): Promise<boolean> => {
    let finalLocationId = review.locationId;
    console.log(`[SubmitReview] Iniciando para locationId: ${finalLocationId}`);

    // 1. SYNC TEMP LOCATION
    if (review.locationId.startsWith('temp_')) {
        console.log(`[SubmitReview] Location is TEMP. Syncing to DB...`);
        if (!locationContext) {
            console.error("[SubmitReview] Falta context para sync.");
            return false;
        }

        try {
            const payload = {
                name: locationContext.name,
                address: locationContext.address,
                type: locationContext.type,
                lat: locationContext.latitude,
                lng: locationContext.longitude,
                image_url: locationContext.imageUrl,
                verified: true,
                votes_for_verification: 10,
                is_official: false,
                stats: JSON.stringify(locationContext.stats)
            };

            const result = await databases.createDocument(
                APPWRITE_DATABASE_ID,
                'locations',
                ID.unique(),
                payload
            );

            finalLocationId = result.$id;
            console.log(`[SubmitReview] Location synced! New ID: ${finalLocationId}`);
        } catch (e: any) {
            console.error("[SubmitReview] Appwrite sync failed:", e.message);
            return false;
        }
    }

    // 2. CHECK FOR EXISTING REVIEW
    try {
        const existing = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            'reviews',
            [
                Query.equal('locationId', finalLocationId),
                Query.equal('userId', review.userId),
                Query.limit(1)
            ]
        );
        if (existing.total > 0) {
            console.warn("[SubmitReview] User already reviewed this location.");
            return true; // Return true as if successful, but don't duplicate
        }
    } catch (e) {
        console.warn("[SubmitReview] Error checking existing review:", e);
    }

    // 3. SUBMIT REVIEW - DIRECT & SIMPLE
    const payload = {
        locationId: finalLocationId,
        userId: review.userId,
        userName: review.userName,
        userAvatar: review.userAvatar,
        price: review.price || 0,
        crowd: review.crowd || 0,
        vibe: review.vibe || 0,
        gender: review.gender || 0,
        comment: review.comment || ''
    };

    try {
        console.log("[SubmitReview] Inserting review to Appwrite...", payload);

        // TIMEOUT PROTECTION
        const insertPromise = databases.createDocument(
            APPWRITE_DATABASE_ID,
            'reviews',
            ID.unique(),
            payload
        );

        const timeoutPromise = new Promise<{ error: any }>((resolve) =>
            setTimeout(() => resolve({ error: { message: 'Timeout' } }), 10000)
        );

        const result: any = await Promise.race([insertPromise, timeoutPromise]);

        if (result.error || !result.$id) {
            console.warn("[SubmitReview] Appwrite failed or timed out. Saving to Local Storage...");

            // EMERGENCY FALLBACK TO LOCAL STORAGE
            try {
                const localReviews = JSON.parse(localStorage.getItem('dirole_offline_reviews') || '[]');
                localReviews.push({
                    ...review,
                    locationId: finalLocationId,
                    id: `offline_${Date.now()}`,
                    createdAt: new Date(),
                    isOffline: true
                });
                localStorage.setItem('dirole_offline_reviews', JSON.stringify(localReviews));
                console.log("[SubmitReview] SAVED TO LOCAL STORAGE (OFFLINE MODE)");
                return true;
            } catch (lsErr) {
                console.error("Local storage also failed", lsErr);
                return false;
            }
        }

        console.log("[SubmitReview] SUCCESS!");

        // Success! Update stats (Fire and forget)
        updateUserProgress(review.userId, 10).catch(e => console.warn("XP update failed", e));

        // Update aggregated stats on location (Fire and forget)
        (async () => {
            try {
                const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

                const response = await databases.listDocuments(
                    APPWRITE_DATABASE_ID,
                    'reviews',
                    [
                        Query.equal('locationId', finalLocationId),
                        Query.greaterThan('$createdAt', sixHoursAgo.toISOString())
                    ]
                );

                const allR = response.documents;
                const count = allR.length;

                let avgCrowd = 0;
                let avgVibe = 0;
                let avgPrice = 0;

                if (count > 0) {
                    avgCrowd = allR.reduce((acc: number, r: any) => acc + (r.crowd || 0), 0) / count;
                    avgVibe = allR.reduce((acc: number, r: any) => acc + (r.vibe || 0), 0) / count;
                    avgPrice = allR.reduce((acc: number, r: any) => acc + (r.price || 0), 0) / count;
                }

                await databases.updateDocument(
                    APPWRITE_DATABASE_ID,
                    'locations',
                    finalLocationId,
                    {
                        stats: JSON.stringify({
                            avgCrowd,
                            avgVibe,
                            avgPrice,
                            reviewCount: count,
                            lastUpdated: new Date().toISOString()
                        })
                    }
                );
            } catch (err) { console.warn("Stats aggregation failed", err); }
        })();

        triggerHaptic([50, 50]);
        return true;

    } catch (e: any) {
        console.error("Exception in submitReview:", e);
        return false;
    }
};

export const getLeaderboard = async (scope: 'global' | 'friends' = 'global', currentUserId?: string): Promise<User[]> => {
    try {
        console.log(`[Appwrite] Fetching leaderboard (scope: ${scope})`);

        if (scope === 'friends' && currentUserId) {
            // Fetch friends and current user profile
            const [friends, me] = await Promise.all([
                getFriends(currentUserId),
                getUserById(currentUserId)
            ]);

            const everyone = me ? [...friends, me] : friends;
            return everyone.sort((a, b) => (b.points || 0) - (a.points || 0));
        }

        // Global leaderboard
        const response = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            'profiles',
            [
                Query.orderDesc('points'),
                Query.limit(50)
            ]
        );

        return response.documents.map((doc: any) => ({
            id: doc.userId,
            name: doc.name,
            nickname: doc.nickname,
            avatar: doc.avatar,
            points: doc.points || 0,
            xp: doc.xp || 0,
            level: doc.level || 1,
            badges: doc.badges ? JSON.parse(doc.badges) : [],
            favorites: []
        }));
    } catch (e: any) {
        console.error("[getLeaderboard] Failed to fetch from Appwrite:", e.message);
        return [];
    }
};

export const generateMockActivity = (): ActivityFeedItem | null => { return null; };
export const getEventsForLocation = async (location: Location): Promise<LocationEvent[]> => { return []; };
export const getGalleryForLocation = async (locationId: string): Promise<GalleryItem[]> => { return []; };
export const submitReport = async (report: Report): Promise<boolean> => {
    try {
        await databases.createDocument(
            APPWRITE_DATABASE_ID,
            'reports',
            ID.unique(),
            {
                target_id: report.targetId,
                target_type: report.targetType,
                reason: report.reason,
                details: report.details || '',
                reporter_id: report.reporterId
            }
        );
        return true;
    } catch (e: any) {
        console.error("[Appwrite] submitReport failed:", e.message);
        return true; // Return true to not block the user flow
    }
};

// ===== DIROLE STORIES =====

export const createStory = async (
    userId: string,
    userName: string,
    userNickname: string,
    userAvatar: string,
    locationId: string,
    locationName: string,
    photoUrl: string
): Promise<boolean> => {
    try {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 6 * 60 * 60 * 1000); // 6 hours

        await databases.createDocument(
            APPWRITE_DATABASE_ID,
            'stories',
            ID.unique(),
            {
                user_id: userId,
                user_name: userName,
                user_avatar: userAvatar,
                location_id: locationId,
                location_name: locationName,
                photo_url: photoUrl,
                created_at: now.toISOString(),
                expires_at: expiresAt.toISOString(),
                viewed_by: JSON.stringify([])
            }
        );

        return true;
    } catch (e: any) {
        console.error("[createStory] Failed:", e.message);
        return false;
    }
};

export const getStoriesByLocation = async (locationId: string): Promise<any[]> => {
    try {
        const now = new Date().toISOString();
        const response = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            'stories',
            [
                Query.equal('location_id', locationId),
                Query.greaterThan('expires_at', now),
                Query.orderDesc('created_at'),
                Query.limit(50)
            ]
        );

        return response.documents.map((doc: any) => ({
            id: doc.$id,
            userId: doc.user_id,
            userName: doc.user_name,
            userAvatar: doc.user_avatar,
            locationId: doc.location_id,
            locationName: doc.location_name,
            photoUrl: doc.photo_url,
            createdAt: new Date(doc.created_at),
            expiresAt: new Date(doc.expires_at),
            viewedBy: JSON.parse(doc.viewed_by || '[]')
        }));
    } catch (e: any) {
        console.error("[getStoriesByLocation] Failed:", e.message);
        return [];
    }
};

export const getStoryCountsByLocations = async (locationIds: string[]): Promise<Record<string, number>> => {
    try {
        const now = new Date().toISOString();
        const counts: Record<string, number> = {};

        // Fetch all active stories for these locations
        const response = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            'stories',
            [
                Query.greaterThan('expires_at', now),
                Query.limit(1000)
            ]
        );

        // Count stories per location
        response.documents.forEach((doc: any) => {
            const locId = doc.location_id;
            if (locationIds.includes(locId)) {
                counts[locId] = (counts[locId] || 0) + 1;
            }
        });

        return counts;
    } catch (e: any) {
        console.error("[getStoryCountsByLocations] Failed:", e.message);
        return {};
    }
};

export const markStoryAsViewed = async (storyId: string, userId: string): Promise<boolean> => {
    try {
        // Get current story
        const story = await databases.getDocument(
            APPWRITE_DATABASE_ID,
            'stories',
            storyId
        );

        const viewedBy = JSON.parse(story.viewed_by || '[]');
        if (!viewedBy.includes(userId)) {
            viewedBy.push(userId);
            await databases.updateDocument(
                APPWRITE_DATABASE_ID,
                'stories',
                storyId,
                { viewed_by: JSON.stringify(viewedBy) }
            );
        }
        return true;
    } catch (e: any) {
        console.error("[markStoryAsViewed] Failed:", e.message);
        return false;
    }
};

export const cleanupExpiredStories = async (): Promise<number> => {
    try {
        const now = new Date().toISOString();
        const response = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            'stories',
            [
                Query.lessThan('expires_at', now),
                Query.limit(100)
            ]
        );

        let deleted = 0;
        for (const doc of response.documents) {
            await databases.deleteDocument(
                APPWRITE_DATABASE_ID,
                'stories',
                doc.$id
            );
            deleted++;
        }

        return deleted;
    } catch (e: any) {
        console.error("[cleanupExpiredStories] Failed:", e.message);
        return 0;
    }
};
