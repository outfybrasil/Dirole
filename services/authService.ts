import { ID, OAuthProvider } from 'appwrite';
import { account, databases, APPWRITE_DATABASE_ID, APPWRITE_PROJECT_ID, APPWRITE_ENDPOINT } from './appwriteClient';
export { account };

export const signUpWithEmail = async (email: string, pass: string, name: string) => {
    try {
        // Delete any existing session before creating new account
        try {
            await account.deleteSession('current');
        } catch (e) {
            // Ignore if no session
        }

        const user = await account.create(ID.unique(), email, pass, name);
        await account.createEmailPasswordSession(email, pass);
        console.log('[Auth] Sign up successful for:', email);
        return user;
    } catch (e: any) {
        console.error('[Auth] Sign up error:', e.message || e);
        throw e;
    }
};

export const signInWithEmail = async (email: string, pass: string) => {
    try {
        const session = await account.createEmailPasswordSession(email, pass);
        console.log('[Auth] Sign in successful');
        return session;
    } catch (e: any) {
        console.error('[Auth] Sign in error:', e.message || e);
        throw e;
    }
};

export const signInWithGoogle = async () => {
    try {
        const { Capacitor } = await import('@capacitor/core');
        const isNative = Capacitor.isNativePlatform();

        if (isNative) {
            const { Browser } = await import('@capacitor/browser');
            try { await account.deleteSession('current'); } catch (e) { }

            // Use Native Appwrite Callback Scheme
            // This forces Appwrite to return userId and secret in the URL headers/params
            const successUrl = `appwrite-callback-${APPWRITE_PROJECT_ID}://auth`;
            const failureUrl = `appwrite-callback-${APPWRITE_PROJECT_ID}://error`;
            const oauthUrl = `${APPWRITE_ENDPOINT}/account/tokens/oauth2/google?project=${APPWRITE_PROJECT_ID}&success=${encodeURIComponent(successUrl)}&failure=${encodeURIComponent(failureUrl)}&platform=com.dirole.app`;

            console.log('[Auth] Opening OAuth browser flow with HTTPS bridge');
            await Browser.open({ url: oauthUrl, windowName: '_blank' });

            return new Promise((resolve, reject) => {
                const checkSession = setInterval(async () => {
                    try {
                        const session = await account.get();
                        if (session) {
                            clearInterval(checkSession);
                            console.log('[Auth] Session polling successful');
                            resolve(session);
                        }
                    } catch (e) {
                        // Polling...
                    }
                }, 1000);

                setTimeout(() => {
                    clearInterval(checkSession);
                    console.log('[Auth] Session polling timeout');
                }, 120000);
            });
        } else {
            let redirectUrl = window.location.origin;
            try { await account.deleteSession('current'); } catch (e) { }
            console.log('[Auth] Redirecting to Google OAuth (Web)');
            return account.createOAuth2Session('google' as any, redirectUrl, redirectUrl);
        }
    } catch (e: any) {
        console.error("[Auth] Google Sign-in initialization error:", e);
        throw e;
    }
};

export const signOut = async () => {
    try {
        await account.deleteSession('current');
        localStorage.removeItem('dirole_user_profile');
        console.log('[Auth] Logout successful');
        window.location.reload();
    } catch (e: any) {
        console.error("[Auth] Logout failed:", e);
    }
};

export const sendVerificationEmail = async () => {
    try {
        const redirectUrl = 'https://dirole.appwrite.network/auth-redirect.html?type=verify';
        await account.createVerification(redirectUrl);
        console.log('[Auth] Verification email sent');
        return true;
    } catch (e: any) {
        console.error("[Auth] Error sending verification email:", e);
        throw e;
    }
};

export const verifyEmail = async (userId: string, secret: string) => {
    try {
        await account.updateVerification(userId, secret);
        console.log('[Auth] Email verified successfully');
        return true;
    } catch (e: any) {
        console.error("[Auth] Error verifying email:", e);
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
            emailVerification: user.emailVerification
        };
    } catch (e) {
        return null;
    }
};
