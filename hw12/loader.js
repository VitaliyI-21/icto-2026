// loader.js — бібліотека завантажувачів (методичка, розділ 4.2)
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

function loadGLTF(path) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(path, (gltf) => resolve(gltf), undefined, reject);
  });
}

function loadTexture(path) {
  const THREE = window.MINDAR.FACE.THREE;
  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.load(path, (texture) => resolve(texture), undefined, reject);
  });
}

export { loadGLTF, loadTexture };
