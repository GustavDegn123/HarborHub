HarborHub ⚓ (GK2)

HarborHub er en React Native–MVP, der matcher bådejere med maritime serviceudbydere via gennemsigtig budgivning, booking og betaling.
Denne version er udviklet til Godkendelsesopgave 2 (Innovation, CBS) med fokus på anden runde brugerinddragelse og en funktionel MVP.

Demovideo: https://www.youtube.com/watch?v=CdDviwTYs-4

# Klon repo
git clone https://github.com/GustavDegn123/HarborHub.git
cd HarborHub

# Installér afhængigheder
npm install

# (Valgfrit) Opret env-konfig
cp .env.example .env
# Udfyld dine Firebase-nøgler eller indsæt direkte i firebase.js

# Start (Expo)
npm start
# Scan QR i Expo Go (iOS/Android) eller tryk i/a/w for iOS/Android/Web


4. Få helt styr på styles og logik i filer 
Notifikationer på appen (Virker med bud på jobs) Ongoing 
5. Tilføjer ikke den oprettede båd med det samme
6. Skifter ikke profilbillede med det samme
4. Mail med ordre bekræftelse
10. Facebook + Google
11. Optimere UI
12. Optimere koden generelt med styles osv
13. Flere Services-filer
14. E-mail sendes videre når man har bekræftet



A) Minimum for at komme i App Store

Udvikling

VS Code (editor)

Node.js + Yarn/PNPM

Expo CLI (React Native via Expo)

Xcode (iOS-simulator & signing)

Android Studio (Android-emulator til test)

Kildekode & build

Git + GitHub (eller GitLab/Bitbucket)

Expo EAS (cloud builds, eas build + eas submit)

Apple & udgivelse

Apple Developer Program (kontoen)

App Store Connect (opret appen, screenshots, metadata)

Backend (det I har / hurtigst i mål)

Firebase Console

Firebase Auth (login)

Firestore (data)

Cloud Storage (billeder)

Cloud Functions (webhooks, jobs)

Stripe (betalinger + evt. Connect)

Criipto (MitID)

Konfiguration/hemmeligheder

Firebase CLI

Stripe CLI (lokal test af webhooks)

EAS Secrets (eller .env til lokalt)

Kvalitet

ESLint + Prettier

Jest + React Native Testing Library (basis tests)

Sentry (crash reports)

Expo Notifications (push)

B) Anbefalet til drift/skalering (når I vokser)

Infra & tjenester

Docker (byg API’er/cron-jobs som containere)

Google Cloud Run eller AWS Fargate (kør services serverless)

Cloud SQL (PostgreSQL) til finans/rapporter

Redis (Memorystore/ElastiCache) til cache/queues

Cloud Pub/Sub eller AWS SQS (asynkrone opgaver)

Cloudflare (WAF, rate limiting, CDN)

Data/indsigt

Amplitude eller Mixpanel (produkt-analytics)

BigQuery/Redshift (senere: rapportering)

Algolia/Typesense (hurtig søgning)

DevOps

GitHub Actions (CI), evt. sammen med EAS

Terraform (IaC til Cloud Run/SQL/Redis)

Secrets Manager (GCP/AWS) til nøgler

-----

1) App Store-krav (skal være på plads)

Apple Developer-konto + App Store Connect app-post.

Ikon, navn, beskrivelse, keywords, Aldersgrænse, Kategori.

Screenshots (min. iPhone 6.7" + 5.5", helst flere sprog hvis du lokaliserer).

Privacy Policy URL + Support URL + (helst) Terms of Service URL.

App Privacy (”nutrition label”): alt data du indsamler (kontaktinfo, lokation, device-id, analytics, etc.) og formål (app-funktion, analytics, marketing). Vær konsekvent med det, du faktisk gør i koden.

Konto-sletning i appen: hvis man kan oprette konto, skal man også kunne slette den direkte i appen (ikke “skriv til support”).

