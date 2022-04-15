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
const sparkle = textureLoader.load(`${baseUrl}/textures/sparkle.png`);
const circle = textureLoader.load(`${baseUrl}/textures/Circle18.png`);
const splashTexture12 = textureLoader.load(`${baseUrl}/textures/splash12.png`);

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



  app.name = 'fruit';

  // console.log('got app', app, app.components);
  const fileNameComponent = app.components.find(c => c.key === 'fileName') ;
  const fileName = fileNameComponent?.value;
  if (fileName) {
  //################################################################### crunch particle ##########################################################################################
    const crunchParticleCount = 21;
    const flashParticleCount = 3;
    const pixelParticleCount = 15;
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
    const _getFlashGeometry = geometry => {
        const geometry2 = new THREE.BufferGeometry();
        ['position', 'normal', 'uv'].forEach(k => {
          geometry2.setAttribute(k, geometry.attributes[k]);
        });
        geometry2.setIndex(geometry.index);
        
        const positions = new Float32Array(flashParticleCount * 3);
        const positionsAttribute = new THREE.InstancedBufferAttribute(positions, 3);
        geometry2.setAttribute('positions', positionsAttribute);
        
        const swAttribute = new THREE.InstancedBufferAttribute(new Float32Array(flashParticleCount), 1);
        swAttribute.setUsage(THREE.DynamicDrawUsage);
        geometry2.setAttribute('sw', swAttribute);

        const scales = new Float32Array(flashParticleCount);
        const scaleAttribute = new THREE.InstancedBufferAttribute(scales, 1);
        geometry2.setAttribute('scales', scaleAttribute);

        const id = new Float32Array(flashParticleCount);
        const idAttribute = new THREE.InstancedBufferAttribute(id, 1);
        geometry2.setAttribute('id', idAttribute);
    
        return geometry2;
    };
    const pixelGeometry = new THREE.BufferGeometry()
    let group = new THREE.Group();
    {
      const positions = new Float32Array(pixelParticleCount * 3);
      for(let i = 0; i < pixelParticleCount * 3; i++)
        positions[i] = 0;
      pixelGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const opacity = new Float32Array(pixelParticleCount * 1);
      pixelGeometry.setAttribute('opacity', new THREE.BufferAttribute(opacity, 1));

      const scales = new Float32Array(pixelParticleCount * 1);
      pixelGeometry.setAttribute('scales', new THREE.BufferAttribute(scales, 1));

    }
    


    //##################################################### flash material #####################################################
    const flashMaterial = new THREE.ShaderMaterial({
        uniforms: {
            cameraBillboardQuaternion: {
                value: new THREE.Quaternion(),
            },
            flashTexture:{value: splashTexture12},
            sparkleTexture: { type: 't', value: sparkle },
            circleTexture: { type: 't', value: circle },
            avatarPos:{
                value: new THREE.Vector3(0,0,0)
            },
        },
        vertexShader: `\
            ${THREE.ShaderChunk.common}
            ${THREE.ShaderChunk.logdepthbuf_pars_vertex}

            uniform vec4 cameraBillboardQuaternion;
    
            varying vec2 vUv;
            varying vec3 vPos;
            varying float vId;
            
            attribute vec3 positions;
            attribute float scales;
            attribute float id;
            
            vec3 rotateVecQuat(vec3 position, vec4 q) {
                vec3 v = position.xyz;
                return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
            }
        
            void main() {
                vUv=uv;
                vId=id;
                vPos = position;
                vec3 pos = position;
                if(id>0.5 && id<=1.)
                    pos.y*=0.03;
                
                pos = rotateVecQuat(pos, cameraBillboardQuaternion);
                pos*=scales;
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
            
            varying vec2 vUv;
            varying float vId;
            varying vec3 vPos;
          
            uniform sampler2D flashTexture;
            uniform sampler2D sparkleTexture;
            uniform sampler2D circleTexture;
            uniform vec3 avatarPos;
            
            void main() {
                vec4 flash = texture2D( flashTexture,vUv);
                vec4 sparkle = texture2D(sparkleTexture, vUv);
                vec4 circle = texture2D(circleTexture, vUv);
                
              
                if(vId>0.2 && vId<=1.)
                    gl_FragColor = flash;
                else if(vId>=1.5)
                    gl_FragColor = sparkle;
                else if(vId<0.2)
                    gl_FragColor = circle;
                if(vId>=0. && vId<=1.)
                    gl_FragColor.rgb *= vec3(0.0376, 0.940, 0.474);
                else
                    gl_FragColor.rgb *= vec3(0.444, 0.999, 0.777);
                if(vId<0.2)
                    gl_FragColor.a *= distance(avatarPos,vPos)*2.;
                ${THREE.ShaderChunk.logdepthbuf_fragment}
            }
        `,
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        
    });
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
            vec4 mask = texture2D(sphere,vUv);
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
    const pixelMaterial = new THREE.ShaderMaterial({
      vertexShader: `\
          ${THREE.ShaderChunk.common}
          ${THREE.ShaderChunk.logdepthbuf_pars_vertex}

          varying vec2 vUv;
          varying vec3 vPos;
          varying float vOpacity;
          varying float vScales;
          
          attribute vec3 positions;
          attribute float opacity;
          attribute float scales;
          
      
          void main() {
              vUv=uv;
              vPos = position;
              vOpacity = opacity;
              vScales = scales;
              vec3 pos = position;
              
             
              vec4 modelPosition = modelMatrix * vec4(position, 1.0);
              vec4 viewPosition = viewMatrix * modelPosition;
              vec4 projectionPosition = projectionMatrix * viewPosition;
          
              gl_Position = projectionPosition;
              gl_PointSize = 35.0*scales;
              vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
              bool isPerspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 );
                  if ( isPerspective ) gl_PointSize *= (1.0 / - viewPosition.z);
              ${THREE.ShaderChunk.logdepthbuf_vertex}
          }
      `,
      fragmentShader: `\
          ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
          
          varying vec2 vUv;
          varying vec3 vPos;
          varying float vOpacity;
          varying float vScales;
          void main() {
              
              gl_FragColor= vec4(0.0,vScales,0.3,1.0);
              gl_FragColor.a *= vOpacity;
              ${THREE.ShaderChunk.logdepthbuf_fragment}
          }
      `,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      
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
    let flashMesh=null;
    const addInstancedMesh2=()=>{
        const geometry2 = new THREE.PlaneGeometry( 0.5, 0.5 );
        const geometry =_getFlashGeometry(geometry2)
        flashMesh = new THREE.InstancedMesh(
            geometry,
            flashMaterial,
            flashParticleCount
        );
        
        const idAttribute = flashMesh.geometry.getAttribute('id');
        for (let i = 0; i < flashParticleCount; i++) {
            idAttribute.setX(i,i);
        }
        idAttribute.needsUpdate = true;
    }
    addInstancedMesh2();
    const pixel = new THREE.Points(pixelGeometry, pixelMaterial);
    group.add(pixel);
    

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
      let circlePlay = false;
      let materialStart = false;
      let dir = new THREE.Vector3();
      let storeMaterial = false;
      let materials=[];
      frameCb = (timestamp, timeDiff) => {
        if(localPlayer.avatar && !storeMaterial){
            if(localPlayer.avatar.app.children[0]){
                for(let i=0;i<localPlayer.avatar.app.children[0].children.length;i++){
                    if(localPlayer.avatar.app.children[0].children[i].name==='Face' || localPlayer.avatar.app.children[0].children[i].name==='Bodybaked'){
                        for(let j=0;j<localPlayer.avatar.app.children[0].children[i].children.length;j++){
                            if(localPlayer.avatar.app.children[0].children[i].children[j].material[0].constructor.name=='MToonMaterial'){
                                materials.push(localPlayer.avatar.app.children[0].children[i].children[j].material[0]);
                            }
                        }
                    }
                }
                storeMaterial=true;
            }
        }
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
            scene.add(flashMesh);
            scene.add(group);
            particleAlreadyInScene=true;
          }
          //######################### crunch attribute ##############################
          const splashOpacityAttribute = crunchMesh.geometry.getAttribute('opacity');
          const splashPositionsAttribute = crunchMesh.geometry.getAttribute('positions');
          const splashRandomAttribute = crunchMesh.geometry.getAttribute('random');
          const splashDegree = fruit.scale.x / 0.2;

          //######################### flash attribute ##############################
          const swAttribute = flashMesh.geometry.getAttribute('sw');
          const positionsAttribute = flashMesh.geometry.getAttribute('positions');
          const scalesAttribute = flashMesh.geometry.getAttribute('scales');
          const idAttribute = flashMesh.geometry.getAttribute('id');

          //######################### pixel attribute ##############################
          const pixelOpacityAttribute = pixel.geometry.getAttribute('opacity');
          const pixelPositionAttribute = pixel.geometry.getAttribute('position');
          const pixelScaleAttribute = pixel.geometry.getAttribute('scales');

          if (localPlayer.getAction('use')) {
            const v = localPlayer.actionInterpolants.use.get();
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
              for (let i = 0; i < flashParticleCount; i++) {
                dir.x = camera.position.x-localPlayer.position.x;
                dir.y = camera.position.y-localPlayer.position.y;
                dir.z = camera.position.z-localPlayer.position.z;
                dir.normalize();
                if(localPlayer.avatar)
                  positionsAttribute.setXYZ(i, localPlayer.position.x+dir.x, localPlayer.position.y+dir.y-localPlayer.avatar.height/9, localPlayer.position.z+dir.z);
                scalesAttribute.setX(i, 0.1);
                swAttribute.setX(i, 1);
              }
              for(let i = 0; i < pixelParticleCount; i++){
                  pixelScaleAttribute.setX(i,0.5+0.5*Math.random());
                  pixelOpacityAttribute.setX(i,1);
                  pixelPositionAttribute.setXYZ(i,(Math.random()-0.5)*0.5,-0.5+(Math.random())*-1.5,(Math.random()-0.5)*0.5);
              }

              for (const physicsId of physicsIds) {
                physics.removeGeometry(physicsId);
              }
              removeFruitFromApp = true;
              scene.remove(crunchMesh);
              app.remove(fruit);
              // app.unwear();
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
          //#################################### handle flash #######################################
          for (let i = 0; i < flashParticleCount; i++) {
              dir.x = camera.position.x-localPlayer.position.x;
              dir.y = camera.position.y-localPlayer.position.y;
              dir.z = camera.position.z-localPlayer.position.z;
              dir.normalize();
              if(localPlayer.avatar)
                positionsAttribute.setXYZ(i, localPlayer.position.x+dir.x, localPlayer.position.y+dir.y-localPlayer.avatar.height/9, localPlayer.position.z+dir.z);
              switch (idAttribute.getX(i)) {
                  case 0: {
                      if(circlePlay){
                          if(scalesAttribute.getX(i)<1.5){
                              scalesAttribute.setX(i, scalesAttribute.getX(i)+0.3);
                          }
                          else{
                              scalesAttribute.setX(i, 0);
                              circlePlay = false;
                              // app.unwear();
                              for(let i=0;i<materials.length;i++){
                                  materials[i].uniforms.emissionColor.value.g = 0.9;
                              }
                              materialStart =true;
                              scene.remove(flashMesh);
                          }
                      }
                      
                      break;
                  }
                  case 1: {
                      if(scalesAttribute.getX(i)<5){
                          if(swAttribute.getX(i)>=1)
                              scalesAttribute.setX(i, scalesAttribute.getX(i)+0.9);
                          else{
                              if(scalesAttribute.getX(i)>0)
                                  scalesAttribute.setX(i, scalesAttribute.getX(i)-0.8);
                              else{
                                  scalesAttribute.setX(i, 0);
                              }
                          }
                      }
                      else{
                          swAttribute.setX(i,0.95);
                          scalesAttribute.setX(i, 4.9);
                          if(!circlePlay)
                              circlePlay = true;
                      }
                      break;
                  }
                  case 2: {
                      if(scalesAttribute.getX(i)<4){
                          if(swAttribute.getX(i)>=1)
                              scalesAttribute.setX(i, scalesAttribute.getX(i)+0.9);
                          else{
                              if(scalesAttribute.getX(i)>0)
                                  scalesAttribute.setX(i, scalesAttribute.getX(i)-0.8);
                              else
                                  scalesAttribute.setX(i, 0);
                          }
                      }
                      else{
                          swAttribute.setX(i,0.95);
                          scalesAttribute.setX(i, 3.9);
                      }
                      break;
                  }
              }
          }
          
          idAttribute.needsUpdate = true;
          positionsAttribute.needsUpdate = true;
          swAttribute.needsUpdate = true;
          scalesAttribute.needsUpdate = true;
          flashMesh.material.uniforms.cameraBillboardQuaternion.value.copy(camera.quaternion);
          flashMesh.material.uniforms.avatarPos.x=localPlayer.position.x;
          flashMesh.material.uniforms.avatarPos.y=localPlayer.position.y;
          flashMesh.material.uniforms.avatarPos.z=localPlayer.position.z;

          //#################################### handle pixel #######################################
          for(let i = 0; i < pixelParticleCount; i++){
              if(pixelOpacityAttribute.getX(i)>0){
                  pixelScaleAttribute.setX(i,pixelScaleAttribute.getX(i)-0.01);
                  pixelOpacityAttribute.setX(i,pixelOpacityAttribute.getX(i)-(0.01+Math.random()*0.03));
                  pixelPositionAttribute.setY(i,pixelPositionAttribute.getY(i)+0.02);
              }
                  
              else
                  pixelOpacityAttribute.setX(i,0);
          }
          pixelOpacityAttribute.needsUpdate = true;
          pixelPositionAttribute.needsUpdate = true;
          pixelScaleAttribute.needsUpdate = true;
          group.position.copy(localPlayer.position);

          fruit.position.set(0, 0, 0);
          fruit.quaternion.identity();
          
          if(materialStart){
            for(let i=0;i<materials.length;i++){
                if(materials[i].uniforms.emissionColor.value.g>0)
                    materials[i].uniforms.emissionColor.value.g -= 0.025;
                else{
                  materials[i].uniforms.emissionColor.value.g = 0;
                  app.unwear();
                  scene.remove(group);
                }
                    
            }
          }
        }
        fruit.updateMatrixWorld();
        group.updateMatrixWorld();
        
        
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
    });
  }

  return app;
};