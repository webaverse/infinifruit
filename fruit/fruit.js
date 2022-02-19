import * as THREE from 'three';
// import easing from './easing.js';
import metaversefile from 'metaversefile';
const {useApp, useFrame, useActivate, useWear, useLoaders, usePhysics, useCleanup} = metaversefile;

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

  app.name = 'fruit';

  // console.log('got app', app, app.components);
  const fileNameComponent = app.components.find(c => c.key === 'fileName') ;
  const fileName = fileNameComponent?.value;

  if (fileName) {
    const _loadGlb = async u => {
      let o = await new Promise((accept, reject) => {
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
      fruit.updateMatrixWorld();
      
      /* activateCb = e => {
        console.log('activate', e);
      }; */
      frameCb = (timestamp, timeDiff) => {
        if (!wearing) {
          const s = Math.sin(timestamp / 1000 * 20);
          const f = Math.min(Math.max(Math.pow(1 + Math.sin(timestamp / 1000 * 5) * 0.5, 8.), 0), 1);
          const v = 0.3;
          fruit.quaternion.identity()
            .premultiply(
              localQuaternion.setFromAxisAngle(localVector.set(0, 0, 1),
                s * f * v
              )
            );
        } else {
          fruit.position.set(0, 0, 0);
          fruit.quaternion.identity();
        }
        fruit.updateMatrixWorld();
      };
    })();
    
    const radius = 0.3;
    const _getPhysicsTransform = (localVector, localQuaternion) => {
      app.getWorldPosition(localVector);
      localVector.y += radius;
      localQuaternion.setFromAxisAngle(localVector2.set(0, 0, 1), Math.PI * 0.5);
    };
    _getPhysicsTransform(localVector, localQuaternion);
    const physicsMaterial = new THREE.Vector3(0.5, 0.5, 0);
    const physicsObject = physics.addCapsuleGeometry(localVector, localQuaternion, radius, 0, physicsMaterial, true);
    physics.setLinearLockFlags(physicsObject.physicsId, false, false, false);
    physics.setAngularLockFlags(physicsObject.physicsId, false, false, false);
    // physics.setMassAndInertia(physicsObject, 0, new THREE.Vector3(0, 0, 0));
    physics.setGravityEnabled(physicsObject, false);
    physicsIds.push(physicsObject);

    // console.log('fruit physics object', physicsObject.quaternion.toArray());
    /* if (physicsObject.quaternion.w === 1) {
      debugger;
    } */
    // window.capsulePhysicsObject = physicsObject;
    
    let frameCb = null;
    let wearing = false;
    useActivate(e => {
      // console.log('activate fruit', e);
      app.wear();
      // XXX need to port wear components out of totum glb handler, so that all apps are supported
    });
    useWear(e => {
      wearing = e.wear;
    });
    // window.fruitApp = app;
    // window.fruitPhysicsObject = physicsObject;
    useFrame(({timestamp, timeDiff}) => {
      frameCb && frameCb(timestamp, timeDiff);

      /* app.getWorldPosition(physicsObject.position);
      // console.log('set transform', physicsObject.quaternion.toArray());
      // physicsObject.quaternion.identity();
      physics.setTransform(physicsObject); */
    });

    useCleanup(() => {
      for (const physicsId of physicsIds) {
        physics.removeGeometry(physicsId);
      }
    });
  }

  return app;
};