Tilladelser (iOS Info.plist / Expo app.json): klare, brugervendte tekster på dansk til fx:

Kamera, Fotos, Notifikationer, Lokation (og begrund hvorfor), Bluetooth, Mikrofon (hvis relevant).

ATT (App Tracking Transparency): kun hvis du sporer på tværs af apps/websites. Undgå hvis du kan; ellers vis prompt og forklar formålet.

Sign in with Apple: påkrævet hvis du bruger tredjeparts-login (Google/Facebook). Hvis du kun bruger e-mail/telefon eller MitID til KYC, kan du normalt undtages—ellers tilføj Apple-login.

Kryptering/Export compliance: du bruger HTTPS/Stripe → svar “Yes, uses standard encryption; not custom” i eksportspørgsmålene.

2) Betaling & Apple-regler (så du ikke rammer en afvisning)

Fysiske ydelser i den virkelige verden (reparation, service på båd): må betales med Stripe/kort i appen (ikke IAP). Det er ok.

Digitalt indhold/funktioner i appen: skal via In-App Purchase.

Apple Pay er frivilligt; det er ikke lig med IAP. (Apple Pay = en wallet til kortbetalinger, ikke et købssystem.)

Hav tydelig kvittering/ordrestatus og kontakt/support i appen.

3) Backend & sikkerhed (App Review kigger mere på det end før)

Stabil drift (min. 99.9% uptime) + monitorering (Sentry/Crashlytics, logning).

Rate-limiting og inputvalidering (API misbrug).

Secrets i sikre variabler (EAS Secrets / GCP/AWS Secrets), aldrig i repo.

Firestore Security Rules (eller API-auth) testet—kun den rette bruger må se/ændre sine data.

Stripe: brug PaymentIntents, verificér webhook-signatur, undgå at røre kortdata (PCI SAQ-A).

MitID/Criipto: whitelist redirect-URI’er, gem kun nødvendige claims, log tidspunkter (KYC-audit).

4) Juridisk & data (GDPR)

Databehandleraftaler: Firebase/Google, Stripe, Sentry, osv.

Dataminimering: gem ikke mere end nødvendigt; sæt retention på logs.

Brugerrettigheder: indsigts-/sletteknap (du har allerede konto-slet; udvid gerne med “download data”).

Cookie/Tracking: hvis du tracker til marketing, dokumentér det og giv opt-out.

5) Ydelse & kvalitet (mærkbart for review og brugere)

App-størrelse rimelig (ekstra assets → CDN/remote).

Koldstart < 2–3 sek på en almindelig iPhone.

Scroll/gestures 60 FPS i hovedflows.

Offline-tolerant på kritiske skærme (lav tom-states og retry).

Accessibility: VoiceOver labels, farvekontrast, større tekst understøttet.

6) Metadata & “App Review survival kit”

Demo-login (testkonto) i “App Review Notes” + trin-for-trin: fx “Log ind ➜ opret job ➜ betal ➜ se kvittering”.

Angiv hardwarekrav (kamera, lokation) og hvorfor de er nødvendige.

Hvis der er login-væg, forklar hvorfor (personlige data) og hvordan man tilgår features.

Link til support og privatliv inde i appen (Indstillinger/profil).

7) Test & release-flow

TestFlight til interne/eksterne testere (crash-frie builds).

CI (GitHub Actions) + Expo EAS: versionsnummer bump automatisk, kør linter/tests.

Feature flags til at rulle ting gradvist ud.

Rollback-strategi (hurtig ny build, server-kill-switch for features).

8) iOS-specifikke Expo-ting at dobbelttjekke

app.json/app.config:

ios.bundleIdentifier

ios.buildNumber

infoPlist med localized permission-tekster (da-DK).

Notifikationer: usesPushNotifications: true, device-token flow, server-send.

URL-schemes for Criipto redirect og Stripe (deep links).

Ikoner/splash i alle størrelser.

Entitlements kun dem du bruger (Background modes, Keychain, etc.).

