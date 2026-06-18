// Перевірка завантаження MindAR
if (!window.MINDAR || !window.MINDAR.FACE) {
  document.body.insertAdjacentHTML('afterbegin',
    '<div style="position:fixed;top:0;left:0;right:0;z-index:99;background:#b41e1e;' +
    'color:#fff;padding:14px;font-family:sans-serif;font-size:14px;">' +
    'Помилка: бібліотека MindAR не завантажилась. Перевірте підключення mind-ar@1.1.5.</div>');
  throw new Error('window.MINDAR.FACE is undefined');
}

// THREE з глобального об'єкта MindAR (методичка, розділ 4.1)
const THREE = window.MINDAR.FACE.THREE;

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
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(light);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(0, 1, 2);
    scene.add(dirLight);

    // ===================================================
    //  ДОПОМІЖНІ ФУНКЦІЇ (яскраві MeshBasicMaterial,
    //  щоб елементи світилися незалежно від освітлення)
    // ===================================================
    const ring = (rIn, rOut, color, opacity = 1) => {
      const g = new THREE.RingGeometry(rIn, rOut, 48);
      const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide });
      return new THREE.Mesh(g, m);
    };
    const disc = (r, color, opacity = 1) => {
      const g = new THREE.CircleGeometry(r, 48);
      const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity });
      return new THREE.Mesh(g, m);
    };
    const bar = (w, h, color, opacity = 1) => {
      const g = new THREE.PlaneGeometry(w, h);
      const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide });
      return new THREE.Mesh(g, m);
    };
    const cone = (rBot, h, color, opacity = 1) => {
      const g = new THREE.ConeGeometry(rBot, h, 24);
      const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity });
      return new THREE.Mesh(g, m);
    };
    const ball = (r, color, opacity = 1) => {
      const g = new THREE.SphereGeometry(r, 20, 14);
      const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity });
      return new THREE.Mesh(g, m);
    };

    // ===================================================
    //  ЯКОРІ НА ОПОРНИХ ТОЧКАХ ОБЛИЧЧЯ
    // ===================================================
    const aNose   = mindarThree.addAnchor(1);    // ніс
    const aForehead = mindarThree.addAnchor(10); // лоб
    const aLeftEye  = mindarThree.addAnchor(159);// ліве око
    const aRightEye = mindarThree.addAnchor(386);// праве око
    const aLeftCheek  = mindarThree.addAnchor(234);
    const aRightCheek = mindarThree.addAnchor(454);
    const aLeftTemple  = mindarThree.addAnchor(127);
    const aRightTemple = mindarThree.addAnchor(356);
    const aChin = mindarThree.addAnchor(152);    // підборіддя/рот

    const allObjects = [];  // для перемикання видимості
    const animated = [];    // для анімації в циклі

    // Хелпер: додати об'єкт до якоря + позначити маску
    const attach = (anchor, obj, maskName) => {
      obj.userData.mask = maskName;
      anchor.group.add(obj);
      allObjects.push(obj);
      return obj;
    };

    // ===================================================
    //  ============  МАСКА 1: КІБЕРПАНК  =============
    // ===================================================
    // Неонові кільця-очі зі скануючою лінією
    [['cyber', aLeftEye, 1], ['cyber', aRightEye, -1]].forEach(([mask, anchor, dir]) => {
      const eye = new THREE.Group();
      eye.add(ring(0.025, 0.042, 0x00ffff, 0.9));
      const inner = disc(0.025, 0x001a2e, 1); inner.position.z = 0.001; eye.add(inner);
      const scan = bar(0.08, 0.004, 0x00ffff, 0.7); scan.position.z = 0.002; eye.add(scan);
      scan.userData.spin = dir;
      animated.push(scan);
      attach(anchor, eye, mask);
    });
    // Лінії на лобі
    const cyberBrow = new THREE.Group();
    cyberBrow.add(bar(0.28, 0.003, 0x00ffff, 0.6));
    const cb2 = bar(0.14, 0.003, 0x00ffff, 0.4); cb2.position.y = -0.016; cyberBrow.add(cb2);
    cyberBrow.position.set(0, 0.05, 0.02);
    attach(aForehead, cyberBrow, 'cyber');
    // Щічні плати
    [['cyber', aLeftCheek], ['cyber', aRightCheek]].forEach(([mask, anchor]) => {
      const plate = new THREE.Group();
      plate.add(bar(0.10, 0.06, 0x0a1a2e, 0.6));
      [0.025, 0, -0.025].forEach((y, i) => {
        const l = bar(0.10, 0.003, 0x00ffff, 0.8 - i * 0.2); l.position.set(0, y, 0.001); plate.add(l);
      });
      plate.position.z = 0.02;
      attach(anchor, plate, mask);
    });
    // Респіратор на роті
    const cyberMouth = new THREE.Group();
    cyberMouth.add(bar(0.20, 0.045, 0x0a1a2e, 0.7));
    const cm1 = bar(0.20, 0.003, 0x00ffff, 0.8); cm1.position.set(0, 0.022, 0.001); cyberMouth.add(cm1);
    const cm2 = bar(0.20, 0.003, 0x00ffff, 0.8); cm2.position.set(0, -0.022, 0.001); cyberMouth.add(cm2);
    [-0.06, 0, 0.06].forEach((x) => {
      const v = bar(0.025, 0.018, 0x001533, 0.9); v.position.set(x, 0, 0.002); cyberMouth.add(v);
    });
    cyberMouth.position.set(0, 0.02, 0.02);
    attach(aChin, cyberMouth, 'cyber');

    // ===================================================
    //  ============  МАСКА 2: ГАЛАКТИКА  =============
    // ===================================================
    // Туманності-очі (обертові кільця)
    [['galaxy', aLeftEye, 0x9b59b6, 0x3498db], ['galaxy', aRightEye, 0xe74c3c, 0xf39c12]].forEach(
      ([mask, anchor, c1, c2]) => {
        const eye = new THREE.Group();
        const r1 = ring(0.028, 0.050, c1, 0.85); r1.userData.spin = 0.3; eye.add(r1);
        const r2 = ring(0.018, 0.028, c2, 0.7);  r2.userData.spin = -0.6; eye.add(r2);
        const core = disc(0.018, 0x0a0015, 1); core.position.z = 0.001; eye.add(core);
        animated.push(r1, r2);
        attach(anchor, eye, mask);
      });
    // Зоряна корона на лобі
    const crown = new THREE.Group();
    [[0, 0.04, 0.015, 0xccaaff], [-0.07, 0.02, 0.010, 0xaaccff], [0.07, 0.02, 0.010, 0xffaacc],
     [-0.13, 0.01, 0.007, 0xaaffcc], [0.13, 0.01, 0.007, 0xffccaa]].forEach(([x, y, r, c]) => {
      const s = ball(r, c, 1); s.position.set(x, y, 0); crown.add(s);
    });
    crown.position.set(0, 0.06, 0.02);
    attach(aForehead, crown, 'galaxy');
    // Зорі-іскри на щоках і скронях
    [[aLeftTemple, 0xaaccff], [aRightTemple, 0xffccaa], [aLeftCheek, 0xffaaff], [aRightCheek, 0xaaffcc]]
      .forEach(([anchor, c]) => {
        const s = ball(0.008, c, 1);
        s.position.set(0, 0.05, 0.02);
        s.userData.twinkle = true;
        animated.push(s);
        attach(anchor, s, 'galaxy');
      });

    // ===================================================
    //  ============  МАСКА 3: ДЕМОН  ================
    // ===================================================
    // Палаючі очі
    [['demon', aLeftEye], ['demon', aRightEye]].forEach(([mask, anchor]) => {
      const eye = new THREE.Group();
      const r = ring(0.020, 0.042, 0xff3300, 0.9); eye.add(r);
      const c = disc(0.020, 0x1a0000, 1); c.position.z = 0.001; eye.add(c);
      r.userData.pulse = true;
      animated.push(r);
      attach(anchor, eye, mask);
    });
    // Роги на скронях
    [['demon', aLeftTemple, 0.10], ['demon', aRightTemple, -0.10]].forEach(([mask, anchor, rot]) => {
      const horn = cone(0.028, 0.17, 0x2a0a0a, 0.95);
      horn.rotation.z = Math.PI * rot; horn.position.set(0, 0.10, 0);
      attach(anchor, horn, mask);
    });
    // Гліф на лобі
    const dGlyph = new THREE.Group();
    dGlyph.add(bar(0.005, 0.07, 0xff2200, 0.85));
    const gh = bar(0.06, 0.005, 0xff2200, 0.85); gh.position.y = 0.01; dGlyph.add(gh);
    dGlyph.position.z = 0.02;
    attach(aForehead, dGlyph, 'demon');
    // Руни на щоках
    [['demon', aLeftCheek, 0.5], ['demon', aRightCheek, -0.5]].forEach(([mask, anchor, rot]) => {
      const rune = new THREE.Group();
      rune.add(bar(0.005, 0.05, 0xcc0000, 0.7));
      const r1 = bar(0.035, 0.005, 0xcc0000, 0.7); r1.position.y = 0.012; rune.add(r1);
      rune.rotation.z = rot; rune.position.z = 0.02;
      attach(anchor, rune, mask);
    });
    // Ікла
    const fangs = new THREE.Group();
    fangs.add(bar(0.14, 0.004, 0xff0000, 0.7));
    [-0.03, 0.03].forEach((x) => {
      const f = cone(0.012, 0.03, 0x880000, 0.85);
      f.rotation.x = Math.PI; f.position.set(x, -0.018, 0); fangs.add(f);
    });
    fangs.position.set(0, 0.05, 0.02);
    attach(aChin, fangs, 'demon');

    // ===================================================
    //  ============  МАСКА 4: АНГЕЛ  ================
    // ===================================================
    // Золотий німб над головою
    const halo = new THREE.Group();
    const haloRing = ring(0.16, 0.19, 0xffd700, 0.9); halo.add(haloRing);
    halo.position.set(0, 0.16, 0.01);
    haloRing.userData.pulse = true;
    animated.push(haloRing);
    attach(aForehead, halo, 'angel');
    // Сяючі очі
    [['angel', aLeftEye], ['angel', aRightEye]].forEach(([mask, anchor]) => {
      const eye = new THREE.Group();
      const glow = disc(0.040, 0xfff8b0, 0.6); eye.add(glow);
      eye.add(ring(0.022, 0.040, 0xffd700, 0.6));
      glow.userData.pulse = true;
      animated.push(glow);
      attach(anchor, eye, mask);
    });
    // Світлові сльози на щоках
    [['angel', aLeftCheek], ['angel', aRightCheek]].forEach(([mask, anchor]) => {
      const tear = new THREE.Group();
      const t1 = ball(0.012, 0xffe066, 0.85); t1.position.set(0, 0.02, 0); tear.add(t1);
      const t2 = ball(0.009, 0xffe066, 0.5);  t2.position.set(0, -0.005, 0); tear.add(t2);
      tear.position.z = 0.02;
      t1.userData.twinkle = true;
      animated.push(t1);
      attach(anchor, tear, mask);
    });
    // Іскри-зорі на скронях
    [['angel', aLeftTemple], ['angel', aRightTemple]].forEach(([mask, anchor]) => {
      const s = ball(0.006, 0xffffee, 1);
      s.position.set(0, 0.10, 0.02);
      s.userData.twinkle = true;
      animated.push(s);
      attach(anchor, s, mask);
    });

    // ===================================================
    //  ПЕРЕМИКАННЯ МАСОК
    // ===================================================
    window.switchMask = (name) => {
      allObjects.forEach(o => { o.visible = (o.userData.mask === name); });
      document.querySelectorAll('.mask-btn').forEach(b => b.classList.remove('active'));
      const btn = document.getElementById('btn-' + name);
      if (btn) btn.classList.add('active');
    };
    window.switchMask('cyber');  // стартова маска

    // ===================================================
    //  ЗАПУСК ТА ЦИКЛ РЕНДЕРИНГУ
    // ===================================================
    await mindarThree.start();

    let t = 0;
    renderer.setAnimationLoop(() => {
      t += 0.05;
      const pulse = 0.55 + 0.45 * Math.abs(Math.sin(t));
      const tw = 1 + 0.4 * Math.abs(Math.sin(t * 1.4));
      animated.forEach((o) => {
        if (o.userData.spin)    o.rotation.z += 0.04 * o.userData.spin;
        if (o.userData.pulse)   o.material.opacity = pulse;
        if (o.userData.twinkle) o.scale.setScalar(tw);
      });
      renderer.render(scene, camera);
    });
  };

  start();
});
