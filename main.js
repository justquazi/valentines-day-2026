import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js";

// ======================
// LOCATIONS
// ======================
const locations = [
  { name: "Thornhill, ON", lat: 43.8085, lng: -79.4259, note: "Where we met" },
  {
    name: "Toronto, ON",
    lat: 43.6532,
    lng: -79.3832,
    note: "Uni fair together",
  },
  {
    name: "Montreal, QC",
    lat: 45.5019,
    lng: -73.5674,
    note: "First trip together",
  },
  {
    name: "La Malbaie, QC",
    lat: 47.655,
    lng: -70.1526,
    note: "Favorite trip together",
  },
  { name: "Barrie, ON", lat: 44.3894, lng: -79.6903, note: "Skiing together" },
  { name: "Cayuga, ON", lat: 42.9487, lng: -79.8509, note: "Track days" },
  {
    name: "Victoria, BC",
    lat: 48.4284,
    lng: -123.3656,
    note: "She visited me first year",
  },
];

// ======================
// SCENE
// ======================
let started = false;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1d3a);

const camera = new THREE.PerspectiveCamera(
  45,
  innerWidth / innerHeight,
  0.1,
  1000,
);
camera.position.set(0, 0, 22);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(devicePixelRatio);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.domElement.style.pointerEvents = "none"; // 🔑 important
document.body.appendChild(renderer.domElement);

// ======================
// CONTROLS
// ======================
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enableZoom = false;
controls.enablePan = false;

// ======================
// LIGHTING
// ======================
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const sun = new THREE.DirectionalLight(0xffffff, 0.9);
sun.position.set(10, 10, 10);
scene.add(sun);

// ======================
// EARTH
// ======================
const loader = new THREE.TextureLoader();
const earthTex = loader.load("textures/earth-texture.jpg");
earthTex.colorSpace = THREE.SRGBColorSpace;

const globeRadius = 5;
const globe = new THREE.Mesh(
  new THREE.SphereGeometry(globeRadius, 64, 64),
  new THREE.MeshStandardMaterial({ map: earthTex }),
);
scene.add(globe);

// ======================
// HELPERS
// ======================
function latLngToVec3(lat, lng, r) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

function createPin(lat, lng) {
  const g = new THREE.Group();

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8),
    new THREE.MeshStandardMaterial({ color: 0xff4d6d }),
  );

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xff4d6d }),
  );

  stem.position.y = 0.3;
  head.position.y = 0.65;
  g.add(stem, head);

  const pos = latLngToVec3(lat, lng, globeRadius + 0.02);
  g.position.copy(pos);
  g.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    pos.clone().normalize(),
  );

  return g;
}

// ======================
// CAMERA ANIMATION
// ======================
function animateCameraTo(lat, lng, distance = 12, duration = 3) {
  const target = latLngToVec3(lat, lng, globeRadius);
  const dir = target.clone().normalize();
  const dest = dir.multiplyScalar(distance);

  controls.enabled = false;

  gsap.to(camera.position, {
    x: dest.x,
    y: dest.y,
    z: dest.z,
    duration,
    ease: "power2.inOut",
    onUpdate: () => camera.lookAt(0, 0, 0),
    onComplete: () => {
      controls.enabled = true;
      started = true; // 🔑 stop idle rotation AFTER zoom
    },
  });
}

// ======================
// PINS
// ======================
const pins = [];
locations.forEach((loc) => {
  const pin = createPin(loc.lat, loc.lng);
  pin.userData = loc;
  globe.add(pin);
  pins.push(pin);
});

// ======================
// HOVER
// ======================
const tooltip = document.getElementById("tooltip");
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let mouseScreen = { x: 0, y: 0 };
let hovered = null;

addEventListener("mousemove", (e) => {
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;
  mouseScreen = { x: e.clientX, y: e.clientY };
});

function handleHover() {
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(pins, true);

  if (hits.length) {
    const pin = hits[0].object.parent;
    if (hovered !== pin) {
      hovered?.scale.set(1, 1, 1);
      hovered = pin;
      pin.scale.set(1.3, 1.3, 1.3);
    }
    tooltip.textContent = `${pin.userData.name} — ${pin.userData.note}`;
    tooltip.style.left = mouseScreen.x + 12 + "px";
    tooltip.style.top = mouseScreen.y + 12 + "px";
    tooltip.style.opacity = 1;
  } else {
    hovered?.scale.set(1, 1, 1);
    hovered = null;
    tooltip.style.opacity = 0;
  }
}

// ======================
// START BUTTON
// ======================
const startBtn = document.getElementById("startBtn");
const overlay = document.getElementById("overlay");

startBtn.addEventListener("click", () => {
  overlay.style.opacity = 0;
  overlay.style.pointerEvents = "none";

  renderer.domElement.style.pointerEvents = "auto";

  // Zoom out to Canada view
  animateCameraTo(56, -106, 12, 3);
});

// ======================
// ANIMATE
// ======================
function animate() {
  requestAnimationFrame(animate);

  if (!started) {
    globe.rotation.y += 0.0004;
  }

  controls.update();
  handleHover();
  renderer.render(scene, camera);
}

animate();
