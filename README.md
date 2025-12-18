# HarborHub — Innovation og ny teknologi (BA-BINTO1055U) 2025/2026

HarborHub er en mobil applikation (tosidet platform), der forbinder **bådejere** og **mekanikere/værfter** gennem et samlet flow for **opgaveopslag → bud → sammenligning → booking → (betaling)**. Formålet er at reducere friktion, skabe gennemsigtighed og standardisere den ellers fragmenterede kommunikation i maritime serviceforløb.

## Links
- GitHub: https://github.com/GustavDegn123/HarborHub  
- YouTube-demo: https://www.youtube.com/watch?v=erPHoFVrvT0  

---

## Projektinfo

### Navne og studienumre
- Gustav Weirum Dalgaard — 169387  
- Gustav Nikolai Degn — 168803  
- Frederik Haxthausen Skotte — 168935  

### Vejledere
Lars Kaa Andersen, Jan Damsgaard, Sofie Jegind Christensen & Ida Husted Davidsen  

### Eksamen
Mundtlig prøve på baggrund af skriftligt produkt (gruppeopgave + individuel mundtlig præstation).

---

## Kerneidé og brugerflow

### Roller
- **Bådejer (Demand-side):** Opretter serviceopgave, vedhæfter billeder, angiver lokation, modtager bud og vælger/booker.
- **Mekaniker/Værft (Supply-side):** Ser relevante opgaver, filtrerer og afgiver bud.

---

## Sådan kører du projektet lokalt

### 1) Forudsætninger
- Node.js (LTS anbefales)
- Git
- **Expo Go** (på telefon) og/eller:
  - Xcode (iOS) til iOS Simulator
  - Android Studio (Android) til emulator

### 2) Installation
```bash
git clone https://github.com/GustavDegn123/HarborHub
cd HarborHub
npm install

### 3) Installation
```bash
npm start

### 4) Konfiguration (.env)
    - Opret en .env (eller tilsvarende) i roden af projektet.
    - Eksempel:
    EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=
EXPO_PUBLIC_CRIIPTO_DOMAIN=
EXPO_PUBLIC_CRIIPTO_CLIENT_ID=
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=
EXPO_PUBLIC_SENTRY_DSN=
EXPO_PUBLIC_SENTRY_ENV=

