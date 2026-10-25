import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const canvas = document.getElementById('webgl-canvas');
const soundToggleBtn = document.getElementById('sound-toggle');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a1128);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
// Base position (we will offset this with mouse movement)
const baseCameraPos = { x: 0, y: 1.45, z: 3.8 };
camera.position.set(baseCameraPos.x, baseCameraPos.y, baseCameraPos.z);
camera.lookAt(0, 2.3, -15);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// ============================================================================
// COMPOSITION, LIGHTING & FIGURE
// ============================================================================

function createSkyDome() {
  const skyGeo = new THREE.SphereGeometry(400, 32, 32);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTopColor: { value: new THREE.Color(0x0a1128) },
      uMidColor: { value: new THREE.Color(0x162142) },
      uHorizonColor: { value: new THREE.Color(0x282640) }
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uTopColor;
      uniform vec3 uMidColor;
      uniform vec3 uHorizonColor;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition).y;
        float horizonFactor = clamp(smoothstep(-0.05, 0.22, h), 0.0, 1.0);
        float zenithFactor = clamp(smoothstep(0.15, 0.75, h), 0.0, 1.0);
        vec3 col = mix(uHorizonColor, uMidColor, horizonFactor);
        col = mix(col, uTopColor, zenithFactor);
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
  scene.add(new THREE.Mesh(skyGeo, skyMat));
}

function createGround() {
  const groundGeo = new THREE.PlaneGeometry(300, 300, 120, 120);
  groundGeo.rotateX(-Math.PI / 2);
  const pos = groundGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const distFromPerson = Math.hypot(x, z);
    const flattenCenter = THREE.MathUtils.smoothstep(distFromPerson, 2.0, 12.0);
    const undulation = Math.sin(x * 0.06) * Math.cos(z * 0.06) * 0.8 + Math.sin(x * 0.15 + z * 0.1) * 0.25;
    pos.setY(i, undulation * flattenCenter);
  }
  groundGeo.computeVertexNormals();
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x121526, roughness: 1.0 });
  scene.add(new THREE.Mesh(groundGeo, groundMat));
}

function createMountains() {
  const createMountainRange = (depthZ, baseHeight, peakVariance, colorHex, seedOffset) => {
    const width = 360;
    const geo = new THREE.PlaneGeometry(width, baseHeight, 180, 24);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const normalizedY = (y + baseHeight / 2) / baseHeight;
      if (normalizedY > 0.01) {
        const n1 = Math.sin(x * 0.025 + seedOffset) * 1.0;
        const n2 = Math.sin(x * 0.065 - seedOffset * 1.7) * 0.45;
        const n3 = Math.cos(x * 0.14 + seedOffset * 0.5) * 0.2;
        const ridge = Math.max(0.1, (n1 + n2 + n3 + 1.65) * 0.5);
        const edgeTaper = 1.0 - Math.pow(Math.abs(x) / (width * 0.5), 2.5);
        pos.setY(i, -baseHeight / 2 + normalizedY * ridge * peakVariance * Math.max(0.15, edgeTaper));
      }
      pos.setZ(i, pos.getZ(i) + Math.pow(x / (width * 0.5), 2.0) * 28.0);
    }
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: colorHex, side: THREE.DoubleSide, roughness: 1.0 }));
    mesh.position.set(0, baseHeight * 0.22, depthZ);
    scene.add(mesh);
  };
  createMountainRange(-145, 22, 19, 0x1e2138, 1.2); 
  createMountainRange(-110, 18, 13, 0x14172a, 4.5); 
}

