# 🪐 Сонячна система — VR + AR

Дві сцени з усіма 8 планетами Сонячної системи з реалістичними текстурами.

## Файли

```
├── vr.html       ← Сонячна система у віртуальній реальності (A-Frame)
├── ar.html       ← Сонячна система в доповненій реальності (MindAR + A-Frame)
├── marker.png    ← Зображення маркера для друку (Земля)
├── targets.mind  ← Скомпільований маркер для MindAR (генерується вами — див. нижче)
└── README.md
```

## Технології

| Технологія | Роль |
|---|---|
| **A-Frame 1.5** | 3D рушій для VR та AR сцен |
| **MindAR 1.2.5** | Розпізнавання зображення-маркера через камеру |
| **Закон Ньютона (JS)** | Компонент `orbit` — реальні орбітальні швидкості |
| **Wikipedia textures** | Реалістичні текстури всіх планет (CC BY) |

## Деплой на GitHub Pages

```bash
git init
git add .
git commit -m "feat: Solar System VR + AR"
git remote add origin https://github.com/YOUR/REPO.git
git push -u origin main
# Settings → Pages → main / root
```

## ⚠️ ВАЖЛИВО: Як отримати targets.mind

Файл `.mind` — скомпільований маркер для MindAR.
Вам потрібно згенерувати його **один раз** із `marker.png`:

### Спосіб 1 — онлайн (найпростіше)
1. Відкрийте: https://hiukim.github.io/mind-ar-js-doc/tools/compile
2. Перетягніть `marker.png`
3. Натисніть **Start** → зачекайте
4. Завантажте `targets.mind`
5. Покладіть поруч з `ar.html` у репозиторій

### Спосіб 2 — Node.js локально
```bash
npm install mind-ar
node -e "
const compiler = new (require('mind-ar/src/image-target/compiler'))();
const fs = require('fs');
const {createCanvas, loadImage} = require('canvas');
loadImage('marker.png').then(async img => {
  const canvas = createCanvas(img.width, img.height);
  canvas.getContext('2d').drawImage(img,0,0);
  await compiler.compileImageTargets([canvas], console.log);
  const buf = compiler.exportData();
  fs.writeFileSync('targets.mind', Buffer.from(buf));
  console.log('Done!');
});
"
```

## Як користуватися AR

1. Відкрийте `ar.html` на телефоні через GitHub Pages (потрібен HTTPS)
2. Роздрукуйте або відкрийте `marker.png` на іншому екрані
3. Наведіть камеру телефону на маркер
4. Сонячна система з'явиться поверх маркера в реальному часі

## Планети у VR (vr.html)

- WASD — рух, Миша — огляд
- Наведіть курсор на планету — побачите інформацію
- Всі планети обертаються навколо власної осі і по орбіті
- Кільця Сатурна, зоряне небо, освітлення від Сонця
