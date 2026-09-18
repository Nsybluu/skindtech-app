# SKINDTECH app API setup

The app sends a captured or selected face photo to the Express API.

1. Copy `.env.example` to `.env`.
2. Replace `YOUR_MAC_LAN_IP` with the Mac's LAN address, for example `192.168.1.20`.
3. Start the AI service on port 8000 and the Express API on port 3000.
4. Start Expo with `npm start`.

## Offline demo fallback

`EXPO_PUBLIC_SCAN_FALLBACK` decides what happens when the API is unreachable:

- `mock` (default) — the sample moderate-acne result, labelled "Demo data"
- `clear` — the sample no-visible-acne result, labelled the same way
- `off` — the real "Analysis failed" screen

Demo results are always badged in the UI and never presented as model output.
Set it to `off` when testing the real failure path.

`localhost` works in an iOS simulator. A physical phone must use the Mac's LAN address and be connected to the same network.
