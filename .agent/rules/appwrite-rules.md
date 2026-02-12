# Appwrite Rules

> Guidelines for Integrating Appwrite in the Dirole App.

## 🔑 Authentication

- **Session Management**: Use `account.getSession('current')` to verify auth state.
- **OAuth Handling**: Always specify a custom redirect URL that matches the Capacitor deep link scheme (e.g., `com.dirole.app://oauth/callback`).
- **Safe Logout**: Always clear local cache and state upon `account.deleteSession('current')`.

## 📊 Database (Firestore-like)

- **ID Consistency**: Use consistent naming for collection and database IDs from `constants.ts`.
- **Query Optimization**: Use `@appwrite.Query` filters to minimize data transfer.
- **Permissions**: Respect Document Level Permissions; don't assume admin access in the frontend.

## ⚡ Realtime

- **Subscription Lifecycle**: Manage WebSocket subscriptions carefully. Subscribe in `useEffect` and ALWAYS return the unsubscribe function.
- **Race Conditions**: Handle rapid state updates from subscriptions to avoid UI flickering.

---

## 🛑 Critical Restrictions

- **No Hardcoded Secrets**: Never commit Project IDs or API Keys directly; use environment variables.
- **Error Handling**: Every Appwrite call MUST be wrapped in a try/catch block with descriptive user-facing error messages.
