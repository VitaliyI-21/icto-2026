const THREE = window.MINDAR.FACE.THREE;

document.addEventListener('DOMContentLoaded', () => {

  const start = async () => {
    // --- Ініціалізація MindAR Face ---
    const mindarThree = new window.MINDAR.FACE.MindARThree({
      container: document.body,
    });
    const { renderer, scene, camera } = mindarThree;

    // --- Освітлення (напівсферичне джерело світла) ---
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(light);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(0, 1, 2);
    scene.add(dirLight);

    // ===================================================
    //  ДОПОМІЖНІ ФУНКЦІЇ ПОБУДОВИ ОБ'ЄКТІВ
    // ===================================================
    const ring = (rIn, rOut, color, opacity = 1) => {
      const g = new THREE.RingGeometry(rIn, rOut, 32);
      const m = new THREE.MeshBasicMaterial({
        color, transparent: true, opacity, side: THREE.DoubleSide,
      });
      return new THREE.Mesh(g, m);
    };
    const disc = (r, color, opacity = 1) => {
      const g = new THREE.CircleGeometry(r, 32);
      const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity });
      return new THREE.Mesh(g, m);
    };
    const cone = (rBot, h, color, opacity = 1) => {
      const g = new THREE.ConeGeometry(rBot, h, 24);
      const m = new THREE.MeshStandardMaterial({
        color, emissive: color, emissiveIntensity: 0.25,
        transparent: true, opacity,
      });
      return new THREE.Mesh(g, m);
    };
    const bar = (w, h, color, opacity = 1) => {
      const g = new THREE.PlaneGeometry(w, h);
      const m = new THREE.MeshBasicMaterial({
        color, transparent: true, opacity, side: THREE.DoubleSide,
      });
      return new THREE.Mesh(g, m);
    };
    const sphere = (r, color, opacity = 1) => {
      const g = new THREE.SphereGeometry(r, 24, 16);
      const m = new THREE.MeshStandardMaterial({
        color, emissive: color, emissiveIntensity: 0.5,
        transparent: true, opacity,
      });
      return new THREE.Mesh(g, m);
    };

    // ===================================================
    //  ЯКОРІ НА ОПОРНИХ ТОЧКАХ ОБЛИЧЧЯ
    //  1=ніс, 168=перенісся, 10=лоб,
    //  234=ліва щока, 454=права щока,
    //  127=ліва скроня, 356=права скроня,
    //  152=підборіддя, 159=ліве око, 386=праве око
    // ===================================================
    const aNose   = mindarThree.addAnchor(1);
    const aBridge = mindarThree.addAnchor(168);
    const aForehead = mindarThree.addAnchor(10);
    const aLeftCheek  = mindarThree.addAnchor(234);
    const aRightCheek = mindarThree.addAnchor(454);
    const aLeftTemple  = mindarThree.addAnchor(127);
    const aRightTemple = mindarThree.addAnchor(356);
    const aChin = mindarThree.addAnchor(152);
    const aLeftEye  = mindarThree.addAnchor(159);
    const aRightEye = mindarThree.addAnchor(386);

    // Групи для перемикання масок
    const demonGroup = new THREE.Group();
    const sageGroup  = new THREE.Group();

    // ===================================================
    //  ===============  МАСКА: ЧОРТИК  =================
    // ===================================================

    // Палаючі очі (на опорних точках очей)
    const demonEyeL = new THREE.Group();
    const demonEyeR = new THREE.Group();
    [demonEyeL, demonEyeR].forEach((grp) => {
      const r = ring(0.020, 0.042, 0xff3300, 0.9);
      const c = disc(0.020, 0x1a0000, 1); c.position.z = 0.001;
      grp.add(r, c);
      grp.userData.pulse = r.material;  // для анімації
    });
    aLeftEye.group.add(demonEyeL);
    aRightEye.group.add(demonEyeR);

    // Роги (на скронях)
    const hornL = cone(0.028, 0.17, 0x2a0a0a, 0.95);
    hornL.rotation.z = Math.PI * 0.10; hornL.position.set(0, 0.10, 0);
    const hornR = cone(0.028, 0.17, 0x2a0a0a, 0.95);
    hornR.rotation.z = -Math.PI * 0.10; hornR.position.set(0, 0.10, 0);
    aLeftTemple.group.add(hornL);
    aRightTemple.group.add(hornR);

    // Гліф на лобі (перевернутий хрест)
    const glyph = new THREE.Group();
    const gv = bar(0.005, 0.07, 0xff2200, 0.85);
    const gh = bar(0.06, 0.005, 0xff2200, 0.85); gh.position.y = 0.01;
    glyph.add(gv, gh); glyph.position.z = 0.02;
    aForehead.group.add(glyph);

    // Руни на щоках
    const runeL = new THREE.Group();
    runeL.add(bar(0.005, 0.05, 0xcc0000, 0.7));
    const rl1 = bar(0.035, 0.005, 0xcc0000, 0.7); rl1.position.y = 0.012; runeL.add(rl1);
    runeL.rotation.z = 0.5; runeL.position.z = 0.02;
    aLeftCheek.group.add(runeL);

    const runeR = new THREE.Group();
    runeR.add(bar(0.005, 0.05, 0xcc0000, 0.7));
    const rr1 = bar(0.035, 0.005, 0xcc0000, 0.7); rr1.position.y = 0.012; runeR.add(rr1);
    runeR.rotation.z = -0.5; runeR.position.z = 0.02;
    aRightCheek.group.add(runeR);

    // Ікла (на підборідді/роті)
    const fangs = new THREE.Group();
    const fangBar = bar(0.14, 0.004, 0xff0000, 0.7); fangs.add(fangBar);
    const fangL = cone(0.012, 0.03, 0x880000, 0.85);
    fangL.rotation.x = Math.PI; fangL.position.set(-0.03, -0.018, 0);
    const fangR = cone(0.012, 0.03, 0x880000, 0.85);
    fangR.rotation.x = Math.PI; fangR.position.set(0.03, -0.018, 0);
    fangs.add(fangL, fangR); fangs.position.set(0, 0.05, 0.02);
    aChin.group.add(fangs);

    // Тег приналежності до групи демона
    [demonEyeL, demonEyeR, hornL, hornR, glyph, runeL, runeR, fangs]
      .forEach(o => { o.userData.mask = 'demon'; });

    // ===================================================
    //  ===============  МАСКА: МУДРЕЦЬ  ================
    // ===================================================

    // Зелене обличчя (на носі, як основа)
    const sageFace = sphere(0.20, 0x7a9b54, 0.5);
    sageFace.scale.set(1, 1.15, 0.55); sageFace.position.set(0, -0.02, -0.02);
    aNose.group.add(sageFace);

    // Великі гострі вуха (на скронях)
    const earL = new THREE.Group();
    const earLOuter = cone(0.07, 0.26, 0x86a860, 0.92); earLOuter.scale.set(0.55, 1, 0.4);
    const earLInner = cone(0.045, 0.20, 0x9cb874, 0.9); earLInner.scale.set(0.55, 1, 0.4); earLInner.position.z = 0.01;
    earL.add(earLOuter, earLInner);
    earL.rotation.z = Math.PI * 0.30; earL.position.set(-0.05, 0.04, 0);
    aLeftTemple.group.add(earL);

    const earR = new THREE.Group();
    const earROuter = cone(0.07, 0.26, 0x86a860, 0.92); earROuter.scale.set(0.55, 1, 0.4);
    const earRInner = cone(0.045, 0.20, 0x9cb874, 0.9); earRInner.scale.set(0.55, 1, 0.4); earRInner.position.z = 0.01;
    earR.add(earROuter, earRInner);
    earR.rotation.z = -Math.PI * 0.30; earR.position.set(0.05, 0.04, 0);
    aRightTemple.group.add(earR);

    // Мудрі великі очі (на точках очей)
    const sageEyeL = new THREE.Group();
    sageEyeL.add(disc(0.050, 0x3a2a1a, 0.95));
    const pupL = disc(0.026, 0x0d0805, 1); pupL.position.z = 0.001; sageEyeL.add(pupL);
    const glL = disc(0.010, 0xffffff, 0.8); glL.position.set(0.012, 0.012, 0.002); sageEyeL.add(glL);
    aLeftEye.group.add(sageEyeL);

    const sageEyeR = new THREE.Group();
    sageEyeR.add(disc(0.050, 0x3a2a1a, 0.95));
    const pupR = disc(0.026, 0x0d0805, 1); pupR.position.z = 0.001; sageEyeR.add(pupR);
    const glR = disc(0.010, 0xffffff, 0.8); glR.position.set(-0.012, 0.012, 0.002); sageEyeR.add(glR);
    aRightEye.group.add(sageEyeR);

    // Зморшки на лобі
    const wrinkles = new THREE.Group();
    [0, -0.02, -0.04].forEach((y, i) => {
      const w = bar(0.14 - i * 0.02, 0.004, 0x5a7038, 0.6 - i * 0.1);
      w.position.y = y; wrinkles.add(w);
    });
    wrinkles.position.set(0, -0.02, 0.02);
    aForehead.group.add(wrinkles);

    // Містичні іскри (на скронях)
    const sparkL = sphere(0.007, 0x88ff88, 1); sparkL.position.set(-0.02, 0.18, 0.02);
    aLeftTemple.group.add(sparkL);
    const sparkR = sphere(0.006, 0x88ff88, 1); sparkR.position.set(0.02, 0.15, 0.02);
    aRightTemple.group.add(sparkR);

    // Тег приналежності до групи мудреця
    [sageFace, earL, earR, sageEyeL, sageEyeR, wrinkles, sparkL, sparkR]
      .forEach(o => { o.userData.mask = 'sage'; });

    // ===================================================
    //  ПЕРЕМИКАННЯ МАСОК (керує видимістю об'єктів)
    // ===================================================
    const allObjects = [
      // demon
      demonEyeL, demonEyeR, hornL, hornR, glyph, runeL, runeR, fangs,
      // sage
      sageFace, earL, earR, sageEyeL, sageEyeR, wrinkles, sparkL, sparkR,
    ];

    window.switchMask = (name) => {
      allObjects.forEach(o => { o.visible = (o.userData.mask === name); });
      document.querySelectorAll('.mask-btn').forEach(b => b.classList.remove('active'));
      document.getElementById('btn-' + name).classList.add('active');
    };
    window.switchMask('demon');  // стартова маска

    // ===================================================
    //  ЗАПУСК ТА ЦИКЛ РЕНДЕРИНГУ
    // ===================================================
    await mindarThree.start();

    let t = 0;
    renderer.setAnimationLoop(() => {
      t += 0.05;
      // Пульсація очей чортика
      const pulse = 0.6 + 0.4 * Math.abs(Math.sin(t));
      demonEyeL.userData.pulse.opacity = pulse;
      demonEyeR.userData.pulse.opacity = pulse;
      // Мерехтіння іскор мудреця
      const sp = 1 + 0.5 * Math.abs(Math.sin(t * 1.3));
      sparkL.scale.setScalar(sp);
      sparkR.scale.setScalar(sp * 0.9);

      renderer.render(scene, camera);
    });
  };

  start();
});
