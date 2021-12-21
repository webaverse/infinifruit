import * as THREE from 'three';
// import easing from './easing.js';
import metaversefile from 'metaversefile';
const {useApp, useFrame, useActivate, useLoaders, usePhysics, addTrackedApp, useDefaultModules, useCleanup} = metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

const fruitFileNames = [
  'Egg_Fruit_dream.glb',
  'Lavender_Berry_dream.glb',
  'Long_Apple_dream.glb',
  'Red_Shroom_dream.glb',
  'Slime_Fruit_dream.glb',
  'Squid_Squash_dream.glb',
];

export default () => {
  const app = useApp();
  const physics = usePhysics();

  let activateCb = null;
  let frameCb = null;
  useActivate(() => {
    activateCb && activateCb();
  });
  useFrame(({timestamp, timeDiff}) => {
    frameCb && frameCb(timestamp, timeDiff);
  });

  const _loadGlb = async u => {
    // const u = `${baseUrl}fruit.glb`;
    let o = await new Promise((accept, reject) => {
      const {gltfLoader} = useLoaders();
      gltfLoader.load(u, accept, function onprogress() {}, reject);
    });
    // window.fruit = o;
    return o;
  };

  let physicsIds = [];
  (async () => {
    const os = await Promise.all(fruitFileNames.map(fruitFileName => _loadGlb(`${baseUrl}${fruitFileName}`))
      .concat([
        /* (async () => {
          const u = `${baseUrl}fruit.glb`;
          let o = await new Promise((accept, reject) => {
            const {gltfLoader} = useLoaders();
            gltfLoader.load(u, accept, function onprogress() {}, reject);
          });
          window.fruit = o;
          return o;
        })(), */
        _loadGlb(`${baseUrl}plant.glb`),
        _loadGlb(`${baseUrl}plant2.glb`),
      ])
    );
    const [
      eggFruit,
      lavenderBerry,
      longApple,
      redShroom,
      slimeFruit,
      squidSquash,
      plant,
      plant2,
    ] = os;
    const fruits = [
      eggFruit,
      lavenderBerry,
      longApple,
      redShroom,
      slimeFruit,
      squidSquash,
    ];
    for (const fruit of fruits) {
      fruit.scene.scale.multiplyScalar(0.2);
    }
    plant.scene.scale.multiplyScalar(5);
    plant2.scene.scale.multiplyScalar(0.02);
    for (const o of os) {
      app.add(o.scene);
    }
    app.updateMatrixWorld();

    /* for (const fruit of fruits) {
      const physicsId = physics.addGeometry(o.scene);
      physicsIds.push(physicsId);
    } */
    
    frameCb = (timestamp, timeDiff) => {
      // console.log('use frame', timestamp, timeDiff);
    };
  })();

  const physicsMaterial = new THREE.Vector3(0.5, 0.5, 0);
  const physicsObject = physics.addCapsuleGeometry(app.position, app.quaternion, 0.3, 0, physicsMaterial);
  physicsIds.push(physicsObject);
  
  useCleanup(() => {
    for (const physicsId of physicsIds) {
      physics.removeGeometry(physicsId);
    }
  });

  return app;
};