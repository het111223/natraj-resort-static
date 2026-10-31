# Hotel Natraj & Resort

Website for Hotel Natraj & Resort, Delwad, Gandhinagar–Mahudi Highway Road, Gujarat.

Everything is in one file, `index.html`: the page, its styles and its scripts. There's no build step. Open it in a browser, or serve it with GitHub Pages.

## Photos

The page loads photos from the `images/` folder. A photo that isn't in that folder yet is loaded from natrajhotel.co.in instead.

To copy all the photos into the repo on Windows:

1. Double-click `get-photos.bat`. It downloads them into `images/`.
2. Commit and push:

```
git add images
git commit -m "Add photos"
git push
```

## 3D entrance

The landing scene is real 3D (WebGL, three.js), dressed for Diwali. It shows the resort's name over a haveli gateway with marigold garlands, kandils and diyas. As you scroll, the doors open and you walk up a diya-lit path to a model of the main building, built from a photo of the property, with fairy lights and fireworks overhead. The source is `src/scene.js`. `js/scene.js` is the built file the page loads. To rebuild it after editing:

```
npm i three@0.187.0 esbuild
npx esbuild src/scene.js --bundle --minify --format=iife --outfile=js/scene.js
```

On devices without WebGL, or with reduced motion turned on, the page falls back to the flat CSS door.
