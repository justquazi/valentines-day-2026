import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js";

// ======================
// LOCATIONS
// ======================
const locations = [
  { name: "Thornhill, ON", lat: 43.8085, lng: -79.4259, note: "Our home city" },
  {
    name: "Toronto, ON",
    lat: 43.6532,
    lng: -79.3832,
    note: "Prom",
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
    note: "My University!",
    photos: ["img/victoria-1.jpg", "img/victoria-2.jpg"],
  },
  {
    name: "Parry Sound, ON",
    lat: 45.3473,
    lng: -80.0355,
    note: "Second family cottage trip",
  },
  {
    name: "Kawartha Lakes, ON",
    lat: 44.3579,
    lng: -78.7408,
    note: "First family cottage trip",
  },
  {
    name: "Waterloo, ON",
    lat: 43.4643,
    lng: -80.5204,
    note: "Your university!",
  },
  {
    name: "St. Catharines, ON",
    lat: 43.1594,
    lng: -79.2469,
    note: "Solar Eclipse Trip",
  },
  {
    name: "Lagoon City, ON",
    lat: 44.533,
    lng:  -79.216,
    note: "Annie's cottage"
  },
  {
    name: "Innisfil, ON",
    lat: 44.300,
    lng:-79.650,
    note: "Elvin's cottage",
  },
  {
    name: "Tiny, ON",
    lat: 44.683,
    lng: -79.950,
    note: "Claire's cottage"
  }
];

// ======================
// SCENE
// ======================
let started = false;
let hasZoomed = false;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1d3a);
let mode = "world"; // "world" | "location"
let activePin = null;
const WORLD_CAMERA_POS = new THREE.Vector3(0, 0, 22);
let previousCameraPosition = new THREE.Vector3();

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
  const group = new THREE.Group();

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 0.01, 0.3, 6), // thinner + shorter
    new THREE.MeshStandardMaterial({ color: 0xff4d6d }),
  );

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 8, 8), // smaller head
    new THREE.MeshStandardMaterial({ color: 0xff4d6d }),
  );

  stem.position.y = 0.150; // pin placement
  head.position.y = 0.30;

  group.add(stem, head);

  const pos = latLngToVec3(lat, lng, globeRadius + 0.015);
  group.position.copy(pos);

  const normal = pos.clone().normalize();
  group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

  return group;
}

// ======================
// CAMERA ANIMATION
// ======================
function animateCameraTo(lat, lng, distance = 12, duration = 3) {
  if (!window.gsap) return;

  const target = latLngToVec3(lat, lng, globeRadius);
  const dir = target.clone().normalize();
  const dest = dir.multiplyScalar(distance);

  controls.enabled = false;
  gsap.killTweensOf(camera.position);
  gsap.killTweensOf(controls.target);

  gsap.to(camera.position, {
    x: dest.x,
    y: dest.y,
    z: dest.z,
    duration,
    ease: "power2.inOut",
    onUpdate: () => {
      controls.target.set(0, 0, 0);
      camera.lookAt(0, 0, 0);
    },
    onComplete: () => {
      controls.target.set(0, 0, 0);
      controls.enabled = true;
      started = true;
    },
  });
}

function animateCameraToWorld(duration = 2.5) {
  gsap.to(camera.position, {
    x: WORLD_CAMERA_POS.x,
    y: WORLD_CAMERA_POS.y,
    z: WORLD_CAMERA_POS.z,
    duration,
    ease: "power2.inOut",
    onUpdate: () => {
      camera.lookAt(0, 0, 0);
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

window.addEventListener("click", () => {
  if (mode !== "world") return;
  if (!hovered) return;

  enterLocation(hovered);
});

// ======================
// ENTER LOCATION ON PIN CLICK
// ======================

function enterLocation(pin) {
  mode = "location";
  activePin = pin;
  previousCameraPosition.copy(camera.position);

  // Hide other pins
  pins.forEach((p) => {
    if (p !== pin) p.visible = false;
  });

  // Lock orbit target
  controls.target.set(0, 0, 0);
  controls.update();

  const { lat, lng } = pin.userData;

  // Proper distance for globe radius 5
  animateCameraTo(lat, lng, 9.5, 2.5);

  showStoryCard(pin.userData);
}

const storyCard = document.querySelector(".story-card");
const storyTitle = document.getElementById("storyTitle");
const storyText = document.getElementById("storyNote");

const backBtn = document.getElementById("backBtn");

// ======================
// STORY CARDS
// ======================
const photoRow = document.getElementById("photoRow");
function showStoryCard(data) {
  storyTitle.textContent = data.name;
  storyText.textContent = data.note;

  photoRow.innerHTML = "";

  if (data.photos) {
    data.photos.forEach((src) => {
      const img = document.createElement("img");
      img.src = src;
      img.alt = data.name;
      img.style.opacity = 0;
      img.style.transform = "translateY(20px)";
      photoRow.appendChild(img);
    });
  }

  storyOverlay.classList.remove("hidden");

  // Fade overlay in
  gsap.fromTo(
    storyOverlay,
    { opacity: 0 },
    { opacity: 1, duration: 0.8, ease: "power2.out" },
  );

  // Animate photos (staggered)
  gsap.to(photoRow.children, {
    opacity: 1,
    y: 0,
    duration: 0.6,
    ease: "power2.out",
    stagger: 0.15,
    delay: 0.3,
  });
}

function hideStoryCard() {
  // storyCard.classList.remove("active");
  renderer.domElement.style.filter = "none";
  storyOverlay.classList.add("hidden");
}

backBtn.addEventListener("click", () => {
  gsap.to(storyOverlay, {
    opacity: 0,
    duration: 0.6,
    ease: "power2.in",
    onComplete: () => {
      storyOverlay.classList.add("hidden");

      // Restore pins
      pins.forEach((p) => (p.visible = true));
      controls.enabled = true;
      mode = "world";
      activePin = null;

      // Animate camera back to where it was
      gsap.to(camera.position, {
        x: previousCameraPosition.x,
        y: previousCameraPosition.y,
        z: previousCameraPosition.z,
        duration: 2.2,
        ease: "power2.inOut",
        onUpdate: () => {
          camera.lookAt(0, 0, 0);
        },
      });
    },
  });
});

// ======================
// START BUTTON
// ======================
const startBtn = document.getElementById("startBtn");
const overlay = document.getElementById("overlay");

startBtn.addEventListener("click", () => {
  if (hasZoomed) return;
  hasZoomed = true;

  overlay.style.opacity = 0;
  overlay.style.pointerEvents = "none";

  renderer.domElement.style.pointerEvents = "auto";

  animateCameraTo(56, -106, 12, 3);
});

const introTitle = document.getElementById("intro-title");
const introContent = document.getElementById("intro-content");

// Phase timing
setTimeout(() => {
  introTitle.classList.remove("active");
}, 1600);

setTimeout(() => {
  introContent.classList.add("active");
}, 2200);

// ======================
// ANIMATE
// ======================
function animate() {
  requestAnimationFrame(animate);

  if (!started) {
    globe.rotation.y += 0.0004;
  } else {
    handleHover(); // ONLY after intro
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();
