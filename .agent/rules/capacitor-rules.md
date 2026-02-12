# Capacitor Rules

> Guidelines for Developing with Capacitor in the Dirole App.

## 📱 Core Principles

- **Native First**: Prefer Capacitor native plugins over browser APIs for mobile-specific features (Geolocation, Camera, Haptics).
- **Deep Link Integrity**: Ensure deep links (custom schemes and App Links) are handled robustly in `App.tsx`.
- **Permission Management**: Always check and request permissions using Capacitor plugins before accessing protected resources.

## 🛠️ Code Patterns

### Geolocation
Use `@capacitor/geolocation` for high-accuracy tracking.
```typescript
import { Geolocation } from '@capacitor/geolocation';
const coordinates = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
```

### Deep Links
Handle `appUrlOpen` events globally.
```typescript
import { App } from '@capacitor/app';
App.addListener('appUrlOpen', data => {
  const url = new URL(data.url);
  // Handle routes...
});
```

### Browser Interaction
Use `@capacitor/browser` for OAuth flows to ensure better user UX than standard popups.

---

## 🛑 Critical Restrictions

- **No process.env**: Use `import.meta.env` for Vite compatibility.
- **No window.alert**: Use a toast system or `@capacitor/dialog`.
- **Haptic Feedback**: High-value actions (buttons, success, error) MUST trigger `Haptics.impact()`.
