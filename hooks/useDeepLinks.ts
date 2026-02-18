import { useEffect, useRef } from 'react';
import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { account, verifyEmail } from '../services/authService';

interface UseDeepLinksProps {
    addToast: (toast: { title: string; message: string; type: 'success' | 'error' | 'info' | 'system' }) => void;
}

export const useDeepLinks = ({ addToast }: UseDeepLinksProps) => {
    const isProcessingDeepLink = useRef(false);

    useEffect(() => {
        let appListener: any = null;

        const setupDeepLinks = async () => {
            appListener = await CapApp.addListener('appUrlOpen', async (data) => {
                // Force close the in-app browser when a deep link is received
                try {
                    await Browser.close();
                } catch (e) {
                    /* ignore if not open */
                }

                if (isProcessingDeepLink.current) {
                    console.log('Deep link ignored (already processing)');
                    return;
                }
                isProcessingDeepLink.current = true;

                try {
                    const url = new URL(data.url);

                    // Handle OAuth Callback (Google)
                    // Supports 'appwrite-callback-[PROJECT_ID]://auth' (Standard)
                    // and legacy 'dirole://oauth/callback'
                    const isOAuthCallback =
                        url.protocol.startsWith('appwrite-callback-') ||
                        url.host === 'oauth' ||
                        url.pathname.includes('oauth/callback');

                    if (isOAuthCallback) {
                        console.log('[Deep Link] OAuth callback received', url.toString());

                        // Check if there's an error parameter
                        const hasError = url.searchParams.has('error');

                        if (hasError) {
                            addToast({
                                title: "Erro no Login",
                                message: "Autenticação cancelada ou falhou.",
                                type: 'error'
                            });
                            isProcessingDeepLink.current = false;
                            return;
                        }

                        // Try to get userId and secret from URL (Search Params OR Hash)
                        let userId = url.searchParams.get('userId');
                        let secret = url.searchParams.get('secret');

                        // If not in search params, check the hash
                        if (!userId && !secret && url.hash) {
                            const hashParams = new URLSearchParams(url.hash.substring(1));
                            userId = hashParams.get('userId');
                            secret = hashParams.get('secret');
                        }

                        // DIAGNOSTIC CHECK
                        if (!userId || !secret) {
                            console.error('[Deep Link] Missing OAuth params', { url: url.href, userId, secret });
                            addToast({
                                title: "Erro no Login",
                                message: "Dados de autenticação incompletos. Tente novamente.",
                                type: 'error'
                            });
                            isProcessingDeepLink.current = false;
                            return;
                        }

                        // DEBUG: Toast params
                        addToast({
                            title: "Validando Sessão...",
                            message: `Processando login...`,
                            type: 'info'
                        });

                        if (userId && secret) {
                            console.log('[Deep Link] Creating session with params');
                            try {
                                // Race Condition Fix: Check if we already have a session
                                try {
                                    const current = await account.get();
                                    if (current) {
                                        console.log('[Deep Link] Already logged in, skipping creation.');
                                        addToast({ title: "Já conectado! 👍", message: "Sessão ativa encontrada.", type: "success" });
                                        isProcessingDeepLink.current = false;
                                        return;
                                    }
                                } catch (e) {
                                    // No session, proceed
                                }

                                await account.createSession(userId, secret);
                                addToast({
                                    title: "Login Sucesso! 🚀",
                                    message: "Bem-vindo ao Dirole!",
                                    type: 'success'
                                });
                                // Delay reload slightly to show success message
                                setTimeout(() => window.location.reload(), 1000);
                            } catch (error: any) {
                                console.error('[Deep Link] Session creation failed:', error);
                                // If error 401, it might mean the secret is expired OR we are already logged in (context dependent)
                                // But if we are already logged in, the previous check should have caught it.
                                // If secret is invalid, we really failed.
                                addToast({
                                    title: "Erro no Login",
                                    message: error.message || "Falha ao criar sessão.",
                                    type: 'error'
                                });
                                isProcessingDeepLink.current = false;
                            }
                        }
                    }

                    // Handle Email Verification
                    else if (url.pathname.includes('verify-email') || url.host === 'verify-email') {
                        const userId = url.searchParams.get('userId');
                        const secret = url.searchParams.get('secret');

                        if (userId && secret) {
                            try {
                                await verifyEmail(userId, secret);
                                addToast({
                                    title: "E-mail Verificado! ✅",
                                    message: "Sua conta foi ativada com sucesso.",
                                    type: 'success'
                                });
                                setTimeout(() => window.location.reload(), 1500);
                            } catch (error: any) {
                                addToast({
                                    title: "Erro na Verificação",
                                    message: "Link inválido ou expirado.",
                                    type: 'error'
                                });
                                isProcessingDeepLink.current = false;
                            }
                        } else {
                            isProcessingDeepLink.current = false;
                        }
                    } else {
                        isProcessingDeepLink.current = false;
                    }

                } catch (e: any) {
                    console.error('Deep link error:', e);
                    addToast({
                        title: "Erro Deep Link",
                        message: "Falha ao processar link: " + (e.message || JSON.stringify(e)),
                        type: 'error'
                    });
                    isProcessingDeepLink.current = false;
                }
            });
        };

        setupDeepLinks();

        return () => {
            if (appListener) {
                appListener.remove();
            }
        };
    }, [addToast]);

    // Handle Web Fallback for Verification
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('userId');
        const secret = urlParams.get('secret');

        if (userId && secret) {
            verifyEmail(userId, secret)
                .then(() => {
                    window.history.replaceState({}, '', window.location.pathname);
                    addToast({
                        title: "Sucesso! 🎉",
                        message: "E-mail verificado com sucesso! Você pode usar o app agora.",
                        type: 'success'
                    });
                    setTimeout(() => window.location.reload(), 2000);
                })
                .catch((err) => {
                    console.warn("Web verification check failed", err);
                });
        }

        const errorParam = urlParams.get('error');
        if (errorParam) {
            try {
                const errorObj = JSON.parse(errorParam);
                addToast({
                    title: "Erro de Autenticação",
                    message: errorObj.message || "Ocorreu um problema ao entrar.",
                    type: 'error'
                });
            } catch (e) {
                addToast({
                    title: "Erro",
                    message: errorParam,
                    type: 'error'
                });
            }
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [addToast]);
};
