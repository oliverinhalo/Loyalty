# LoyaltyCard — React Native App

Android app for the LoyaltyCard system. Uses NFC to read/write cards.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure your server
Edit `config.ts`:
```ts
export const BASE_URL = "http://jacobsloyalty.duckdns.org:5000";
export const API_KEY  = "your-secret-key";   // must match docker-compose.yml
```

### 3. Build the APK

You need an Expo account (free) and EAS CLI:
```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

EAS builds in the cloud — you don't need Android Studio.
When it finishes, you get a download link for the APK.
Transfer it to your phone and install it (enable "Install unknown apps" in Android settings first).

---

## How it works

**Customer taps card** → sees balance only, no management options.

**Staff flow:**
1. Open app → tap "Staff Login" → enter 4-digit PIN
2. Staff mode unlocks: scan card → full management (add, remove, set, reset, history)
3. "Create New Card" button → generates ID → registers with server → writes to blank NFC tag

**PIN setup:** on first launch the app asks you to set a 4-digit staff PIN.
It's stored locally on the device in AsyncStorage.

---

## NFC cards
Use NTAG213, NTAG215, or NTAG216 sticker tags (cheaply available on Amazon).
The app writes a plain text NDEF record containing just the card ID.
