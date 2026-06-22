# Intégration p5 locale — Guide rapide

Vos bibliothèques **p5.js** et **p5.sound.js** sont maintenant chargées depuis le dossier `p5/`.

Ordre de chargement:
1. `p5/p5.js`
2. `p5/p5.sound.js`
3. `eventSystem.js` (defer)
4. `sketch.js` (defer)

Ouvrez **index.improved.html** pour tester.

Améliorations incluses:
- `p5.disableFriendlyErrors = true` pour de meilleures perfs.
- Reprise de l'AudioContext au premier clic (mobile/Chrome).
- Hook de resize plus robuste côté sketch.
- Balise `<noscript>` et viewport si manquants.

Astuce: gardez `p5/` au même niveau que `index.improved.html`.

