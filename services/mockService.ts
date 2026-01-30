
import { Location, LocationType, User, Filters, FriendshipStatus, Route, Review, ActivityFeedItem, LocationEvent, GalleryItem, Report, FriendUser, Invite } from '../types';
import { BADGES, LEVEL_THRESHOLDS, DEFAULT_LOCATION_IMAGES } from '../constants';
import { supabase } from './supabaseClient';

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
        const { error } = await supabase.from('blocked_users').insert({
            blocker_id: blockerId,
            blocked_id: blockedId
        });
        if (error) throw error;
        return true;
    } catch (e) {
        console.error("Error blocking user:", e);
        return false;
    }
};

export const getBlockedUsers = async (userId: string): Promise<string[]> => {
    try {
        const { data } = await supabase
            .from('blocked_users')
            .select('blocked_id')
            .eq('blocker_id', userId);

        return data ? data.map((b: any) => b.blocked_id) : [];
    } catch (e) {
        return [];
    }
};

// --- USER PROFILE MANAGEMENT ---

export const uploadAvatar = async (userId: string, webPath: string): Promise<string | null> => {
    try {
        console.log("[Supabase Storage] Starting check for path:", webPath);

        // 1. Fetch the blob from the local webPath
        const response = await fetch(webPath);
        if (!response.ok) throw new Error("Local file fetch failed");
        const blob = await response.blob();
        console.log("[Supabase Storage] Blob created. Size:", blob.size, "Type:", blob.type);

        // 2. Prepare file metadata
        const fileExt = blob.type.split('/')[1] || 'jpg';
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`; // Just filename, bucket is provided in .from()

        console.log("[Supabase Storage] Uploading to bucket 'avatars' as:", filePath);

        // 3. Upload to Supabase Storage with 15s Timeout
        const uploadPromise = supabase.storage
            .from('avatars')
            .upload(filePath, blob, {
                cacheControl: '3600',
                upsert: true
            });

        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => {
                console.warn("[Supabase Storage] QUICK TIMEOUT (4s) - Switching to Fallback");
                reject(new Error("Upload Timeout (4s)"));
            }, 4000)
        );

        console.log("[Supabase Storage] Racing Library Upload vs 15s Timeout...");
        try {
            const result: any = await Promise.race([uploadPromise, timeoutPromise]);
            const { data, error: uploadError } = result;

            if (uploadError) {
                console.error("[Supabase Storage] Library Upload Error:", uploadError);
                throw uploadError;
            }

            console.log("[Supabase Storage] Library Upload success:", data);

            // 4. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            console.log("[Supabase Storage] Final Public URL:", publicUrl);
            return publicUrl;
        } catch (libErr: any) {
            console.warn("[Supabase Storage] >>> CATCH TRIGGERED <<< Reason:", libErr.message);

            // --- RAW API FALLBACK ---
            const baseUrl = (supabase as any).supabaseUrl || 'https://gwvnwsvaepxwjasdupks.supabase.co';
            const apiKey = (supabase as any).supabaseKey;

            console.log("[Supabase Storage] Starting Raw Fetch to:", `${baseUrl}/storage/v1/object/avatars/${filePath}`);

            const rawResponse = await fetch(`${baseUrl}/storage/v1/object/avatars/${filePath}`, {
                method: 'POST',
                headers: {
                    'apikey': apiKey,
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': blob.type,
                    'x-upsert': 'true'
                },
                body: blob
            });

            if (!rawResponse.ok) {
                const errData = await rawResponse.json();
                console.error("[Supabase Storage] Raw API Fallback Failed with status:", rawResponse.status, errData);
                throw new Error(`Raw Upload Failed: ${rawResponse.status}`);
            }

            console.log("[Supabase Storage] Raw API Fallback SUCCESS!");

            // In Fallback mode, we construct the public URL manually to avoid more hangs
            const constructedUrl = `${baseUrl}/storage/v1/object/public/avatars/${filePath}`;
            console.log("[Supabase Storage] Constructed Fallback URL:", constructedUrl);
            return constructedUrl;
        }
    } catch (e: any) {
        console.error("[Supabase Storage] FATAL ERROR in uploadAvatar:", e.message || e);
        return null;
    }
};

export const syncUserProfile = async (authId: string, meta: any): Promise<User | null> => {
    try {
        console.log("[Supabase Sync] Starting sync for user:", authId);

        // 1. Attempt to fetch profile with a small retry loop (wait for trigger)
        let attempts = 0;
        let existing = null;

        while (attempts < 3) {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authId)
                .single();

            if (data) {
                existing = data;
                break;
            }

            console.log(`[Supabase Sync] Profile not found yet, retrying... (${attempts + 1}/3)`);
            attempts++;
            await new Promise(r => setTimeout(r, 1000)); // Wait 1s between retries
        }

        if (existing) {
            console.log("[Supabase Sync] Profile found:", existing.id);
            const user: User = {
                id: existing.id,
                name: existing.name || 'Usuário',
                nickname: existing.nickname || '',
                email: existing.email || '',
                age: existing.age || 0,
                gender: existing.gender || '',
                avatar: existing.avatar || '😎',
                points: existing.points || 0,
                xp: existing.xp || 0,
                level: existing.level || 1,
                badges: existing.badges || [],
                favorites: existing.favorites || []
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
            return user;
        }

        // 2. Fallback if trigger failed (manual emergency insert)
        console.warn("[Supabase Sync] Trigger failed to create profile, running emergency insert...");
        const newUser = {
            id: authId,
            name: meta.full_name || meta.name || 'Novo Usuário',
            nickname: meta.nickname || '',
            email: meta.email || '',
            avatar: meta.avatar_url || '😎',
            points: 0,
            xp: 0,
            level: 1,
            badges: [],
            favorites: []
        };

        const { error: insertError } = await supabase.from('profiles').insert(newUser);
        if (insertError) {
            console.error("[Supabase Sync] Emergency insert failed:", insertError);
            throw insertError;
        }

        const user: User = newUser as User;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        return user;

    } catch (e) {
        console.error("[Supabase Sync] Major sync error:", e);
        // Minimum viable local state
        return {
            id: authId,
            name: meta.full_name || 'Usuario',
            avatar: meta.avatar_url || '😎',
            points: 0, xp: 0, level: 1, badges: [], favorites: []
        };
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
        const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (data) {
            return {
                id: data.id,
                name: data.name,
                nickname: data.nickname,
                email: data.email,
                age: data.age,
                gender: data.gender,
                avatar: data.avatar,
                points: data.points,
                xp: data.xp,
                level: data.level,
                badges: data.badges || [],
                favorites: data.favorites || []
            };
        }
    } catch (e) {
        console.error("Error fetching user by ID:", e);
    }
    return null;
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
        local.points += pointsToAdd;
        local.xp += pointsToAdd;

        const nextLevel = LEVEL_THRESHOLDS.find(l => l.level === local.level + 1);
        if (nextLevel && local.xp >= nextLevel.xp) {
            local.level += 1;
            triggerHaptic([50, 100, 50, 100]);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(local));
    }

    try {
        const { data: currentRemote } = await supabase.from('profiles').select('points, xp, level').eq('id', userId).single();

        if (currentRemote) {
            let newPoints = currentRemote.points + pointsToAdd;
            let newXp = currentRemote.xp + pointsToAdd;
            let newLevel = currentRemote.level;

            const nextLvl = LEVEL_THRESHOLDS.find(l => l.level === newLevel + 1);
            if (nextLvl && newXp >= nextLvl.xp) {
                newLevel++;
            }

            await supabase.from('profiles').update({
                points: newPoints,
                xp: newXp,
                level: newLevel,
                updated_at: new Date()
            }).eq('id', userId);
        }
    } catch (e) {
        console.error("Erro ao salvar progresso na nuvem:", e);
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
            await supabase.from('profiles').update({
                favorites: newFavorites
            }).eq('id', user.id);
        } catch (e) { console.error(e); }
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

    const blockedIds = await getBlockedUsers(currentUserId);
    let realUsers: FriendUser[] = [];

    try {
        // Split query into terms if it contains spaces
        const terms = cleanQuery.split(' ').filter(t => t.length > 0);
        let queryBuilder = supabase.from('profiles').select('*');

        if (terms.length > 1) {
            // If multiple terms, simplistic approach to finding name match
            const orString = terms.map(t => `name.ilike.%${t}%,nickname.ilike.%${t}%`).join(',');
            queryBuilder = queryBuilder.or(orString);
        } else {
            queryBuilder = queryBuilder.or(`name.ilike.%${cleanQuery}%,nickname.ilike.%${cleanQuery}%`);
        }

        const { data: profiles } = await queryBuilder
            .neq('id', currentUserId)
            .limit(20); // Incresed limit

        if (profiles && profiles.length > 0) {
            const filteredProfiles = profiles.filter((p: any) => !blockedIds.includes(p.id));

            // FETCH ALL FRIENDSHIPS for current user to map status in memory
            const { data: myFriendships } = await supabase
                .from('friendships')
                .select('*')
                .or(`requester_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);

            realUsers = filteredProfiles.map((p: any) => {
                // Find friendship specifically with this user in memory
                const friendship = myFriendships?.find((f: any) =>
                    (f.requester_id === currentUserId && f.receiver_id === p.id) ||
                    (f.receiver_id === currentUserId && f.requester_id === p.id)
                );

                let status = FriendshipStatus.NONE;
                let fId = undefined;

                if (friendship) {
                    fId = friendship.id;
                    if (friendship.status === 'accepted') status = FriendshipStatus.ACCEPTED;
                    else if (friendship.requester_id === currentUserId) status = FriendshipStatus.PENDING_SENT;
                    else status = FriendshipStatus.PENDING_RECEIVED;
                }

                return {
                    id: p.id,
                    name: p.name,
                    nickname: p.nickname,
                    avatar: p.avatar,
                    points: p.points,
                    xp: p.xp,
                    level: p.level,
                    badges: p.badges,
                    favorites: p.favorites,
                    friendshipStatus: status,
                    friendshipId: fId
                };
            });
        }
    } catch (e) {
        console.warn("User search offline/error", e);
    }

    return realUsers;
};

