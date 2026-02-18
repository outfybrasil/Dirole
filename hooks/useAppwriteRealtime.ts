import { useEffect, useRef } from 'react';
import { client, APPWRITE_DATABASE_ID } from '../services/mockService';
import { getUserProfile } from '../services/mockService';
import { User } from '../types';

interface UseAppwriteRealtimeProps {
    currentUser: User | null;
    setCurrentUser: (user: User | null) => void;
    playNotificationSound: () => void;
    triggerHaptic: () => void;
    addToast: (toast: any) => void;
    sendLocalNotification: (title: string, message: string) => void;
    setIsNotificationsModalOpen: (val: boolean) => void;
    fetchNotificationCount: (userId: string) => Promise<void>;
}

export const useAppwriteRealtime = ({
    currentUser,
    setCurrentUser,
    playNotificationSound,
    triggerHaptic,
    addToast,
    sendLocalNotification,
    setIsNotificationsModalOpen,
    fetchNotificationCount,
}: UseAppwriteRealtimeProps) => {
    const unsubscribeRef = useRef<(() => void) | null>(null);
    const isSubscribingRef = useRef(false);

    useEffect(() => {
        if (!currentUser || currentUser.id.startsWith('guest_')) {
            return;
        }

        if (isSubscribingRef.current) {
            return;
        }

        isSubscribingRef.current = true;

        const subscriptionTimeout = setTimeout(() => {
            try {
                const unsubscribeFriendships = client.subscribe(
                    `databases.${APPWRITE_DATABASE_ID}.collections.friendships.documents`,
                    (response: any) => {
                        const payload = response.payload;
                        const events = response.events || [];

                        const isCreate = events.some((e: string) => e.includes('.create'));
                        const isUpdate = events.some((e: string) => e.includes('.update'));
                        const isForMe = payload.receiver_id === currentUser.id;
                        const iSentIt = payload.requester_id === currentUser.id;
                        const isPending = payload.status === 'pending';
                        const isAccepted = payload.status === 'accepted';

                        if (isCreate && isForMe && isPending) {
                            playNotificationSound();
                            triggerHaptic();
                            addToast({
                                title: 'Novo Convite! 📩',
                                message: 'Alguém quer ser seu amigo no Dirole.',
                                type: 'info'
                            });
                            sendLocalNotification('🔔 Novo Convite!', 'Você recebeu um novo pedido de amizade!');
                            fetchNotificationCount(currentUser.id);
                        }

                        if (isUpdate && iSentIt && isAccepted) {
                            playNotificationSound();
                            triggerHaptic();
                            addToast({
                                title: 'Convite Aceito! 🤝',
                                message: 'Vocês agora são amigos! Bora dominar o mapa.',
                                type: 'success'
                            });
                            sendLocalNotification('🤝 Amizade Confirmada!', 'Seu convite de amizade foi aceito!');
                            const updated = getUserProfile();
                            if (updated) setCurrentUser(updated);
                        }
                    }
                );

                const unsubscribeInvites = client.subscribe(
                    `databases.${APPWRITE_DATABASE_ID}.collections.invites.documents`,
                    (response: any) => {
                        const payload = response.payload;
                        const events = response.events || [];
                        const isCreate = events.some((e: string) => e.includes('.create'));
                        const isUpdate = events.some((e: string) => e.includes('.update'));

                        if (isCreate && payload.to_user_id === currentUser.id) {
                            playNotificationSound();
                            triggerHaptic();
                            addToast({
                                title: 'Chamado pro Rolê! 🍻',
                                message: `Convite para ${payload.location_name || 'um local'}.`,
                                type: 'info',
                                actionLabel: 'Ver',
                                action: () => setIsNotificationsModalOpen(true)
                            });
                            sendLocalNotification('🍻 Chamado pro Rolê!', 'Você foi convidado para sair!');
                        }

                        if (isUpdate && payload.from_user_id === currentUser.id && payload.status === 'accepted') {
                            playNotificationSound();
                            triggerHaptic();
                            addToast({
                                title: 'Confirmado! 🚀',
                                message: 'Seu convite para o rolê foi aceito.',
                                type: 'success'
                            });
                            sendLocalNotification('🚀 Confirmado!', 'Seu convite para o rolê foi aceito.');
                        }
                    }
                );

                unsubscribeRef.current = () => {
                    try {
                        unsubscribeFriendships();
                        unsubscribeInvites();
                    } catch (err) {
                        console.warn('[Realtime] Error during unsubscribe:', err);
                    }
                };

                isSubscribingRef.current = false;

            } catch (err) {
                console.error('[Realtime] Subscription failed:', err);
                isSubscribingRef.current = false;
            }
        }, 100);

        if (currentUser?.id) {
            fetchNotificationCount(currentUser.id);
        }

        return () => {
            clearTimeout(subscriptionTimeout);
            isSubscribingRef.current = false;
            if (unsubscribeRef.current) {
                try {
                    unsubscribeRef.current();
                } catch (err) {
                    console.warn('[Realtime] Error during cleanup on unmount:', err);
                }
                unsubscribeRef.current = null;
            }
        };
    }, [currentUser?.id, fetchNotificationCount, playNotificationSound, triggerHaptic, addToast, sendLocalNotification, setIsNotificationsModalOpen, setCurrentUser]);
};
