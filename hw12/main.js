import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let camera, scene, renderer;
let mixers = [];
const clock = new THREE.Clock();

function showError(msg) {
  const el = document.getElementById('err');
  el.style.display = 'block';
  el.textContent = msg;
}

init();

function init() {
  // --- Сцена ---
  scene = new THREE.Scene();

  // --- Камера (глядач у точці (0,0,0), дивиться вздовж -Z) ---
  camera = new THREE.PerspectiveCamera(
    70, window.innerWidth / window.innerHeight, 0.01, 100
  );
  // Для desktop-перегляду трохи відсунемо камеру назад
  camera.position.set(0, 1.4, 0);

  // --- Освітлення ---
  const hemi = new THREE.HemisphereLight(0xffffff, 0x444466, 1.2);
  hemi.position.set(0, 2, 0);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xffffff, 1.5);
  dir.position.set(1, 3, 2);
  scene.add(dir);

  // --- Рендерер з увімкненим WebXR ---
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x0a0a12, 1);  // фон для desktop; в AR стане прозорим
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  // --- Кнопка входу в AR ---
  const arButton = ARButton.createButton(renderer, {
    optionalFeatures: ['local-floor', 'bounded-floor'],
  });
  document.body.appendChild(arButton);

  // В AR-режимі фон робимо прозорим (видно камеру пристрою)
  renderer.xr.addEventListener('sessionstart', () => {
    renderer.setClearAlpha(0);
    scene.background = null;
  });
  renderer.xr.addEventListener('sessionend', () => {
    renderer.setClearColor(0x0a0a12, 1);
  });

  // --- OrbitControls для перегляду на комп'ютері (не заважає AR) ---
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.2, -2);   // дивимось у центр між моделями
  controls.update();

  // --- Допоміжна "підлога"-сітка для орієнтації (лише desktop) ---
  const grid = new THREE.GridHelper(10, 20, 0x444466, 0x222233);
  grid.position.y = 0;
  scene.add(grid);

  // --- Підписи-маркери ліворуч / праворуч ---
  addLabelMarker(-1, 0x4ade80);  // ліворуч — зелений
  addLabelMarker(1, 0xf472b6);   // праворуч — рожевий

  // ===================================================
  //  ЗАВАНТАЖЕННЯ ДВОХ GLTF-МОДЕЛЕЙ
  //  Відносні координати глядача:
  //   - ЛІВОРУЧ  = від'ємний X  (-1)
  //   - ПРАВОРУЧ = додатний X   (+1)
  //   - перед глядачем = від'ємний Z (-2)
  // ===================================================
  const loader = new GLTFLoader();
  const BASE = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/';

  // МОДЕЛЬ 1 — ФЛАМІНГО, ЛІВОРУЧ
  loader.load(
    BASE + 'Flamingo.glb',
    (gltf) => {
      const model = gltf.scene;
      model.scale.set(0.008, 0.008, 0.008);
      model.position.set(-1, 1.2, -2);   // ЛІВОРУЧ від глядача
      model.rotation.y = Math.PI / 2;     // повернути обличчям до центру
      scene.add(model);
      // анімація польоту крил
      if (gltf.animations.length) {
        const mixer = new THREE.AnimationMixer(model);
        mixer.clipAction(gltf.animations[0]).play();
        mixers.push(mixer);
      }
    },
    undefined,
    (e) => showError('Не вдалося завантажити модель фламінго: ' + e.message)
  );

  // МОДЕЛЬ 2 — ПАПУГА, ПРАВОРУЧ
  loader.load(
    BASE + 'Parrot.glb',
    (gltf) => {
      const model = gltf.scene;
      model.scale.set(0.008, 0.008, 0.008);
      model.position.set(1, 1.2, -2);     // ПРАВОРУЧ від глядача
      model.rotation.y = -Math.PI / 2;    // повернути обличчям до центру
      scene.add(model);
      if (gltf.animations.length) {
        const mixer = new THREE.AnimationMixer(model);
        mixer.clipAction(gltf.animations[0]).play();
        mixers.push(mixer);
      }
    },
    undefined,
    (e) => showError('Не вдалося завантажити модель папуги: ' + e.message)
  );

  window.addEventListener('resize', onResize);
  renderer.setAnimationLoop(animate);
}

// Маркер-стовпчик під моделлю, щоб позиція ліво/право була наочною
function addLabelMarker(x, color) {
  const geo = new THREE.CylinderGeometry(0.03, 0.03, 1.2, 12);
  const mat = new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: 0.4,
    transparent: true, opacity: 0.5,
  });
  const pillar = new THREE.Mesh(geo, mat);
  pillar.position.set(x, 0.6, -2);
  scene.add(pillar);

  // світна основа
  const ringGeo = new THREE.RingGeometry(0.12, 0.18, 24);
  const ringMat = new THREE.MeshBasicMaterial({
    color, side: THREE.DoubleSide, transparent: true, opacity: 0.7,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(x, 0.01, -2);
  scene.add(ring);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  const delta = clock.getDelta();
  mixers.forEach((m) => m.update(delta));
  renderer.render(scene, camera);
}
