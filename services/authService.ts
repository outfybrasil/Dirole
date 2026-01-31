import { ID, OAuthProvider } from 'appwrite';
import { account, databases, APPWRITE_DATABASE_ID, APPWRITE_PROJECT_ID } from './appwriteClient';

export const signUpWithEmail = async (email: string, pass: string, name: string) => {
    try {
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
        console.log("[Auth] Provider used: google (hardcoded)");
        // Redireciona para o Google OAuth do Appwrite
        return account.createOAuth2Session('google' as any, window.location.origin, window.location.origin);
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

