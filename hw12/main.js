// Завантаження GLTF-моделей за методичкою (розділ 4.2, 4.7)
import { loadGLTF } from "./loader.js";

// Перевірка завантаження MindAR
if (!window.MINDAR || !window.MINDAR.FACE) {
  document.body.insertAdjacentHTML('afterbegin',
    '<div style="position:fixed;top:0;left:0;right:0;z-index:99;background:#b41e1e;' +
    'color:#fff;padding:14px;font-family:sans-serif;font-size:14px;">' +
    'Помилка: бібліотека MindAR не завантажилась.</div>');
  throw new Error('window.MINDAR.FACE is undefined');
}

// THREE з глобального об'єкта MindAR (методичка 4.1)
const THREE = window.MINDAR.FACE.THREE;

// Масив мікшерів анімації моделей
const mixers = [];

function showError(msg) {
  const el = document.getElementById('err');
  el.style.display = 'block';
  el.textContent = msg;
}

document.addEventListener("DOMContentLoaded", () => {

  const start = async () => {
    // Ініціалізація AR-рушія MindAR Face
    const mindarThree = new window.MINDAR.FACE.MindARThree({
      container: document.body,
    });
    const { renderer, scene, camera } = mindarThree;

    // Прозоре полотно, щоб було видно відео з камери
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.backgroundColor = 'transparent';

    // Освітлення (напівсферичне + напрямлене перед обличчям)
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    const light2 = new THREE.DirectionalLight(0xffffff, 0.8);
    light2.position.set(0, 1, 2);
    scene.add(light);
    scene.add(light2);

    // ===================================================
    //  ЯКОРІ НА БІЧНИХ ОПОРНИХ ТОЧКАХ ОБЛИЧЧЯ
    //   127 — ліва скроня (ЛІВОРУЧ від людини)
    //   356 — права скроня (ПРАВОРУЧ від людини)
    //  Моделі, прив'язані до них, рухаються разом з головою
    // ===================================================
    const leftAnchor  = mindarThree.addAnchor(127);  // ЛІВОРУЧ
    const rightAnchor = mindarThree.addAnchor(356);   // ПРАВОРУЧ

    const BASE = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/';

    // --- МОДЕЛЬ 1: ФЛАМІНГО, ЛІВОРУЧ ---
    try {
      const flamingo = await loadGLTF(BASE + 'Flamingo.glb');
      flamingo.scene.scale.set(0.003, 0.003, 0.003);
      // зміщення відносно скроні: ще трохи вліво та вперед
      flamingo.scene.position.set(-0.35, 0, 0);
      flamingo.scene.rotation.y = Math.PI / 2;  // обличчям до людини
      leftAnchor.group.add(flamingo.scene);

      // анімація крил
      if (flamingo.animations && flamingo.animations.length) {
        const mixer = new THREE.AnimationMixer(flamingo.scene);
        mixer.clipAction(flamingo.animations[0]).play();
        mixers.push(mixer);
      }
    } catch (e) {
      showError('Не вдалося завантажити фламінго: ' + e.message);
    }

    // --- МОДЕЛЬ 2: ПАПУГА, ПРАВОРУЧ ---
    try {
      const parrot = await loadGLTF(BASE + 'Parrot.glb');
      parrot.scene.scale.set(0.003, 0.003, 0.003);
      parrot.scene.position.set(0.35, 0, 0);  // ще трохи вправо
      parrot.scene.rotation.y = -Math.PI / 2; // обличчям до людини
      rightAnchor.group.add(parrot.scene);

      if (parrot.animations && parrot.animations.length) {
        const mixer = new THREE.AnimationMixer(parrot.scene);
        mixer.clipAction(parrot.animations[0]).play();
        mixers.push(mixer);
      }
    } catch (e) {
      showError('Не вдалося завантажити папугу: ' + e.message);
    }

    // Запуск AR-рушія
    await mindarThree.start();

    // Цикл рендерингу з оновленням анімацій
    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      const delta = clock.getDelta();
      mixers.forEach((m) => m.update(delta));
      renderer.render(scene, camera);
    });
  };

  start();
});
