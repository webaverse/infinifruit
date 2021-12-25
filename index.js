import * as THREE from 'three';
// import easing from './easing.js';
import metaversefile from 'metaversefile';
const {useApp, useFrame, useWorld, useActivate, useLoaders, usePhysics, addTrackedApp, useDefaultModules, useCleanup} = metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

const localVector = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();

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
  const world = useWorld();
  const physics = usePhysics();

  const _loadFruit = async fileName => {
    const app = await world.appManager.addTrackedApp(
      `${baseUrl}fruit/`,
      undefined, // position = new THREE.Vector3(),
      undefined, // quaternion = new THREE.Quaternion(),
      undefined, // scale = new THREE.Vector3(1, 1, 1),
      [
        {
          key: 'fileName',
          value: fileName,
        },
      ],
    );
    return app;
    /* const m = await metaversefile.import(`${baseUrl}fruit/`);
    const app = metaversefile.createApp();
    app.setComponent('fileName', fileName);
    await metaversefile.addModule(app, m);
    return app; */
    // return await metaversefile.load(u);
  };
  const _loadGlb = async fileName => {
    const u = `${baseUrl}${fileName}`;
    let o = await new Promise((accept, reject) => {
      const {gltfLoader} = useLoaders();
      gltfLoader.load(u, accept, function onprogress() {}, reject);
    });
    o = o.scene;
    // window.fruit = o;
    return o;
  };

  const subApps = [];
  let physicsIds = [];
  (async () => {
    const emptyFruitFileNames = [];
    const os = await Promise.all(emptyFruitFileNames.map(fruitFileName => _loadFruit(fruitFileName))
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
        _loadGlb('plant.glb'),
        _loadGlb('plant2.glb'),
      ])
    );
    const [
      // eggFruit,
      // lavenderBerry,
      // longApple,
      // redShroom,
      // slimeFruit,
      // squidSquash,
      plant,
      plant2,
    ] = os;
    const fruits = [
      // eggFruit,
      // lavenderBerry,
      // longApple,
      // redShroom,
      // slimeFruit,
      // squidSquash,
    ];
    /* for (const fruit of fruits) {
      fruit.scale.multiplyScalar(0.2);
    } */
    plant.scale.multiplyScalar(5);
    plant2.scale.multiplyScalar(0.02);
    app.add(plant);
    app.add(plant2);
    // app.add(longApple);
    /* for (const o of os) {
      app.add(o);
    } */
    app.updateMatrixWorld();

    subApps.push(...fruits);

    // window.fruits = fruits;

    /* // visibility
    for (const f of fruits) {
      f.visible = false;
    }
    eggFruit.visible = true; */
    
    /* activateCb = e => {
      console.log('activate infinifruit', e);
    }; */
    let loadSpec = null;
    frameCb = (timestamp, timeDiff) => {
      /* // console.log('use frame', timestamp, timeDiff);
      localQuaternion.setFromAxisAngle(localVector.set(0, 0, 1), Math.sin(timestamp / 1000) * 0.1);
      for (const o of os) {
        o.quaternion.copy(localQuaternion);
      } */

      if (subApps.length === 0 && !loadSpec) {
        (async () => {
          loadSpec = {
            startTime: null,
            endTime: null,
          };

          const fruitFileName = fruitFileNames[Math.floor(Math.random() * fruitFileNames.length)];
          const fruit = await _loadFruit(fruitFileName);
          loadSpec.startTime = performance.now();
          loadSpec.endTime = loadSpec.startTime + 1000;
          subApps.push(fruit);

          // loadSpec = null;
        })();
      }

      for (const subApp of subApps) {
        subApp.position.copy(app.position);
        subApp.quaternion.copy(app.quaternion);
        if (loadSpec && loadSpec.startTime !== null) {
          const f = (timestamp - loadSpec.startTime) / (loadSpec.endTime - loadSpec.startTime);
          if (f < 1) {
            subApp.scale.setScalar(f);
          } else {
            subApp.scale.setScalar(1);
            loadSpec = null;
          }
        } else {
          subApp.scale.setScalar(1);
        }
        subApp.updateMatrixWorld();
        
        subApp.visible = subApp.scale.x > 0;
      }
    };
  })();
  
  /* const physicsMaterial = new THREE.Vector3(0.5, 0.5, 0);
  const physicsObject = physics.addCapsuleGeometry(app.position, app.quaternion, 0.3, 0, physicsMaterial);
  physicsIds.push(physicsObject); */
  
  app.getPhysicsObjects = () => {
    const result = [];
    for (const subApp of subApps) {
      result.push(...subApp.getPhysicsObjects());
    }
    return result;
  };

  // window.infinifruitApp = app;

  // let activateCb = null;
  let frameCb = null;
  useActivate(() => {
    // activateCb && activateCb();
    for (const subApp of subApps) {
      subApp && subApp.activate();
    }
    subApps.length = 0;
  });
  useFrame(({timestamp, timeDiff}) => {
    frameCb && frameCb(timestamp, timeDiff);
  });

  useCleanup(() => {
    for (const physicsId of physicsIds) {
      physics.removeGeometry(physicsId);
    }
  });

  return app;
};