function createSeatedFemaleSilhouette() {
  const figureGroup = new THREE.Group();
  
// Brightened colors so they remain visible under the dark night lighting
const skinMat = new THREE.MeshStandardMaterial({ color: 0xd29a76, roughness: 0.7 }); // Warm, visible skin tone
const hairMat = new THREE.MeshStandardMaterial({ color: 0x4a3b32, roughness: 0.9 }); // Visible chestnut/dark brown
const jacketMat = new THREE.MeshStandardMaterial({ color: 0x3a5675, roughness: 0.8 }); // Clear slate blue
const pantsMat = new THREE.MeshStandardMaterial({ color: 0x2a2e3a, roughness: 0.9 }); // Dark grey-blue
const moundMat = new THREE.MeshStandardMaterial({ color: 0x343a4a, roughness: 1.0 }); // Lighter rock tone

  const moundGeo = new THREE.SphereGeometry(0.65, 24, 16);
  moundGeo.scale(1.3, 0.45, 1.15);
  const mound = new THREE.Mesh(moundGeo, moundMat);
  mound.position.set(0, 0.05, 0);
  figureGroup.add(mound);

  const hipsGeo = new THREE.SphereGeometry(0.21, 20, 16);
  hipsGeo.scale(1.15, 0.85, 1.0);
  const hips = new THREE.Mesh(hipsGeo, pantsMat);
  hips.position.set(0, 0.28, 0.05);
  figureGroup.add(hips);

  const torsoGeo = new THREE.CapsuleGeometry(0.165, 0.34, 12, 20);
  torsoGeo.scale(1.1, 1.0, 0.8);
  const torso = new THREE.Mesh(torsoGeo, jacketMat);
  torso.position.set(0, 0.54, 0.08);
  torso.rotation.set(0.15, 0, -0.05); 
  figureGroup.add(torso);

  const shouldersGeo = new THREE.SphereGeometry(0.21, 20, 16);
  shouldersGeo.scale(1.2, 0.55, 0.72);
  const shoulders = new THREE.Mesh(shouldersGeo, jacketMat);
  shoulders.position.set(-0.02, 0.74, 0.1);
  shoulders.rotation.z = -0.05;
  figureGroup.add(shoulders);

  const neckGeo = new THREE.CylinderGeometry(0.052, 0.062, 0.12, 14);
  const neck = new THREE.Mesh(neckGeo, skinMat);
  neck.position.set(-0.03, 0.85, 0.1);
  neck.rotation.set(0.1, 0, -0.05);
  figureGroup.add(neck);

  const headGeo = new THREE.SphereGeometry(0.125, 24, 24);
  headGeo.scale(0.92, 1.08, 0.98);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.set(-0.04, 0.98, 0.08);
  head.rotation.set(0.1, 0.15, 0); 
  figureGroup.add(head);

  const hairBackGeo = new THREE.CapsuleGeometry(0.115, 0.22, 12, 18);
  hairBackGeo.scale(1.05, 1.0, 0.75);
  const hairBack = new THREE.Mesh(hairBackGeo, hairMat);
  hairBack.position.set(-0.04, 0.88, 0.15);
  hairBack.rotation.set(-0.15, 0, -0.05);
  figureGroup.add(hairBack);

  const hairBunGeo = new THREE.SphereGeometry(0.075, 16, 16);
  const hairBun = new THREE.Mesh(hairBunGeo, hairMat);
  hairBun.position.set(-0.05, 0.95, 0.2);
  figureGroup.add(hairBun);

  [-1, 1].forEach((side) => {
    const thighGeo = new THREE.CapsuleGeometry(0.085, 0.32, 10, 16);
    const thigh = new THREE.Mesh(thighGeo, pantsMat);
    thigh.position.set(side * 0.14, 0.38, -0.12);
    thigh.rotation.set(-1.1, 0, side * -0.15);
    figureGroup.add(thigh);

    const calfGeo = new THREE.CapsuleGeometry(0.072, 0.34, 10, 16);
    const calf = new THREE.Mesh(calfGeo, pantsMat);
    calf.position.set(side * 0.16, 0.22, -0.32);
    calf.rotation.x = 0.15;
    figureGroup.add(calf);

    const upperArmGeo = new THREE.CapsuleGeometry(0.058, 0.28, 10, 16);
    const upperArm = new THREE.Mesh(upperArmGeo, jacketMat);
    upperArm.position.set(side * 0.22, 0.58, 0.05);
    upperArm.rotation.set(-0.3, 0, side * 0.15);
    figureGroup.add(upperArm);

    const forearmGeo = new THREE.CapsuleGeometry(0.05, 0.25, 10, 16);
    const forearm = new THREE.Mesh(forearmGeo, skinMat);
    forearm.position.set(side * 0.18, 0.42, -0.1);
    forearm.rotation.set(-0.8, side * -0.2, 0);
    figureGroup.add(forearm);
  });

  figureGroup.position.set(0, 0, 0);
  figureGroup.rotation.y = -0.25; 
  scene.add(figureGroup);
}

createSkyDome();
createGround();
createMountains();
createSeatedFemaleSilhouette();

// --- Updated Lighting Setup ---
const ambientLight = new THREE.AmbientLight(0x162142, 2.5); // Increased overall ambient brightness
scene.add(ambientLight);

const moonLight = new THREE.DirectionalLight(0x89a3d4, 1.2); // Strengthened the moon
moonLight.position.set(-20, 30, -10); 
scene.add(moonLight);

// NEW: A soft, localized light pointing directly at the woman's back to reveal her colors
const figureLight = new THREE.PointLight(0xaabbff, 2.0, 10);
figureLight.position.set(0, 2, 4); // Positioned right behind the camera
scene.add(figureLight);

scene.fog = new THREE.FogExp2(0x0e142e, 0.012);

