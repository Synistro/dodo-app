# Les Histoires du Soir 🌙

PWA de contes du soir pour Johanna.

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
