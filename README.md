# HarborHub — Innovation og ny teknologi (BA-BINTO1055U) 2025/2026

HarborHub er en mobil applikation (tosidet platform), der forbinder **bådejere** og **mekanikere/værfter** gennem et samlet flow for **opgaveopslag → bud → sammenligning → booking**. Formålet er at reducere friktion, skabe gennemsigtighed og standardisere den ellers fragmenterede kommunikation i maritime serviceforløb.

## 🔗 Links
- **GitHub Repository:** [GustavDegn123/HarborHub](https://github.com/GustavDegn123/HarborHub)
- **YouTube Demo:** [Se præsentationen her](https://www.youtube.com/watch?v=erPHoFVrvT0)

---

## 👥 Projektgruppe & Vejledere

### Deltagere
* **Gustav Weirum Dalgaard** — 169387
* **Gustav Nikolai Degn** — 168803
* **Frederik Haxthausen Skotte** — 168935

### Vejledere
Lars Kaa Andersen, Jan Damsgaard, Sofie Jegind Christensen & Ida Husted Davidsen

### Eksamen
Mundtlig prøve på baggrund af skriftligt produkt (gruppeopgave + individuel mundtlig præstation).

---

## ⚓ Kerneidé og Brugerflow

Platformen understøtter to primære brugerroller:

* **Bådejer (Demand-side):** Kan oprette serviceopgaver med beskrivelse, billeder og lokation. Ejeren modtager efterfølgende bud fra verificerede udbydere og kan vælge/booke direkte i appen.
* **Mekaniker/Værft (Supply-side):** Kan gennemse relevante opgaver i nærheden via filtrering og afgive konkurrencedygtige bud på opgaverne.

---

## 🚀 Sådan kører du projektet lokalt

### 1. Forudsætninger
Før du starter, skal du have følgende installeret:
- [Node.js](https://nodejs.org/)
- [Git](https://git-scm.com/)
- **Expo Go** appen på din smartphone og/eller:
  - **Xcode** (til iOS Simulator)
  - **Android Studio** (til Android Emulator)

### 2. Installation
Klon repositoryet og installer de nødvendige dependencies:

```bash
# Klon projektet
git clone [https://github.com/GustavDegn123/HarborHub](https://github.com/GustavDegn123/HarborHub)

# Gå ind i mappen
cd HarborHub

# Installer pakker
npm install

3. Konfiguration (.env)
Projektet kræver opsætning af miljøvariabler for at fungere med eksterne tjenester (Firebase, Stripe, Criipto). Opret en fil i rodmappen med navnet .env og indsæt følgende nøgler:

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

4. Start appen
Når installationen og konfigurationen er på plads, kan du starte Expo:
npm start
Android: Scan QR-koden i terminalen med Expo Go appen.
iOS: Scan QR-koden med dit kamera eller tryk i i terminalen for at åbne simulatoren.