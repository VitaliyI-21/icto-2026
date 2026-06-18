// Перевірка завантаження MindAR
if (!window.MINDAR || !window.MINDAR.FACE) {
  document.body.insertAdjacentHTML('afterbegin',
    '<div style="position:fixed;top:0;left:0;right:0;z-index:99;background:#b41e1e;' +
    'color:#fff;padding:14px;font-family:sans-serif;font-size:14px;">' +
    'Помилка: бібліотека MindAR не завантажилась.</div>');
  throw new Error('window.MINDAR.FACE is undefined');
}

// THREE з глобального об'єкта MindAR (методичка, розділ 4.1)
const THREE = window.MINDAR.FACE.THREE;

// Завантаження текстури (аналог loadTexture з loader.js, методичка 4.3)
const loadTexture = (url) => new Promise((resolve) => {
  new THREE.TextureLoader().load(url, resolve);
});

document.addEventListener('DOMContentLoaded', () => {

  const start = async () => {
    const mindarThree = new window.MINDAR.FACE.MindARThree({
      container: document.body,
    });
    const { renderer, scene, camera } = mindarThree;

    // Прозоре полотно, щоб було видно відео з камери
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.backgroundColor = 'transparent';

    // Освітлення
    scene.add(new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1));

    // --- Завантаження текстур масок ---
    const demonTex  = await loadTexture('./demon.png');
    const galaxyTex = await loadTexture('./galaxy.png');

    // === Створення маски обличчя (face mesh) за методичкою 4.3 ===
    // addFaceMesh повертає єдиний об'єкт, геометрія якого
    // оновлюється у кожному кадрі разом з обличчям
    const faceMesh = mindarThree.addFaceMesh();
    faceMesh.material.transparent = true;
    faceMesh.material.opacity = 1.0;
    faceMesh.material.map = demonTex;       // стартова текстура
    faceMesh.material.needsUpdate = true;
    scene.add(faceMesh);

    // --- 3D-акценти поверх текстури (роги для демона) ---
    // Прив'язуємо до скронь (точки 127 / 356)
    const aLeftTemple  = mindarThree.addAnchor(127);
    const aRightTemple = mindarThree.addAnchor(356);

    const makeHorn = (rotZ) => {
      const g = new THREE.ConeGeometry(0.028, 0.18, 24);
      const m = new THREE.MeshBasicMaterial({ color: 0x1a0505 });
      const horn = new THREE.Mesh(g, m);
      horn.rotation.z = Math.PI * rotZ;
      horn.position.set(0, 0.10, 0);
      return horn;
    };
    const hornL = makeHorn(0.12);
    const hornR = makeHorn(-0.12);
    aLeftTemple.group.add(hornL);
    aRightTemple.group.add(hornR);

    // --- 3D-акценти для галактики (зоряна корона на лобі) ---
    const aForehead = mindarThree.addAnchor(10);
    const galaxyCrown = new THREE.Group();
    const starColors = [0xccaaff, 0xaaccff, 0xffaacc, 0xaaffcc, 0xffccaa];
    for (let i = 0; i < 7; i++) {
      const t = i / 6;
      const ang = Math.PI * (0.18 + 0.64 * t);
      const r = 0.006 + 0.006 * Math.sin(t * Math.PI);
      const s = new THREE.Mesh(
        new THREE.SphereGeometry(r, 12, 8),
        new THREE.MeshBasicMaterial({ color: starColors[i % starColors.length] })
      );
      s.position.set(Math.cos(ang) * 0.14, 0.10 + Math.sin(ang) * 0.05, 0.02);
      s.userData.twinkle = true;
      galaxyCrown.add(s);
    }
    aForehead.group.add(galaxyCrown);

    // ===================================================
    //  ПЕРЕМИКАННЯ МАСОК
    // ===================================================
    const masks = {
      demon: {
        tex: demonTex,
        objects: [hornL, hornR],
      },
      galaxy: {
        tex: galaxyTex,
        objects: [galaxyCrown],
      },
    };

    window.switchMask = (name) => {
      const m = masks[name];
      if (!m) return;
      // змінюємо текстуру маски обличчя
      faceMesh.material.map = m.tex;
      faceMesh.material.needsUpdate = true;
      // показуємо лише відповідні 3D-акценти
      hornL.visible = hornR.visible = (name === 'demon');
      galaxyCrown.visible = (name === 'galaxy');
      // підсвічуємо кнопку
      document.querySelectorAll('.mask-btn').forEach(b => b.classList.remove('active'));
      const btn = document.getElementById('btn-' + name);
      if (btn) btn.classList.add('active');
    };
    window.switchMask('demon');  // стартова маска

    // ===================================================
    //  ЗАПУСК ТА ЦИКЛ РЕНДЕРИНГУ
    // ===================================================
    await mindarThree.start();

    let t = 0;
    renderer.setAnimationLoop(() => {
      t += 0.05;
      // мерехтіння зірок корони
      const tw = 1 + 0.4 * Math.abs(Math.sin(t * 1.5));
      galaxyCrown.children.forEach((s, i) => {
        s.scale.setScalar(1 + 0.4 * Math.abs(Math.sin(t * 1.5 + i)));
      });
      // легка пульсація прозорості маски демона для "дихання вогню"
      renderer.render(scene, camera);
    });
  };

  start();
});
