import * as THREE from 'three';
// import easing from './easing.js';
import metaversefile from 'metaversefile';
const {useApp, useFrame, useActivate, useWear, useLoaders, usePhysics, useCleanup, useLocalPlayer, useScene, useInternals} = metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();

const textureLoader = new THREE.TextureLoader();
const simpleNoise2 = textureLoader.load(`${baseUrl}/textures/splash3.jpg`);
const sphere = textureLoader.load(`${baseUrl}/textures/sphere.jpg`);


// note: For WASM API.
export const GET = 0;
export const GET_NORMALIZED = 1;
export const GET_INVERSE = 2;
//

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
  const scene = useScene();
  const {camera} = useInternals();
  const physics = usePhysics();
  const localPlayer = useLocalPlayer();



  app.name = 'borgor';

  // console.log('got app', app, app.components);
  const fileNameComponent = app.components.find(c => c.key === 'fileName') ;
  const fileName = fileNameComponent?.value;
  if (fileName) {
  //################################################################### particle ##########################################################################################
    const crunchParticleCount = 21;
    let info = {
        crunchVelocity: [crunchParticleCount]
    }
    let acc = new THREE.Vector3(0, -0.005, 0);
    //##################################################### get geometry #####################################################
    const _getCrunchGeometry = geometry => {
        const geometry2 = new THREE.BufferGeometry();
        ['position', 'normal', 'uv'].forEach(k => {
          geometry2.setAttribute(k, geometry.attributes[k]);
        });
        geometry2.setIndex(geometry.index);
        
        const positions = new Float32Array(crunchParticleCount * 3);
        const positionsAttribute = new THREE.InstancedBufferAttribute(positions, 3);
        geometry2.setAttribute('positions', positionsAttribute);

        const opacityAttribute = new THREE.InstancedBufferAttribute(new Float32Array(crunchParticleCount), 1);
        opacityAttribute.setUsage(THREE.DynamicDrawUsage);
        geometry2.setAttribute('opacity', opacityAttribute);

        const random = new Float32Array(crunchParticleCount);
        const randomAttribute = new THREE.InstancedBufferAttribute(random, 1);
        geometry2.setAttribute('random', randomAttribute);
    
        return geometry2;
    };
    
    //##################################################### crunch material #####################################################
    const crunchMaterial = new THREE.ShaderMaterial({
      uniforms: {
          cameraBillboardQuaternion: {
            value: new THREE.Quaternion(),
          },
          textureNoise: { type: 't', value: simpleNoise2 },
          sphere: { type: 't', value: sphere },
      },
      vertexShader: `\
          ${THREE.ShaderChunk.common}
          ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
      
          uniform vec4 cameraBillboardQuaternion;

          attribute vec3 positions;
          attribute float opacity;
          attribute float random;

          varying vec2 vUv;
          varying float vOpacity;
          varying float vRandom;

          vec3 rotateVecQuat(vec3 position, vec4 q) {
            vec3 v = position.xyz;
            return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
          }
      
          void main() {
            vRandom=random;
            vOpacity=opacity;
            vUv=uv;
            
            vec3 pos = position;
            pos = rotateVecQuat(pos, cameraBillboardQuaternion);
            pos+=positions;
            
            vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
            vec4 viewPosition = viewMatrix * modelPosition;
            vec4 projectionPosition = projectionMatrix * viewPosition;
    
            gl_Position = projectionPosition;
            ${THREE.ShaderChunk.logdepthbuf_vertex}
          }
      `,
      fragmentShader: `\
          ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
          varying float vOpacity;
          varying vec2 vUv;
          varying float vRandom;
          
          uniform sampler2D textureNoise;
          uniform sampler2D sphere;

          #define PI 3.1415926

          void main() {
            vec4 mask = texture2D(sphere,vUv*2.5);
            float mid = 0.5;
            vec2 rotated = vec2(cos(vRandom*PI) * (vUv.x - mid) + sin(vRandom*PI) * (vUv.y - mid) + mid,
                                cos(vRandom*PI) * (vUv.y - mid) - sin(vRandom*PI) * (vUv.x - mid) + mid);
            vec4 splash = texture2D(
                          textureNoise,
                          vec2(
                              mod(rotated.x/(5.+ 5.*vRandom),1.),
                              mod(rotated.y/(5.+ 5.*vRandom),1.)
                          )
            );
            
            gl_FragColor = splash;
            float test = clamp(splash.r,0.0,1.0);
            test = pow(test,7.);
            gl_FragColor = vec4(vec3(test),1.0);
            gl_FragColor *= mask;
            if(gl_FragColor.r<0.1)
              discard;
            else                    
              gl_FragColor = vec4(0.8, 0.970, 0.933,gl_FragColor.r*5.);

            gl_FragColor.a*=vOpacity;
          ${THREE.ShaderChunk.logdepthbuf_fragment}
          }
      `,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      //blending: THREE.AdditiveBlending,
      
    });
    
    //######################################################## initial instanced mesh #################################################################
    let crunchMesh=null;
    const addInstancedMesh=()=>{
        const geometry2 = new THREE.PlaneGeometry( 0.3, 0.3 );
        const geometry =_getCrunchGeometry(geometry2)
        crunchMesh = new THREE.InstancedMesh(
            geometry,
            crunchMaterial,
            crunchParticleCount
        );
        const positionsAttribute = crunchMesh.geometry.getAttribute('positions');
        for (let i = 0; i < crunchParticleCount; i++){
          info.crunchVelocity[i] = new THREE.Vector3();
          positionsAttribute.setXYZ(i, app.position.x+(Math.random()-0.5)*0.02,app.position.y+(Math.random())*5,app.position.z+(Math.random()-0.5)*0.02);
                  
        }
        positionsAttribute.needsUpdate = true;
    }
    addInstancedMesh();
    

  //################################################################### fruit ##########################################################################################
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

      const _getActionFrameIndex = (f, frameTimes) => {
        let i;
        for (i = 0; i < frameTimes.length; i++) {
          if (f >= frameTimes[i]) {
            continue;
          } else {
            break;
          }
        }
        return i;
      };

      const eatFrameIndices = [500, 800, 1100];
      let lastEatFrameIndex = -1;
      let particleAlreadyInScene= false;
      let removeFruitFromApp = false;
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
          if(!particleAlreadyInScene){
            scene.add(crunchMesh);
            particleAlreadyInScene=true;
          }
          //######################### crunch attribute ##############################
          const splashOpacityAttribute = crunchMesh.geometry.getAttribute('opacity');
          const splashPositionsAttribute = crunchMesh.geometry.getAttribute('positions');
          const splashRandomAttribute = crunchMesh.geometry.getAttribute('random');
          const splashDegree = fruit.scale.x / 0.2;

          if (localPlayer.getAction('use')) {
            // const v = localPlayer.actionInterpolants.use.get();
            const v = physics.getActionInterpolant(localPlayer, 'use', GET);
            const eatFrameIndex = _getActionFrameIndex(v, eatFrameIndices);
            if (eatFrameIndex !== 0 && eatFrameIndex !== lastEatFrameIndex) {
              for (let i = (eatFrameIndex-1)*7; i < (eatFrameIndex-1)*7+7; i++) {
                  info.crunchVelocity[i].x=(Math.random()-0.5)*0.8;
                  info.crunchVelocity[i].y=0.5+Math.random()*0.5;
                  info.crunchVelocity[i].z=(Math.random()-0.5)*0.8;
                  info.crunchVelocity[i].x = info.crunchVelocity[i].x < 0 ? info.crunchVelocity[i].x-0.2:info.crunchVelocity[i].x+0.2;
                  info.crunchVelocity[i].z = info.crunchVelocity[i].z < 0 ? info.crunchVelocity[i].z-0.2:info.crunchVelocity[i].z+0.2;
                  info.crunchVelocity[i].divideScalar(20);
  
                  splashOpacityAttribute.setX(i,0.8);
                  splashPositionsAttribute.setXYZ(i, app.position.x+(Math.random()-0.5)*0.02,app.position.y+(0.13* splashDegree)+(Math.random())*0.02,app.position.z+(Math.random()-0.5)*0.02);
                  splashRandomAttribute.setX(i, Math.random());
              }
              //if(eatFrameIndex===3){
                fruit.scale.x/=1.3;
                fruit.scale.y/=1.3;
                fruit.scale.z/=1.3;
              //}
            }
            if(fruit.scale.x<=0.1 && !removeFruitFromApp){
              scene.remove(crunchMesh);
              app.remove(fruit);
              for (const physicsId of physicsIds) {
                physics.removeGeometry(physicsId);
              }
              const newCureAction = {
                type: 'cure'
              };
              localPlayer.addAction(newCureAction);
              app.unwear();
            }
            lastEatFrameIndex = eatFrameIndex;
          }
          //#################################### handle crunch #######################################
          for (let i = 0; i < crunchParticleCount; i++) {
            splashPositionsAttribute.setXYZ(i, 
                                            splashPositionsAttribute.getX(i)+info.crunchVelocity[i].x,
                                            splashPositionsAttribute.getY(i)+info.crunchVelocity[i].y,
                                            splashPositionsAttribute.getZ(i)+info.crunchVelocity[i].z
            );
            splashOpacityAttribute.setX(i, splashOpacityAttribute.getX(i)-0.02);
            info.crunchVelocity[i].add(acc);
          }
          
          splashPositionsAttribute.needsUpdate = true;
          splashOpacityAttribute.needsUpdate = true;
          splashRandomAttribute.needsUpdate = true;
          crunchMesh.material.uniforms.cameraBillboardQuaternion.value.copy(camera.quaternion);
          
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
    const physicsMaterial = [0.5, 0.5, 0];
    const materialAddress = physics.createMaterial(physicsMaterial);
    const physicsObject = physics.addCapsuleGeometry(localVector, localQuaternion, radius, 0, materialAddress, true);
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
    /* useActivate(e => {
      app.wear();
    }); */
    useWear(e => {
      wearing = e.wear;
    });
    // window.fruitApp = app;
    // window.fruitPhysicsObject = physicsObject;

    useFrame(({timestamp, timeDiff}) => {
      frameCb && frameCb(timestamp, timeDiff);
    });

   

    useCleanup(() => {
      for (const physicsId of physicsIds) {
        physics.removeGeometry(physicsId);
      }
      physics.destroyMaterial(materialAddress);
    });
  }

  return app;
};
