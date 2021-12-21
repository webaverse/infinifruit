import * as THREE from 'three';
// import easing from './easing.js';
import metaversefile from 'metaversefile';
const {useApp, useFrame, useActivate, useLoaders, usePhysics, addTrackedApp, useDefaultModules, useCleanup} = metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

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

  let physicsIds = [];
  (async () => {
    const u = `${baseUrl}fruit.glb`;
    let o = await new Promise((accept, reject) => {
      const {gltfLoader} = useLoaders();
      gltfLoader.load(u, accept, function onprogress() {}, reject);
    });
    const {animations} = o;
    o = o.scene;
    app.add(o);
    
    /* const dropObject = new THREE.Object3D();
    dropObject.position.y = 0.5;
    app.add(dropObject); */

    // app.updateMatrixWorld();

    /* let baseMesh = null;
    o.traverse(o => {
      if (!baseMesh && o.isMesh && /base_container/i.test(o.name)) {
        baseMesh = o;
      }
    }); */
    const physicsId = physics.addGeometry(o);
    physicsIds.push(physicsId);
    
    frameCb = (timestamp, timeDiff) => {
      console.log('use frame', timestamp, timeDiff);
    };
  })();
  
  useCleanup(() => {
    for (const physicsId of physicsIds) {
      physics.removeGeometry(physicsId);
    }
  });

  return app;
};