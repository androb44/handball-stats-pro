# 🤾 HandballStats Pro

Aplikacija za vođenje kompletne statistike na rukometnim utakmicama.

## Funkcionalnosti

- **20+ tipova događaja**: golovi, asistencije, promašaji, odbrane, sedmerci, kartoni, isključenja, kontranapadi, prodori, pasivna igra...
- **Live tajmer** sa auto-save svakih 30 sekundi
- **Produžeci** (2x5min) kada je neriješeno
- **Statistika u realnom vremenu**: uporedni timski pregled, individualna statistika igrača, timeline događaja
- **Upravljanje timovima**: sačuvaj šablone i učitaj ih za novu utakmicu
- **Undo** za pogrešno unesene događaje
- **Timeout tracking** (3 po timu)
- **Offline rad** — sve se čuva u localStorage

## Tehnologije

- React 18 + Vite
- localStorage za persistenciju podataka
- Mobile-first dizajn (max 480px)
- PWA-ready struktura

## Pokretanje lokalno

```bash
npm install
npm run dev
```

## Build za produkciju

```bash
npm run build
```

Generisani fajlovi su u `dist/` folderu.

## Deploy na Cloudflare Pages

1. Pushaj kod na GitHub repozitorijum
2. Idi na [Cloudflare Pages](https://pages.cloudflare.com/)
3. Klikni **Create a project** → **Connect to Git**
4. Odaberi svoj repozitorijum
5. Podesi build settings:
   - **Framework preset**: `None`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
6. Klikni **Save and Deploy**

Svaki push na `main` branch automatski pokreće novi deploy.

## Struktura projekta

```
src/
├── App.jsx              # Glavni router
├── main.jsx             # Entry point
├── index.css            # Globalni stilovi
├── constants.js         # Event tipovi, pozicije
├── styles.js            # Tema, boje, stilovi
├── db.js                # Database layer (localStorage)
└── components/
    ├── Header.jsx       # Navigacija
    ├── HomeScreen.jsx   # Početni ekran
    ├── MatchSetup.jsx   # Kreiranje utakmice
    ├── LiveMatch.jsx    # Live praćenje
    ├── LiveStats.jsx    # Statistika
    └── TeamManager.jsx  # Upravljanje timovima
```

## Budući razvoj

- **iOS/Android**: Zamotaj u Capacitor ili prebaci na React Native
- **Backend**: Zamijeni `db.js` sa Supabase/Firebase za cloud sync
- **Export**: PDF izvještaji sa statistikom