// ============================================================================
// STARS & NEW PARTICLES (SNOW/DUST)
// ============================================================================

let starField;
function createStars() {
  const starsGeo = new THREE.BufferGeometry();
  const starsCount = 2000;
  const posArray = new Float32Array(starsCount * 3);
  for(let i = 0; i < starsCount; i++) {
    const r = 150 + Math.random() * 150;
    const theta = 2 * Math.PI * Math.random();
    const phi = Math.acos(Math.random()); 
    posArray[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    posArray[i * 3 + 1] = r * Math.cos(phi);
    posArray[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  starsGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  
  const starsMat = new THREE.PointsMaterial({ 
    size: 0.8, 
    color: 0xffffff, 
    transparent: true, 
    opacity: 0.9, 
    sizeAttenuation: true,
    depthWrite: false, 
    blending: THREE.AdditiveBlending 
  });
  
  starField = new THREE.Points(starsGeo, starsMat);
  scene.add(starField);
}
createStars();

let particlesMesh;
function createParticles() {
  const particleGeo = new THREE.BufferGeometry();
  const particleCount = 250; // Keeps it sparse and calm
  const posArray = new Float32Array(particleCount * 3);
  
  for(let i = 0; i < particleCount; i++) {
    // Spread around the camera
    posArray[i * 3] = (Math.random() - 0.5) * 20; 
    posArray[i * 3 + 1] = Math.random() * 10; 
    posArray[i * 3 + 2] = (Math.random() - 0.5) * 15 - 5; 
  }
  
  particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  
  const particleMat = new THREE.PointsMaterial({
    size: 0.04,
    color: 0xffffff,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  
  particlesMesh = new THREE.Points(particleGeo, particleMat);
  scene.add(particlesMesh);
}
createParticles();

// ============================================================================
// AURORA SHADER
// ============================================================================

const auroraUniforms = {
  uTime: { value: 0.0 },
  uColorBottom: { value: new THREE.Color(0x00ffaa) }, 
  uColorMid: { value: new THREE.Color(0x00d4ff) },    
  uColorTop: { value: new THREE.Color(0xcc66ff) }     
};

function createAuroraLayers() {
    // Good balanced height so it rises up into the sky
    const auroraGeo = new THREE.CylinderGeometry(180, 180, 50, 64, 1, true);
    
    const auroraMat = new THREE.ShaderMaterial({
      uniforms: auroraUniforms,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false, 
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColorBottom;
        uniform vec3 uColorMid;
        uniform vec3 uColorTop;
        varying vec2 vUv;
  
        void main() {
          float y = vUv.y;
          float wave1 = sin(vUv.x * 20.0 + uTime * 0.3) * 0.5 + 0.5;
          float wave2 = sin(vUv.x * 12.0 - uTime * 0.2) * 0.5 + 0.5;
          float combinedWave = (wave1 + wave2) * 0.5;
          float streaks = sin(vUv.x * 150.0 + uTime) * 0.1 + 0.9;
          
          vec3 color = mix(uColorBottom, uColorMid, smoothstep(0.0, 0.5, y));
          color = mix(color, uColorTop, smoothstep(0.5, 1.0, y));
          
          float alpha = smoothstep(0.0, 0.2, y) * smoothstep(1.0, 0.6, y);
          alpha *= combinedWave * streaks;
          
          gl_FragColor = vec4(color, alpha * 0.65);
        }
      `
    });
  
    for (let i = 0; i < 3; i++) {
      const auroraMesh = new THREE.Mesh(auroraGeo, auroraMat);
      // Pushed Z back to -125 so it originates from BEHIND the mountains
      // Raised Y to 30 so it climbs nicely into the sky below the title
      auroraMesh.position.set(0, 30, -125 - (i * 15));
      auroraMesh.scale.set(1.0 + (i * 0.1), 1.0 + (i * 0.2), 1.0);
      auroraMesh.rotation.x = 0.05 * i;
      auroraMesh.rotation.y = 0.05 * i;
      scene.add(auroraMesh);
    }
  }
createAuroraLayers();

// ============================================================================
// UI DOM ELEMENTS & LOADING SCREEN
// ============================================================================
const loadingScreen = document.getElementById('loading-screen');
const motionToggleBtn = document.getElementById('motion-toggle');

// Fade out loading screen once everything is ready
window.addEventListener('load', () => {
  setTimeout(() => {
    loadingScreen.classList.add('fade-out');
  }, 800);
});

// ============================================================================
// MOUSE PARALLAX TRACKING
// ============================================================================
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;

const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

document.addEventListener('mousemove', (event) => {
  mouseX = (event.clientX - windowHalfX) * 0.0005;
  mouseY = (event.clientY - windowHalfY) * 0.0005;
});

// ============================================================================
// REDUCE MOTION CONTROLS
// ============================================================================
let isMotionReduced = false;
motionToggleBtn.addEventListener('click', () => {
  isMotionReduced = !isMotionReduced;
  motionToggleBtn.textContent = isMotionReduced ? 'Restore Motion' : 'Reduce Motion';
  motionToggleBtn.setAttribute('aria-pressed', String(isMotionReduced));
});

// ============================================================================
// POST-PROCESSING & ANIMATION LOOP
// ============================================================================
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.2, 
  0.6, 
  0.85 
);
const outputPass = new OutputPass();
const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);
composer.addPass(outputPass);

const clock = new THREE.Clock();
let customTime = 0;

function animate() {
  requestAnimationFrame(animate);
  
  const delta = clock.getDelta();
  const speedMultiplier = isMotionReduced ? 0.05 : 1.0; 
  
  // 1. Aurora Movement (Accumulate custom time based on speed)
  customTime += delta * speedMultiplier;
  auroraUniforms.uTime.value = customTime;
  
  // 2. Gentle Star Rotation
  if (starField) {
    starField.rotation.y += (0.05 * delta) * speedMultiplier;
  }
  
  // 3. Falling Snow / Dust
  if (particlesMesh) {
    const positions = particlesMesh.geometry.attributes.position.array;
    for(let i = 1; i < positions.length; i += 3) {
      positions[i] -= (0.3 * delta) * speedMultiplier;
      positions[i - 1] += Math.sin(customTime * 0.5 + positions[i + 1]) * (0.1 * delta) * speedMultiplier;
      
      if (positions[i] < 0) {
        positions[i] = 10;
      }
    }
    particlesMesh.geometry.attributes.position.needsUpdate = true;
  }
  
  // 4. Camera Parallax (Disabled if motion is reduced)
  const parallaxMultiplier = isMotionReduced ? 0 : 1;
  targetX = mouseX * parallaxMultiplier;
  targetY = mouseY * parallaxMultiplier;
  
  camera.position.x += (targetX - camera.position.x) * 0.02;
  camera.position.y += (baseCameraPos.y - targetY - camera.position.y) * 0.02;
  camera.lookAt(0, 2.3, -15);
  
  composer.render();
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  composer.setSize(window.innerWidth, window.innerHeight);
});

// (Keep your existing soundToggleBtn event listener and fadeAudio function here)

// ============================================================================
// STEP 6: SOUND CONTROLS & AMBIENCE (Updated Levels)
// ============================================================================

// Initialize audio objects
const musicTrack = new Audio('./M_by_Anil_Emre.mp3');
musicTrack.loop = true;
musicTrack.volume = 0; 

const windTrack = new Audio('./wind.mp3');
windTrack.loop = true;
windTrack.volume = 0;

// Updated target volumes: lower music, stronger wind presence
const targetMusicVolume = 0.15; 
const targetWindVolume = 0.30;  

let isSoundOn = false;
let fadeInterval;

function fadeAudio(turningOn) {
  clearInterval(fadeInterval);
  
  if (turningOn) {
    musicTrack.play().catch(err => console.warn("Music play blocked:", err));
    windTrack.play().catch(err => console.warn("Wind play blocked:", err));
  }

  fadeInterval = setInterval(() => {
    let fadingComplete = true;
    
    if (turningOn) {
      if (musicTrack.volume < targetMusicVolume - 0.02) {
        musicTrack.volume = Math.min(targetMusicVolume, musicTrack.volume + 0.02);
        fadingComplete = false;
      }
      if (windTrack.volume < targetWindVolume - 0.02) {
        windTrack.volume = Math.min(targetWindVolume, windTrack.volume + 0.02);
        fadingComplete = false;
      }
    } else {
      if (musicTrack.volume > 0.02) {
        musicTrack.volume = Math.max(0, musicTrack.volume - 0.02);
        fadingComplete = false;
      }
      if (windTrack.volume > 0.02) {
        windTrack.volume = Math.max(0, windTrack.volume - 0.02);
        fadingComplete = false;
      }
    }

    if (fadingComplete) {
      clearInterval(fadeInterval);
      if (!turningOn) {
        musicTrack.pause();
        windTrack.pause();
      }
    }
  }, 50); 
}

soundToggleBtn.addEventListener('click', () => {
  isSoundOn = !isSoundOn;
  soundToggleBtn.textContent = isSoundOn ? 'Sound On' : 'Sound Off';
  soundToggleBtn.setAttribute('aria-pressed', String(isSoundOn));
  
  fadeAudio(isSoundOn);
});