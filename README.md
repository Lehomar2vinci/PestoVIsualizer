# Visualiseur Audio Dynamique

Ce projet est un visualiseur audio interactif utilisant la bibliothèque p5.js pour créer des visualisations dynamiques basées sur l'entrée audio du microphone.

## Fonctionnalités

- **Visualisation Audio** : Des cercles concentriques changent de taille et de couleur en fonction des fréquences audio détectées.
- **Particules Animées** : Activation/désactivation des particules animées basées sur l'énergie des fréquences.
- **Palette de Couleurs** : Choisissez parmi différentes palettes de couleurs (par défaut, chaud, froid).
- **Sensibilité Réglable** : Ajustez la sensibilité de la visualisation audio.

## Installation

1. Clonez le dépôt :
    ```bash
    git clone https://github.com/Lehomar2vinci/PestoVIsualizer
    ```
2. Naviguez vers le répertoire du projet :
    ```bash
    cd PestoVIsualizer
    ```

## Utilisation

1. Ouvrez le fichier `listener.html` dans votre navigateur.
2. Utilisez les contrôles pour ajuster la sensibilité, sélectionner une palette de couleurs et activer les particules.
3. Cliquez sur "Démarrer" pour activer l'entrée microphone et commencer la visualisation.

## Fichiers Principaux

- `listener.html` : Contient la structure HTML et les contrôles de l'interface utilisateur.
- `listener.css` : Contient le style CSS pour l'interface utilisateur.
- `listener.js` : Contient la logique JavaScript pour la visualisation audio et l'animation des particules.

## Dépendances

- **p5.js** : Une bibliothèque JavaScript pour la création graphique et interactive.
- **p5.sound.js** : Une extension de p5.js pour la manipulation et l'analyse du son.

## Captures d'écran

Ajoutez ici des captures d'écran de votre projet.

## Contribuer

Les contributions sont les bienvenues ! S'il vous plaît, ouvrez une issue ou soumettez une pull request.

## Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.
