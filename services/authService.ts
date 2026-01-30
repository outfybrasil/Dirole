import { ID, OAuthProvider } from 'appwrite';
import { account, databases, APPWRITE_DATABASE_ID } from './appwriteClient';

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
        // Redireciona para o Google OAuth do Appwrite
        return account.createOAuth2Session(OAuthProvider.Google, window.location.origin, window.location.origin);
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

export const getCurrentSession = async () => {
    try {
        const user = await account.get();
        return {
            userId: user.$id,
            email: user.email,
            name: user.name
        };
    } catch (e) {
        return null;
    }
};

