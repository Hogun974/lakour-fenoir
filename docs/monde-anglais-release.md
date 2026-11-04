# Monde vierge anglais `la-kour-fenoir-en` : ce que la release doit faire

Le monde vierge anglais est produit par l'outil commun du moteur, `modules/lakour-mj-ia/outils/empaqueter-monde.mjs`,
avec l'option `--langue en` (voir `modules/lakour-mj-ia/docs/empaqueter-monde.md`) :

```
npm run empaqueter-monde                 # monde français : monde/dist/la-kour-fenoir/, la-kour-fenoir.zip, world.json
npm run empaqueter-monde -- --langue en  # monde anglais  : monde/dist/la-kour-fenoir-en/, la-kour-fenoir-en.zip, world-en.json
```

Le monde anglais est le jumeau du français (mêmes sources `monde/src`) : documents traduits par les dictionnaires
`modules/lakour-fenoir/contenu/en/`, réglages basculés sur `lakour-fenoir-en` (`core.moduleConfiguration` active
`lakour-fenoir-en` à la place de `lakour-fenoir`, `lakour-fenoir-en.installe`), manifeste engendré de `monde/world.json`
et de `monde/world.en.json` (id `la-kour-fenoir-en`, titre et description anglais, module requis `lakour-fenoir-en` par
son manifeste `lakour-fenoir-en.json`), Gamemaster identique. `--verifier --langue en` relit le paquet anglais et échoue
s'il reste une trace du module français, une fuite ou un lien cassé.

## Dans `.github/workflows/release.yml`

Le workflow (écrit à part) lance déjà `npm run empaqueter-monde` et recopie `monde/dist/world.json` et
`monde/dist/la-kour-fenoir.zip` dans `dist/` ; il prévoit `world-en.json` et `la-kour-fenoir-en.zip` **s'ils existent**.
Pour qu'ils existent, il lui manque une seule commande, juste après le monde français :

```yaml
      - name: Empaquetage du monde vierge (monde/src -> monde/dist, puis vérification des fuites)
        run: |
          npm run empaqueter-monde
          npm run empaqueter-monde -- --langue en
```

Il faut aussi que le sous-module `modules/lakour-mj-ia` soit à une version du moteur qui connaît `--langue en`
(`outils/empaqueter-monde.mjs` : fonctions `manifesteDuMondeAnglais`, `traduireMonde`), et que `monde/world.en.json`
soit versionné (il l'est). Adresse stable du manifeste anglais, une fois publié :
`https://github.com/Hogun974/lakour-fenoir/releases/latest/download/world-en.json`.
