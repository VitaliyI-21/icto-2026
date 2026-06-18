import * as THREE from 'three';
import { ARButton } from 'ARButton';
import { OrbitControls } from 'OrbitControls';

document.addEventListener('DOMContentLoaded', () => {

  // ===== Базові компоненти =====
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    70, window.innerWidth / window.innerHeight, 0.01, 50
  );

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x0a0a14, 1);   // фон для desktop; в AR стане прозорим

  // ===== Активація WebXR =====
  renderer.xr.enabled = true;

  // ===== ARButton (за методичкою) =====
  const arButton = ARButton.createButton(renderer, {
    optionalFeatures: ['dom-overlay'],
    domOverlay: { root: document.body }
  });

  document.body.appendChild(renderer.domElement);
  document.body.appendChild(arButton);

  // В AR фон прозорий (видно довкілля)
  renderer.xr.addEventListener('sessionstart', () => {
    renderer.setClearAlpha(0);
    scene.background = null;
  });
  renderer.xr.addEventListener('sessionend', () => {
    renderer.setClearColor(0x0a0a14, 1);
  });

  // ===== Освітлення =====
  const hemi = new THREE.HemisphereLight(0xffffff, 0x444466, 1.4);
  hemi.position.set(0, 1, 0);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 1.2);
  dir.position.set(0.5, 1, 0.5);
  scene.add(dir);

  // ===== OrbitControls для перегляду на комп'ютері =====
  // (камеру ставимо так, щоб вежі було видно перед нею)
  camera.position.set(0, 0.05, 0.2);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, -0.2, -0.5);
  controls.update();

  // =====================================================
  //  МОДЕЛЬ ХАНОЙСЬКИХ ВЕЖ
  //  Координати у метрах. Конструкція перед користувачем:
  //   центр у (0, -0.25, -0.5) — 50 см попереду, 25 см нижче
  // =====================================================
  const towers = new THREE.Group();
  towers.position.set(0, -0.25, -0.5);
  scene.add(towers);

  // Геометричні параметри (метри)
  const N = 7;                       // кількість кілець
  const PEG_GAP = 0.20;              // відстань між стрижнями
  const PEG_X = [-PEG_GAP, 0, PEG_GAP];  // X лівого/середнього/правого стрижнів
  const BASE_Y = 0;                  // рівень основи
  const RING_H = 0.022;              // висота (товщина) кільця
  const PEG_H = 0.20;                // висота стрижня

  // Основа (платформа)
  const baseGeo = new THREE.BoxGeometry(PEG_GAP * 2 + 0.12, 0.012, 0.12);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x5a4632, roughness: 0.9 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.set(0, BASE_Y - 0.006, 0);
  towers.add(base);

  // Три стрижні
  const pegMat = new THREE.MeshStandardMaterial({ color: 0x8a6d4a, roughness: 0.7 });
  PEG_X.forEach((x) => {
    const pegGeo = new THREE.CylinderGeometry(0.006, 0.006, PEG_H, 16);
    const peg = new THREE.Mesh(pegGeo, pegMat);
    peg.position.set(x, BASE_Y + PEG_H / 2, 0);
    towers.add(peg);
  });

  // Кольори веселки для 7 кілець (1 — найбільше/червоне знизу ... 7 — найменше/фіолетове зверху)
  const RAINBOW = [
    0xff0000, // 1 червоний
    0xff7f00, // 2 помаранчевий
    0xffd400, // 3 жовтий
    0x00c800, // 4 зелений
    0x0096ff, // 5 блакитний
    0x3232ff, // 6 синій
    0x9400d3, // 7 фіолетовий
  ];

  // Створення кілець. Кільце i (1..7): більший i — менший радіус.
  // Спочатку всі на ЛІВОМУ стрижні (індекс 0), знизу вгору: 1,2,...,7
  const rings = [];          // масив об'єктів {mesh, size}
  const pegStacks = [[], [], []]; // що лежить на кожному стрижні (знизу вгору)

  for (let i = 1; i <= N; i++) {
    const outer = 0.018 + (N - i) * 0.0075;   // зовнішній радіус (кільце 1 найбільше)
    const inner = 0.009;                       // внутрішній отвір (для стрижня)
    const ringGeo = new THREE.TorusGeometry(outer, RING_H / 2, 16, 40);
    const ringMat = new THREE.MeshStandardMaterial({
      color: RAINBOW[i - 1], roughness: 0.35, metalness: 0.15,
      emissive: RAINBOW[i - 1], emissiveIntensity: 0.12,
    });
    const mesh = new THREE.Mesh(ringGeo, ringMat);
    mesh.rotation.x = Math.PI / 2;   // покласти горизонтально
    towers.add(mesh);

    const ring = { mesh, size: i, outer };
    rings.push(ring);
  }

  // Початкове розкладання на лівому стрижні.
  // Кладемо найменші знизу (7,6,...,1 знизу вгору), щоб найбільше (1) було ЗВЕРХУ.
  // Тоді, знімаючи верхні першими, великі кільця ляжуть на дно цільових стрижнів,
  // утворюючи природні піраміди (більше знизу).
  for (let i = N; i >= 1; i--) {
    const ring = rings[i - 1];
    pegStacks[0].push(ring);
    const level = pegStacks[0].length - 1;          // позиція в стопці
    ring.mesh.position.set(PEG_X[0], BASE_Y + RING_H / 2 + level * RING_H, 0);
    ring.peg = 0;
  }

  // =====================================================
  //  АНІМАЦІЯ ПЕРЕМІЩЕННЯ
  //  Парні кільця (2,4,6) -> середній стрижень (індекс 1)
  //  Непарні кільця (1,3,5,7) -> правий стрижень (індекс 2)
  //  Знімаємо завжди ВЕРХНЄ кільце лівого стрижня.
  //  Порядок зняття (зверху вниз): 1,2,3,4,5,6,7
  // =====================================================
  const moveQueue = [];
  for (let i = 1; i <= N; i++) {
    const targetPeg = (i % 2 === 0) ? 1 : 2;  // парне -> 1 (середній), непарне -> 2 (правий)
    moveQueue.push({ ring: rings[i - 1], targetPeg });
  }

  // Стан поточної анімації переміщення
  let active = null;       // {ring, fromX, toX, phase, t, peakY, endLevel}
  let queueIndex = 0;
  const SPEED = 0.9;       // швидкість фаз анімації
  const LIFT_Y = BASE_Y + PEG_H + 0.05;  // висота підйому над стрижнями

  function startNextMove() {
    if (queueIndex >= moveQueue.length) { active = null; return; }
    const { ring, targetPeg } = moveQueue[queueIndex];

    // прибрати кільце з його поточного стрижня (воно зверху)
    const from = ring.peg;
    pegStacks[from].pop();

    // куди приземлиться (на верх цільового стрижня)
    const endLevel = pegStacks[targetPeg].length;
    const endY = BASE_Y + RING_H / 2 + endLevel * RING_H;

    active = {
      ring,
      fromX: PEG_X[from],
      toX: PEG_X[targetPeg],
      startY: ring.mesh.position.y,
      endY,
      phase: 'up',  // up -> across -> down
      t: 0,
      targetPeg, endLevel,
    };
  }
  startNextMove();

  function updateAnimation(delta) {
    if (!active) return;
    active.t += delta * SPEED;
    const r = active.ring.mesh;
    const t = Math.min(active.t, 1);
    const ease = t * t * (3 - 2 * t);  // smoothstep

    if (active.phase === 'up') {
      r.position.x = active.fromX;
      r.position.y = THREE.MathUtils.lerp(active.startY, LIFT_Y, ease);
      if (active.t >= 1) { active.phase = 'across'; active.t = 0; }
    } else if (active.phase === 'across') {
      r.position.y = LIFT_Y;
      r.position.x = THREE.MathUtils.lerp(active.fromX, active.toX, ease);
      if (active.t >= 1) { active.phase = 'down'; active.t = 0; }
    } else if (active.phase === 'down') {
      r.position.x = active.toX;
      r.position.y = THREE.MathUtils.lerp(LIFT_Y, active.endY, ease);
      if (active.t >= 1) {
        // завершено: поставити кільце на цільовий стрижень
        const ring = active.ring;
        pegStacks[active.targetPeg].push(ring);
        ring.peg = active.targetPeg;
        r.position.set(active.toX, active.endY, 0);
        queueIndex++;
        // пауза перед наступним рухом
        active = { phase: 'pause', t: 0, ring: null };
      }
    } else if (active.phase === 'pause') {
      if (active.t >= 0.6) startNextMove();
    }
  }

  // Після завершення всіх рухів — цикл перезапускається через паузу
  let restartTimer = 0;
  function maybeRestart(delta) {
    if (queueIndex >= moveQueue.length && (!active || active.phase === 'pause')) {
      restartTimer += delta;
      if (restartTimer > 2.5) {
        restartTimer = 0;
        resetScene();
      }
    }
  }

  function resetScene() {
    // повернути всі кільця на лівий стрижень (найбільше зверху)
    pegStacks[0] = []; pegStacks[1] = []; pegStacks[2] = [];
    for (let i = N; i >= 1; i--) {
      const ring = rings[i - 1];
      pegStacks[0].push(ring);
      const level = pegStacks[0].length - 1;
      ring.mesh.position.set(PEG_X[0], BASE_Y + RING_H / 2 + level * RING_H, 0);
      ring.peg = 0;
    }
    queueIndex = 0;
    startNextMove();
  }

  // ===== Цикл анімації WebXR =====
  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const delta = Math.min(clock.getDelta(), 0.05);
    updateAnimation(delta);
    maybeRestart(delta);
    renderer.render(scene, camera);
  });

  // ===== Адаптація під зміну розміру вікна =====
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
});
