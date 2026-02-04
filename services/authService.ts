import { ID, OAuthProvider } from 'appwrite';
import { account, databases, APPWRITE_DATABASE_ID, APPWRITE_PROJECT_ID } from './appwriteClient';

export const signUpWithEmail = async (email: string, pass: string, name: string) => {
    try {
        // Delete any existing session (e.g., guest session) before creating new account
        try {
            await account.deleteSession('current');
            console.log('[Auth] Deleted existing session before signup');
        } catch (e) {
            // No session to delete, continue
            console.log('[Auth] No existing session to delete');
        }

        const user = await account.create(ID.unique(), email, pass, name);
        await account.createEmailPasswordSession(email, pass);
        return user;
    } catch (e: any) {
        throw e;
    }
};

export const signInWithEmail = async (email: string, pass: string) => {
    try {
        return await account.createEmailPasswordSession(email, pass);
    } catch (e: any) {
        throw e;
    }
};

export const signInWithGoogle = async () => {
    try {
        console.log("[Auth] Initiating Google login...");
        console.log("[Auth] Current Project ID:", APPWRITE_PROJECT_ID);

        const { Capacitor } = await import('@capacitor/core');
        const isNative = Capacitor.isNativePlatform();

        console.log("[Auth] Is Native Platform:", isNative);

        let redirectUrl = window.location.origin;
        if (isNative) {
            redirectUrl = 'dirole://auth/callback';
            console.log("[Auth] Native detected, using Deep Link:", redirectUrl);
        }

        // DEBUG: Remover em produção
        alert(`Debug Auth:\nÉ Nativo? ${isNative}\nURL: ${redirectUrl}`);

        // Redireciona para o Google OAuth do Appwrite
        // successUrl = redirectUrl, failureUrl = redirectUrl
        return account.createOAuth2Session('google' as any, redirectUrl, redirectUrl);
    } catch (e: any) {
        throw e;
    }
};

export const signOut = async () => {
    try {
        await account.deleteSession('current');
        localStorage.removeItem('dirole_user_profile');
        window.location.reload();
    } catch (e: any) {
        console.error("Logout failed:", e);
    }
};

export const sendVerificationEmail = async () => {
    try {
        // Redireciona de volta para o app, assumindo rota raiz.
        // O Appwrite anexará ?secret=...&userId=...
        const redirectUrl = window.location.origin;
        await account.createVerification(redirectUrl);
        return true;
    } catch (e: any) {
        console.error("Error sending verification email:", e);
        throw e;
    }
};

export const verifyEmail = async (userId: string, secret: string) => {
    try {
        await account.updateVerification(userId, secret);
        return true;
    } catch (e: any) {
        console.error("Error verifying email:", e);
        throw e;
    }
};

export const getCurrentSession = async () => {
    try {
        const user = await account.get();
        return {
            userId: user.$id,
            email: user.email,
            name: user.name,
            emailVerification: user.emailVerification // Adicionado
        };
    } catch (e) {
        return null;
    }
};