export const getFriends = async (currentUserId: string): Promise<FriendUser[]> => {
    if (currentUserId.startsWith('guest_')) return [];

    console.log(`[getFriends] Fetching friends for ${currentUserId}...`);

    try {
        const blockedIds = await getBlockedUsers(currentUserId);

        // 1. Check Session Health & Recover if needed
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (!session || sessionError) {
            console.warn("[getFriends] Session lost or invalid. Attempting refresh...");
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

            if (refreshError || !refreshData.session) {
                console.error("[getFriends] FATAL: Could not recover session.", refreshError);
                // Return empty but consider alerting user to re-login
                return [];
            }
            console.log("[getFriends] Session recovered successfully!");
        }

        const { data: friendships, error: fError } = await supabase
            .from('friendships')
            .select('*')
            .or(`requester_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);

        if (fError) {
            console.error("[getFriends] Supabase Error (Friendships):", fError);
            throw fError;
        }

        if (friendships && friendships.length > 0) {
            console.log(`[getFriends] Found ${friendships.length} raw friendships.`);
            const friendIds = friendships.map((f: any) => f.requester_id === currentUserId ? f.receiver_id : f.requester_id);
            const safeFriendIds = friendIds.filter((id: string) => !blockedIds.includes(id));

            if (safeFriendIds.length > 0) {
                const { data: profiles, error: pError } = await supabase.from('profiles').select('*').in('id', safeFriendIds);

                if (pError) {
                    console.error("[getFriends] Supabase Error (Profiles):", pError);
                    throw pError;
                }

                if (profiles) {
                    console.log(`[getFriends] Successfully loaded ${profiles.length} friend profiles.`);
                    return profiles.map((p: any) => {
                        const f = friendships.find((fr: any) => fr.requester_id === p.id || fr.receiver_id === p.id);
                        let status = FriendshipStatus.NONE;
                        if (f.status === 'accepted') status = FriendshipStatus.ACCEPTED;
                        else if (f.requester_id === currentUserId) status = FriendshipStatus.PENDING_SENT;
                        else status = FriendshipStatus.PENDING_RECEIVED;

                        return {
                            id: p.id,
                            name: p.name,
                            avatar: p.avatar,
                            points: p.points,
                            xp: p.xp,
                            level: p.level,
                            badges: p.badges,
                            favorites: p.favorites,
                            friendshipStatus: status,
                            friendshipId: f.id,
                            lastCheckIn: undefined
                        };
                    });
                }
            } else {
                console.log("[getFriends] No safe friend IDs to fetch (all blocked or empty).");
            }
        } else {
            console.log("[getFriends] No friendships found in DB.");
        }
    } catch (e) {
        console.error("[getFriends] CRITICAL ERROR:", e);
    }

    return [];
};

export const sendFriendRequest = async (currentUserId: string, targetUserId: string): Promise<boolean> => {
    if (currentUserId.startsWith('guest_')) return false;

    try {
        const { error } = await supabase.from('friendships').insert({
            requester_id: currentUserId,
            receiver_id: targetUserId,
            status: 'pending'
        });
        if (error) {
            console.error("Error sending friend request:", error);
            return false;
        }
        return true;
    } catch (e) {
        console.warn(e);
        return false;
    }
};

export const respondToFriendRequest = async (friendshipId: string, accept: boolean): Promise<boolean> => {
    try {
        if (accept) {
            await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId);
        } else {
            await supabase.from('friendships').delete().eq('id', friendshipId);
        }
        return true;
    } catch (e) { console.warn(e); }
    return true;
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
        const invites = friendIds.map(friendId => ({
            from_user_id: fromUser.id,
            to_user_id: friendId,
            location_id: locationId,
            location_name: locationName,
            message: message || "Bora pro rolê!",
            status: 'pending'
        }));

        const { error } = await supabase.from('invites').insert(invites);
        if (error) throw error;
        return true;
    } catch (e) {
        console.error("Erro ao enviar convite:", e);
        return true;
    }
};

// --- REAL DATA SERVICE ---

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
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
        const { data } = await supabase
            .from('locations')
            .select('*')
            .or(`name.ilike.%${query}%,nome.ilike.%${query}%`)
            .limit(10);

        if (data) {
            dbResults = data.map((row: any) => {
                const { isOpen, hours } = determineOpenStatus(row.type as LocationType);
                return {
                    id: row.id,
                    name: row.name || row.nome || 'Sem Nome',
                    address: row.address || row.endereco || '',
                    type: row.type as LocationType,
                    latitude: row.latitude,
                    longitude: row.longitude,
                    imageUrl: row.image_url,
                    verified: row.verified,
                    votesForVerification: row.votes_for_verification,
                    isOfficial: row.is_official,
                    ownerId: row.owner_id,
                    officialDescription: row.official_description,
                    instagram: row.instagram,
                    whatsapp: row.whatsapp,
                    stats: {
                        avgPrice: 0, avgCrowd: 0, avgGender: 0, avgVibe: 0, reviewCount: 0,
                        lastUpdated: new Date(),
                        ...(row.stats || {})
                    },
                    isOpen,
                    openingHours: hours,
                    reviews: [],
                    distance: calculateDistance(userLat, userLng, row.latitude, row.longitude)
                };
            });
        }
    } catch (e) { console.warn(e); }

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

export const getNearbyRoles = async (lat: number, lng: number): Promise<Location[]> => {
    let dbLocations: Location[] = [];
    try {
        console.log(`[Supabase Vital] Testando conectividade bruta (CORS check)...`);
        const baseUrl = (supabase as any).supabaseUrl || 'https://gwvnwsvaepxwjasdupks.supabase.co';
        try {
            const fetchPromise = fetch(`${baseUrl}/rest/v1/locations?select=id&limit=1`, {
                headers: {
                    'apikey': (supabase as any).supabaseKey,
                    'Authorization': `Bearer ${(supabase as any).supabaseKey}`
                }
            });
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("Diagnostic Timeout")), 8000)
            );
            const rawTest = await Promise.race([fetchPromise, timeoutPromise]);
            console.log(`[Supabase Vital] Conectividade Bruta OK:`, rawTest.status, rawTest.statusText);
        } catch (rawErr: any) {
            console.error(`[Supabase Vital] ERRO DE REDE BRUTO:`, rawErr.message);
        }

        console.log(`[Supabase Vital] Buscando dados via biblioteca (com timeout de 3s)...`);
        const libFetch = supabase.from('locations').select('*');
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Supabase Library Timeout")), 3000));

        const result: any = await Promise.race([libFetch, timeout]);
        const { data, error } = result;

        if (error) {
            console.error("[Supabase Vital] Fetch error in getNearbyRoles:", error.message, error.details, error.hint);
            throw error;
        }

        console.log(`[Supabase Vital] RAW DATA FROM DB:`, JSON.stringify(data));
        console.log(`[Supabase Vital] Fetched ${data?.length || 0} rows total.`);

        if (data) {
            dbLocations = data.map((row: any) => {
                const rawType = (row.type || row.tipo || 'Outro').toLowerCase();
                let typeSelection = LocationType.OUTRO;
                if (rawType === 'bar') typeSelection = LocationType.BAR;
                else if (rawType === 'balada') typeSelection = LocationType.BALADA;
                else if (rawType === 'pub') typeSelection = LocationType.PUB;
                else if (rawType === 'restaurante') typeSelection = LocationType.RESTAURANTE;

                const { isOpen, hours } = determineOpenStatus(typeSelection);

                return {
                    id: row.id,
                    name: row.name || row.nome,
                    address: row.address || row.endereco,
                    type: typeSelection,
                    latitude: row.latitude,
                    longitude: row.longitude,
                    imageUrl: row.image_url || row.url_imagem,
                    verified: row.verified,
                    votesForVerification: row.votes_for_verification,
                    isOfficial: row.is_official,
                    ownerId: row.owner_id,
                    officialDescription: row.official_description,
                    instagram: row.instagram,
                    whatsapp: row.whatsapp,
                    stats: {
                        avgPrice: 0, avgCrowd: 0, avgGender: 0, avgVibe: 0, reviewCount: 0,
                        lastUpdated: new Date(),
                        ...(row.stats || {})
                    } as any,
                    isOpen,
                    openingHours: hours,
                    reviews: []
                };
            });
        }
    } catch (e: any) {
        console.warn("Supabase Library failed, attempting Raw API Fallback...", e.message);

        try {
            const baseUrl = (supabase as any).supabaseUrl || 'https://gwvnwsvaepxwjasdupks.supabase.co';
            const apiKey = (supabase as any).supabaseKey;

            const fetchPromise = fetch(`${baseUrl}/rest/v1/locations?select=*`, {
                headers: {
                    'apikey': apiKey,
                    'Authorization': `Bearer ${apiKey}`
                }
            });
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("Raw API Timeout")), 30000)
            );

            const response = await Promise.race([fetchPromise, timeoutPromise]);

            if (!response.ok) throw new Error(`Raw API HTTP Error: ${response.status}`);

            const rawData = await response.json();
            console.log(`[Supabase Vital] RAW API FALLBACK SUCCESS:`, rawData.length, "rows");

            dbLocations = rawData.map((row: any) => {
                const rawType = (row.type || row.tipo || 'Outro').toLowerCase();
                let typeSelection = LocationType.OUTRO;
                if (rawType === 'bar') typeSelection = LocationType.BAR;
                else if (rawType === 'balada') typeSelection = LocationType.BALADA;
                else if (rawType === 'pub') typeSelection = LocationType.PUB;
                else if (rawType === 'restaurante') typeSelection = LocationType.RESTAURANTE;

                const { isOpen, hours } = determineOpenStatus(typeSelection);

                return {
                    id: row.id,
                    name: row.name || row.nome,
                    address: row.address || row.endereco,
                    type: typeSelection,
                    latitude: row.latitude,
                    longitude: row.longitude,
                    imageUrl: row.image_url || row.url_imagem,
                    verified: row.verified,
                    votesForVerification: row.votes_for_verification,
                    isOfficial: row.is_official,
                    ownerId: row.owner_id,
                    officialDescription: row.official_description,
                    instagram: row.instagram,
                    whatsapp: row.whatsapp,
                    stats: {
                        avgPrice: 0, avgCrowd: 0, avgGender: 0, avgVibe: 0, reviewCount: 0,
                        lastUpdated: new Date(),
                        ...(row.stats || {})
                    } as any,
                    isOpen,
                    openingHours: hours,
                    reviews: []
                };
            });
        } catch (rawErr: any) {
            console.error("[Supabase Vital] FATAL: Raw API Fallback also failed:", rawErr.message);
        }
    }

    // Increase radius to 100km for better global discoverability
    const nearbyDB = dbLocations.filter(l => {
        const d = calculateDistance(lat, lng, l.latitude, l.longitude);
        console.log(`[Supabase Vital] Distância para "${l.name}": ${d.toFixed(1)}m (Coords: ${l.latitude}, ${l.longitude} vs ${lat}, ${lng})`);
        return d < 100000;
    });
    console.log(`[Supabase Vital] RESULTADO FINAL: ${nearbyDB.length} locais encontrados.`);

    // --- PIVOT: COMMUNITY DRIVEN ONLY ---
    // We disabled external APIs (OSM, Photon, Foursquare) to rely 100% on user submissions.
    /* 
        const mergedLocations = [...nearbyDB];
        // External API logic removed for Community Driven Pivot
        */

    // ONLY RETURN USER GENERATED CONTENT (Supabase/Mock DB)
    return nearbyDB.map(loc => ({
        ...loc,
        distance: Math.round(calculateDistance(lat, lng, loc.latitude, loc.longitude))
    })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
};

export const createLocation = async (data: Omit<Location, 'id' | 'stats' | 'distance' | 'reviews' | 'verified' | 'votesForVerification' | 'isOpen' | 'openingHours'>): Promise<Location> => {
    const isOfficial = !!data.isOfficial;
    const isVerified = isOfficial;

    const defaultStats = {
        avgPrice: 0,
        avgCrowd: 0,
        avgGender: 0,
        avgVibe: 0,
        reviewCount: 0,
        lastUpdated: new Date().toISOString()
    };
    const finalImageUrl = data.imageUrl || DEFAULT_LOCATION_IMAGES[data.type] || DEFAULT_LOCATION_IMAGES[LocationType.OUTRO];
    const { isOpen, hours } = determineOpenStatus(data.type);

    try {
        console.log("[Supabase Diagnostic] Client Initialized:", !!supabase);
        const payload: any = {
            name: data.name,
            address: data.address,
            type: data.type, // Remove toLowerCase() to stay compatible with enum/switch cases
            latitude: data.latitude,
            longitude: data.longitude,
            image_url: finalImageUrl,
            verified: isVerified,
            is_official: isOfficial,
            stats: defaultStats,
            votes_for_verification: isVerified ? 10 : 0,
            owner_id: data.ownerId,
            official_description: data.officialDescription,
            instagram: data.instagram,
            whatsapp: data.whatsapp
        };

        console.log("[Supabase Diagnostic] Submitting payload:", payload);

        // Primary Supabase Insert with 30s Timeout Race
        const insertPromise = supabase.from('locations').insert(payload).select();
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Supabase Timeout")), 30000));

        let inserted = null;
        let error = null;

        try {
            const result: any = await Promise.race([insertPromise, timeoutPromise]);
            inserted = result.data;
            error = result.error;
        } catch (raceErr: any) {
            console.warn("[Supabase] Insert race failed or timed out:", raceErr.message);
            error = raceErr;
        }

        if (error || !inserted || inserted.length === 0) {
            console.warn("[Supabase] Performing Raw API Fallback...");

            // RAW API FALLBACK for Insert
            const baseUrl = (supabase as any).supabaseUrl || 'https://gwvnwsvaepxwjasdupks.supabase.co';
            const apiKey = (supabase as any).supabaseKey;

            if (apiKey) {
                try {
                    const rawResponse = await fetch(`${baseUrl}/rest/v1/locations`, {
                        method: 'POST',
                        headers: {
                            'apikey': apiKey,
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify(payload)
                    });

                    if (rawResponse.ok) {
                        const rawInserted = await rawResponse.json();
                        if (rawInserted && rawInserted.length > 0) {
                            const r = rawInserted[0];
                            console.log("[Supabase Vital] RAW API INSERT SUCCESS:", r.id);
                            return { ...data, imageUrl: finalImageUrl, id: r.id, verified: r.verified, votesForVerification: 0, stats: defaultStats as any, isOpen, openingHours: hours, reviews: [] };
                        }
                    } else {
                        console.error("[Supabase Fallback] Raw API failed:", rawResponse.status);
                    }
                } catch (fallbackErr) {
                    console.error("[Supabase Fallback] Error during raw fetch:", fallbackErr);
                }
            }

            throw error || new Error("Falha ao inserir local");
        }

        const res = inserted[0];
        console.log("Location created successfully:", res.id);
        return { ...data, imageUrl: finalImageUrl, id: res.id, verified: res.verified, votesForVerification: res.votes_for_verification, stats: (res.stats || defaultStats) as any, isOpen, openingHours: hours, reviews: [] };

    } catch (error) {
        console.error("Falha ao criar local (usando modo offline):", error);
        // Fallback para modo "offline/manual" para não travar o usuário
        return {
            ...data,
            imageUrl: finalImageUrl,
            id: `temp_manual_${Date.now()}`,
            verified: isVerified,
            votesForVerification: 0,
            stats: defaultStats as any,
            isOpen, openingHours: hours, reviews: []
        };
    }
};

export const verifyLocation = async (id: string): Promise<Location | null> => {
    if (id.startsWith('temp_')) return null;
    try {
        const { data: loc } = await supabase.from('locations').select('votes_for_verification, verified, type').eq('id', id).single();
        if (loc) {
            const newCount = (loc.votes_for_verification || 0) + 1;
            const newVerified = loc.verified || newCount >= 10;
            const { isOpen, hours } = determineOpenStatus(loc.type as LocationType);
            await supabase.from('locations').update({ votes_for_verification: newCount, verified: newVerified }).eq('id', id);
            triggerHaptic(20);
            return { ...loc, votesForVerification: newCount, verified: newVerified, isOpen, openingHours: hours } as any;
        }
    } catch (e) { console.warn(e); }
    return null;
}

export const claimBusiness = async (locationId: string, ownerId: string, details: any): Promise<boolean> => {
    if (locationId.startsWith('temp_')) return false;
    try {
        const { error } = await supabase.from('locations').update({
            is_official: true,
            verified: true,
            owner_id: ownerId,
            official_description: details.description,
            instagram: details.instagram,
            whatsapp: details.whatsapp
        }).eq('id', locationId);
        if (!error) {
            triggerHaptic([50, 100, 50]);
            return true;
        }
    } catch (e) { console.warn(e); }
    return false;
}

export const getReviewsForLocation = async (locationId: string): Promise<Review[]> => {
    if (locationId.startsWith('temp_')) return [];

    const user = getUserProfile();
    const blockedIds = user ? await getBlockedUsers(user.id) : [];

    try {
        const { data } = await supabase
            .from('reviews')
            .select('*')
            .eq('location_id', locationId)
            .order('created_at', { ascending: false });
        if (data) {
            const allReviews = data.map((r: any) => ({
                id: r.id,
                locationId: r.location_id,
                userId: r.user_id,
                userName: r.user_name,
                userAvatar: r.user_avatar,
                price: r.price ?? r.nota_preco ?? 0,
                crowd: r.crowd ?? r.nota_lotacao ?? 0,
                gender: r.gender ?? r.nota_genero ?? 0,
                vibe: r.vibe ?? r.nota_vibe ?? 0,
                comment: r.comment ?? r.comentario ?? '',
                createdAt: new Date(r.created_at)
            }));
            return allReviews.filter((r: Review) => !blockedIds.includes(r.userId));
        }
    } catch (e) { console.warn(e); }
    return [];
}

// ⚠️ ATENÇÃO: Esta função assume que você rodou o SQL de RESET do banco
export const submitReview = async (review: Review, locationContext?: Location): Promise<boolean> => {
    let finalLocationId = review.locationId;

    // 1. SYNC TEMP LOCATION
    if (review.locationId.startsWith('temp_')) {
        if (!locationContext) return false;
        try {
            // Simplificado: apenas tenta criar com colunas novas. Se falhar, é erro de banco.
            const payload = {
                name: locationContext.name,
                address: locationContext.address,
                type: locationContext.type,
                latitude: locationContext.latitude,
                longitude: locationContext.longitude,
                image_url: locationContext.imageUrl,
                verified: true,
                votes_for_verification: 10,
                stats: locationContext.stats
            };
            const { data: results, error: insertError } = await supabase.from('locations').insert(payload).select();
            if (!insertError && results && results.length > 0) {
                finalLocationId = results[0].id;
            } else {
                // Fallback para banco antigo
                const legacyPayload = { ...payload, nome: payload.name, endereco: payload.address, tipo: payload.type, url_imagem: payload.image_url };
                const { data: retry, error: retryError } = await supabase.from('locations').insert(legacyPayload).select();
                if (!retryError && retry && retry.length > 0) {
                    finalLocationId = retry[0].id;
                } else {
                    return false;
                }
            }
        } catch (e) { return false; }
    }

    // 2. SUBMIT REVIEW - DIRECT & SIMPLE
    // Apenas tenta inserir na tabela 'reviews'. Se falhar, é porque o usuário não rodou o SQL de fix.
    const payload = {
        location_id: finalLocationId,
        user_id: review.userId,
        user_name: review.userName,
        user_avatar: review.userAvatar,
        price: review.price || 0,
        crowd: review.crowd || 0,
        vibe: review.vibe || 0,
        gender: review.gender || 0,
        comment: review.comment || ''
    };

    try {
        const { error } = await supabase.from('reviews').insert(payload);

        if (error) {
            console.error("SQL Error on Insert:", error);
            console.warn(">> O USUÁRIO PRECISA RODAR O SCRIPT SQL DE RESET <<");
            alert("Erro de banco de dados. Por favor, execute o script SQL de correção.");
            return false;
        }

        // Success! Update stats
        await updateUserProgress(review.userId, 10);

        // Update aggregated stats on location
        const { data: allReviews } = await supabase.from('reviews').select('*').eq('location_id', finalLocationId);
        if (allReviews && allReviews.length > 0) {
            const count = allReviews.length;
            const avgCrowd = allReviews.reduce((acc: number, r: any) => acc + (r.crowd || 0), 0) / count;
            const avgVibe = allReviews.reduce((acc: number, r: any) => acc + (r.vibe || 0), 0) / count;
            const avgPrice = allReviews.reduce((acc: number, r: any) => acc + (r.price || 0), 0) / count;

            await supabase.from('locations').update({
                stats: { avgCrowd, avgVibe, avgPrice, reviewCount: count, lastUpdated: new Date() }
            }).eq('id', finalLocationId);
        }

        triggerHaptic([50, 50]);
        return true;

    } catch (e) {
        console.error(e);
        return false;
    }
};

export const getLeaderboard = async (scope: 'global' | 'friends' = 'global', currentUserId?: string): Promise<User[]> => {
    try {
        let query = supabase.from('profiles').select('*').order('points', { ascending: false });

        if (scope === 'friends' && currentUserId) {
            // Fetch friends first
            const friendsQuery = supabase
                .from('friendships')
                .select('*')
                .eq('status', 'accepted')
                .or(`requester_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);

            const friendsTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Friends Query Timeout")), 3000));

            const { data: friendships, error: friendError } = await Promise.race([friendsQuery, friendsTimeout]) as any;

            if (friendError) {
                console.error("[Leaderboard] Error fetching friends:", friendError);
                throw friendError; // Throw to trigger fallback
            }

            const friendIds = friendships?.map((f: any) => f.requester_id === currentUserId ? f.receiver_id : f.requester_id) || [];

            if (friendIds.length === 0) {
                // No friends found, return empty list (Leaderboard will show 'Invite friends' state)
                return [];
            }

            // Add current user to list so they see themselves in comparison
            friendIds.push(currentUserId);
            query = query.in('id', friendIds);
        } else {
            // Global scope
            query = query.limit(50); // Increased limit
        }

        // Execute query with a robust timeout (8s)
        const timeoutPromise = new Promise<{ data: null, error: any }>((_, reject) =>
            setTimeout(() => reject(new Error("Leaderboard Query Timeout")), 3000)
        );

        // Supabase query returns { data, error }
        const response: any = await Promise.race([query, timeoutPromise]);

        if (response.error) {
            console.error("[Leaderboard] Database error:", response.error);
            throw response.error;
        }

        if (response.data && response.data.length > 0) {
            return response.data.map((p: any) => ({
                ...p,
                badges: p.badges || [],
                favorites: p.favorites || [],
                // Ensure numeric values
                points: p.points || 0,
                level: p.level || 1
            }));
        }

        console.warn("[Leaderboard] returned empty list.");
        return [];

    } catch (e: any) {
        console.warn("[Leaderboard] Standard fetch failed/timed out, attempting Raw API Fallback...", e.message);

        try {
            // RAW API FALLBACK
            const baseUrl = (supabase as any).supabaseUrl || 'https://gwvnwsvaepxwjasdupks.supabase.co';
            const apiKey = (supabase as any).supabaseKey;

            if (!apiKey) throw new Error("No API Key available for fallback");

            if (!apiKey) throw new Error("No API Key available for fallback");

            let friendsIds: string[] = [];
            let authHeader = `Bearer ${apiKey}`; // Default to Anon Key (Safe for Public Global)

            if (scope === 'friends' && currentUserId) {
                // FALLBACK FOR FRIENDS: Needs User Token
                try {
                    // SAFETY: Wrap getSession in timeout so we don't hang if Auth client is sick too
                    const sessionPromise = supabase.auth.getSession();
                    const timeoutPromise = new Promise<{ data: { session: any } }>((_, reject) => setTimeout(() => reject(new Error("Auth Timeout")), 2000));

                    const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);

                    if (session?.access_token) {
                        authHeader = `Bearer ${session.access_token}`;
                    } else {
                        console.warn("[Leaderboard Fallback] No session found, cannot fetch private friends.");
                        return [];
                    }
                } catch (authErr) {
                    console.warn("[Leaderboard Fallback] Auth check failed/timed out. Aborting friend fetch.");
                    return [];
                }

                // 1. Get Friendships
                const friendshipsUrl = `${baseUrl}/rest/v1/friendships?select=*&status=eq.accepted&or=(requester_id.eq.${currentUserId},receiver_id.eq.${currentUserId})`;
                console.log("[Leaderboard Fallback] Fetching Friendships URL:", friendshipsUrl);

                const fResponse = await fetch(friendshipsUrl, {
                    headers: {
                        'apikey': apiKey,
                        'Authorization': authHeader
                    }
                });

                if (fResponse.ok) {
                    const friendships = await fResponse.json();
                    console.log(`[Leaderboard Fallback] Found ${friendships.length} raw friendships via API.`);

                    friendsIds = friendships.map((f: any) => f.requester_id === currentUserId ? f.receiver_id : f.requester_id);
                    friendsIds.push(currentUserId); // Add self
                } else {
                    console.error(`[Leaderboard Fallback] Failed to fetch friendships. Status: ${fResponse.status}`);
                    return [];
                }

                if (friendsIds.length === 0) {
                    console.warn("[Leaderboard Fallback] No friend IDs extracted. Returning empty list.");
                    return [];
                }
            }

            let url = `${baseUrl}/rest/v1/profiles?select=*&order=points.desc`;

            if (scope === 'friends' && currentUserId) {
                if (friendsIds.length > 0) {
                    url += `&id=in.(${friendsIds.join(',')})`;
                }
            } else {
                url += '&limit=50';
            }

            console.log("[Leaderboard Fallback] Fetching Profiles URL:", url);

            const fetchPromise = fetch(url, {
                headers: {
                    'apikey': apiKey,
                    'Authorization': authHeader
                }
            });

            // 10s Timeout for Raw API
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("Raw API Timeout")), 10000)
            );

            const response = await Promise.race([fetchPromise, timeoutPromise]);

            if (!response.ok) throw new Error(`Raw API HTTP Error: ${response.status}`);

            const rawData = await response.json();
            console.log(`[Leaderboard] RAW API SUCCESS: ${rawData.length} users loaded.`);

            return rawData.map((p: any) => ({
                ...p,
                badges: p.badges || [],
                favorites: p.favorites || [],
                points: p.points || 0,
                level: p.level || 1
            }));

        } catch (rawErr: any) {
            console.error("[Leaderboard] FATAL: Raw API Fallback also failed:", rawErr.message);
            // LOAD CACHE ON FATAL ERROR
            const cached = localStorage.getItem(`dirole_leaderboard_${scope}_${currentUserId || 'anon'}`);
            if (cached) return JSON.parse(cached);

            // Fallback: Show at least the current user from local storage
            const localUser = getUserProfile();
            return localUser ? [localUser] : [];
        }
    }
};

export const generateMockActivity = (): ActivityFeedItem | null => { return null; };
export const getEventsForLocation = async (location: Location): Promise<LocationEvent[]> => { return []; };
export const getGalleryForLocation = async (locationId: string): Promise<GalleryItem[]> => { return []; };
export const submitReport = async (report: Report): Promise<boolean> => {
    try { await supabase.from('reports').insert({ target_id: report.targetId, target_type: report.targetType, reason: report.reason, details: report.details, reporter_id: report.reporterId }); return true; } catch (e) { return true; }
};
