# Les Histoires du Soir 🌙

PWA de contes du soir pour endormir un enfant :).

🔗 **https://synistro.github.io/dodo-app/**

## Structure

```
johanna-app/
├── index.html        ← shell HTML
├── manifest.json     ← PWA manifest
├── sw.js             ← Service Worker (offline)
├── css/app.css       ← tout le CSS
├── js/
│   ├── stories.js    ← données des 6 histoires
│   ├── reader.js     ← bibliothèque + lecteur swipe + parallax
│   ├── game.js       ← jeu ballons canvas
│   └── app.js        ← navigation + étoiles + init
├── icons/
│   ├── icon-192.png  ← icône PWA
│   └── icon-512.png  ← icône PWA
└── images/           ← 26 illustrations 9:16
```

## Déploiement

```bash
git add .
git commit -m "update"
git push
```

GitHub Pages se met à jour automatiquement après chaque push.

## Crédits sons (animaux de la nuit)

Enregistrements Wikimedia Commons, découpés/normalisés (WAV mono 22 kHz) :

- Chouette : « Strix aluco - Tawny Owl XC563348 » — Alvaro Ortiz Troncoso, CC BY-SA 4.0
- Chat : « Meow.ogg » — Dcrosby (en.wikipedia), CC BY-SA 3.0
- Grenouille : « Marsh frog (Pelophylax ridibundus) call » — Llivermore, CC BY-SA 4.0
- Criquet : « Field cricket Gryllus pennsylvanicus » — Thatcher, CC BY-SA 3.0
- Loup : « Wolf howls.ogg » — domaine public
- Rossignol : « Nightingale (Luscinia megarhynchos) » — Helical gear, CC BY-SA 3.0
- Gecko : « HouseGeckoChirp.ogg » — Glueball, CC BY-SA 3.0
- Singe congo : « Monos Congo - Howler Monkeys » — Francisco Guerrero, CC BY-SA 3.0
