import * as THREE from 'three';
// import easing from './easing.js';
import metaversefile from 'metaversefile';
const {useApp, useFrame, useActivate, useLoaders, usePhysics, addTrackedApp, useDefaultModules, useCleanup} = metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();

/* const fruitFileNames = [
  'Egg_Fruit_dream.glb',
  'Lavender_Berry_dream.glb',
  'Long_Apple_dream.glb',
  'Red_Shroom_dream.glb',
  'Slime_Fruit_dream.glb',
  'Squid_Squash_dream.glb',
]; */

// console.log('got fruit init');

export default () => {
  const app = useApp();
  const physics = usePhysics();

  // console.log('got app', app, app.components);
  const fileNameComponent = app.components.find(c => c.key === 'fileName') ;
  const fileName = fileNameComponent?.value;

  if (fileName) {
    const _loadGlb = async u => {
      let o = await new Promise((accept, reject) => {
        // console.log('got file name', fileName);
        const {gltfLoader} = useLoaders();
        gltfLoader.load(`${baseUrl}${fileName}`, accept, function onprogress() {}, reject);
      });
      return o;
    };

    let physicsIds = [];
    (async () => {
      const fruitObject = await _loadGlb(fileName);
      const fruit = fruitObject.scene;
      fruit.scale.multiplyScalar(0.2);
      app.add(fruit);
      app.updateMatrixWorld();
      
      /* activateCb = e => {
        console.log('activate', e);
      }; */
      frameCb = (timestamp, timeDiff) => {
        fruit.quaternion.identity()
          .premultiply(localQuaternion.setFromAxisAngle(localVector.set(0, 0, 1), Math.sin(timestamp / 1000 * 5) * 0.5));
        fruit.updateMatrixWorld();
      };
    })();
    
    const physicsMaterial = new THREE.Vector3(0.5, 0.5, 0);
    app.getWorldPosition(localVector);
    localQuaternion.setFromAxisAngle(localVector2.set(0, 0, 1), Math.PI * 0.5);
    // console.log('call', worldPosition, worldQuaternion, 0.3, 0.1, physicsMaterial);
    const physicsObject = physics.addCapsuleGeometry(localVector, localQuaternion, 0.3, 0, physicsMaterial);
    physicsIds.push(physicsObject);

    console.log('fruit physics object', physicsObject.quaternion.toArray());
    /* if (physicsObject.quaternion.w === 1) {
      debugger;
    } */
    window.capsulePhysicsObject = physicsObject;
    
    let frameCb = null;
    useActivate(e => {
      console.log('activate', e);
    });
    useFrame(({timestamp, timeDiff}) => {
      frameCb && frameCb(timestamp, timeDiff);

      app.getWorldPosition(physicsObject.position);
      // console.log('set transform', physicsObject.quaternion.toArray());
      // physicsObject.quaternion.identity();
      physics.setTransform(physicsObject);
    });

    useCleanup(() => {
      for (const physicsId of physicsIds) {
        physics.removeGeometry(physicsId);
      }
    });
  }

  return app;
};