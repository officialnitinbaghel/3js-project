const canvas = document.getElementById("solarCanvas");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.set(0, 30, 60);
const controls = new THREE.OrbitControls(camera, renderer.domElement); // Add via CDN if needed

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xffffff, 2, 300);
scene.add(sunLight);

// Sun
const sunGeometry = new THREE.SphereGeometry(4, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Planet Data
const planets = [
  { name: "Mercury", size: 0.4, distance: 8, color: 0xaaaaaa, speed: 0.04 },
  { name: "Venus", size: 0.7, distance: 12, color: 0xffc04c, speed: 0.015 },
  { name: "Earth", size: 0.75, distance: 16, color: 0x3399ff, speed: 0.01 },
  { name: "Mars", size: 0.6, distance: 20, color: 0xff3300, speed: 0.008 },
  { name: "Jupiter", size: 1.5, distance: 28, color: 0xd2b48c, speed: 0.005 },
  { name: "Saturn", size: 1.2, distance: 35, color: 0xffe699, speed: 0.003 },
  { name: "Uranus", size: 1.0, distance: 42, color: 0x66ffff, speed: 0.002 },
  { name: "Neptune", size: 0.9, distance: 48, color: 0x3366ff, speed: 0.001 }
];

const planetMeshes = [];

planets.forEach((planet, index) => {
  const geometry = new THREE.SphereGeometry(planet.size, 32, 32);
  const material = new THREE.MeshStandardMaterial({ color: planet.color });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.userData = { angle: 0, speed: planet.speed, distance: planet.distance };
  scene.add(mesh);
  planetMeshes.push(mesh);

  // Controls
  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = "0";
  slider.max = "0.1";
  slider.step = "0.001";
  slider.value = planet.speed;
  slider.id = planet.name;

  slider.addEventListener("input", (e) => {
    mesh.userData.speed = parseFloat(e.target.value);
  });

  const label = document.createElement("label");
  label.innerText = planet.name;
  label.htmlFor = slider.id;

  document.getElementById("controls").appendChild(label);
  document.getElementById("controls").appendChild(slider);
  document.getElementById("controls").appendChild(document.createElement("br"));
});

// Animation
function animate() {
  requestAnimationFrame(animate);

  planetMeshes.forEach((planet) => {
    planet.userData.angle += planet.userData.speed;
    planet.position.set(
      Math.cos(planet.userData.angle) * planet.userData.distance,
      0,
      Math.sin(planet.userData.angle) * planet.userData.distance
    );
  });

  renderer.render(scene, camera);
}

animate();
