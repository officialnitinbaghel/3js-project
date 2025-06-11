// Main Three.js variables
let scene, camera, renderer, controls;
let solarSystem = {};
let clock = new THREE.Clock();
let isPaused = false;
let animationId = null;

// Planet data
const planetsData = [
    { name: 'Mercury', color: 0xA9A9A9, size: 0.4, orbitRadius: 5, speed: 0.04 },
    { name: 'Venus', color: 0xFFA500, size: 0.6, orbitRadius: 7, speed: 0.015 },
    { name: 'Earth', color: 0x1E90FF, size: 0.6, orbitRadius: 9, speed: 0.01 },
    { name: 'Mars', color: 0xFF4500, size: 0.5, orbitRadius: 11, speed: 0.008 },
    { name: 'Jupiter', color: 0xDAA520, size: 1.2, orbitRadius: 14, speed: 0.002 },
    { name: 'Saturn', color: 0xF4A460, size: 1.0, orbitRadius: 17, speed: 0.0009, hasRing: true },
    { name: 'Uranus', color: 0xADD8E6, size: 0.8, orbitRadius: 20, speed: 0.0004 },
    { name: 'Neptune', color: 0x0000FF, size: 0.8, orbitRadius: 23, speed: 0.0001 }
];

// Initialize the scene
function init() {
    // Create scene
    scene = new THREE.Scene();
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 20, 30);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('scene-container').appendChild(renderer.domElement);
    
    // Add orbit controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableHelper = false; // This line removes the selection box
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 1, 1);
    scene.add(directionalLight);
    
    // Create the Sun
    createSun();
    
    // Create planets
    createPlanets();
    
    // Add stars background
    addStars();
    
    // Create UI controls
    createControls();
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
    
    // Start animation loop
    animate();
}

// Create the Sun
function createSun() {
    const sunGeometry = new THREE.SphereGeometry(2, 32, 32);
    const sunMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xFFFF00,
        emissive: 0xFFFF00,
        emissiveIntensity: 1,
        specular: 0x111111
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);
    
    // Add point light for sun glow
    const sunLight = new THREE.PointLight(0xFFFF00, 1, 50);
    sun.add(sunLight);
    
    solarSystem.sun = sun;
}

// Create text label for planet
function createPlanetLabel(planetName, planetSize) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    
    // Draw background
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw text
    context.font = 'Bold 24px Arial';
    context.textAlign = 'center';
    context.fillStyle = 'white';
    context.fillText(planetName, canvas.width/2, canvas.height/2 + 8);
    
    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    
    // Create sprite material
    const material = new THREE.SpriteMaterial({ 
        map: texture,
        transparent: true
    });
    
    // Create sprite
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(2, 1, 1);
    sprite.position.y = planetSize + 0.5; // Position above the planet
    
    return sprite;
}

// Create all planets
function createPlanets() {
    planetsData.forEach((planetData) => {
        // Create planet
        const planetGeometry = new THREE.SphereGeometry(planetData.size, 32, 32);
        const planetMaterial = new THREE.MeshPhongMaterial({ 
            color: planetData.color,
            shininess: 10,
            specular: 0x111111
        });
        const planet = new THREE.Mesh(planetGeometry, planetMaterial);
        
        // Create orbit path
        const orbitGeometry = new THREE.RingGeometry(
            planetData.orbitRadius - 0.1, 
            planetData.orbitRadius + 0.1, 
            64
        );
        const orbitMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x888888, 
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.3
        });
        const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
        orbit.rotation.x = Math.PI / 2;
        scene.add(orbit);
        
        // Create planet group for orbit
        const planetGroup = new THREE.Group();
        planetGroup.add(planet);
        
        // Add label
        const label = createPlanetLabel(planetData.name, planetData.size);
        planet.add(label);
        
        // Set initial position
        planetGroup.position.x = planetData.orbitRadius;
        scene.add(planetGroup);
        
        // Add rings for Saturn
        if (planetData.hasRing) {
            const ringGeometry = new THREE.RingGeometry(
                planetData.size * 1.5, 
                planetData.size * 2.5, 
                32
            );
            const ringMaterial = new THREE.MeshPhongMaterial({
                color: 0xD2B48C,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.8,
                shininess: 30
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.PI / 2;
            planet.add(ring);
        }
        
        // Store planet data
        solarSystem[planetData.name] = {
            group: planetGroup,
            mesh: planet,
            speed: planetData.speed,
            orbitRadius: planetData.orbitRadius,
            angle: Math.random() * Math.PI * 2
        };
    });
}

// Add stars to the background
function addStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 5000;
    const positions = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount; i++) {
        const i3 = i * 3;
        positions[i3] = (Math.random() - 0.5) * 2000;
        positions[i3 + 1] = (Math.random() - 0.5) * 2000;
        positions[i3 + 2] = (Math.random() - 0.5) * 2000;
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: 1,
        transparent: true,
        opacity: 0.8
    });
    
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
}

// Create UI controls
function createControls() {
    const slidersContainer = document.getElementById('planet-sliders');
    
    planetsData.forEach(planetData => {
        const controlDiv = document.createElement('div');
        controlDiv.className = 'planet-control';
        
        const colorSpan = document.createElement('span');
        colorSpan.className = 'planet-color';
        colorSpan.style.backgroundColor = `#${planetData.color.toString(16).padStart(6, '0')}`;
        
        const label = document.createElement('label');
        label.htmlFor = `speed-${planetData.name}`;
        label.textContent = planetData.name;
        
        const input = document.createElement('input');
        input.type = 'range';
        input.id = `speed-${planetData.name}`;
        input.min = '0';
        input.max = '0.1';
        input.step = '0.001';
        input.value = planetData.speed;
        
        const valueSpan = document.createElement('span');
        valueSpan.textContent = planetData.speed;
        
        input.addEventListener('input', (e) => {
            const newSpeed = parseFloat(e.target.value);
            solarSystem[planetData.name].speed = newSpeed;
            valueSpan.textContent = newSpeed.toFixed(3);
        });
        
        controlDiv.appendChild(colorSpan);
        controlDiv.appendChild(label);
        controlDiv.appendChild(input);
        controlDiv.appendChild(valueSpan);
        
        slidersContainer.appendChild(controlDiv);
    });
    
    // Pause/Resume button
    document.getElementById('pause-resume').addEventListener('click', togglePause);
    
    // Reset speeds button
    document.getElementById('reset-speeds').addEventListener('click', resetSpeeds);
    
    // Theme toggle button
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
}

// Toggle animation pause/resume
function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pause-resume').textContent = isPaused ? 'Resume' : 'Pause';
}

// Reset all planet speeds to default
function resetSpeeds() {
    planetsData.forEach(planetData => {
        solarSystem[planetData.name].speed = planetData.speed;
        const input = document.getElementById(`speed-${planetData.name}`);
        input.value = planetData.speed;
        input.nextElementSibling.textContent = planetData.speed;
    });
}

// Toggle dark/light theme
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    document.getElementById('theme-toggle').textContent = 
        document.body.classList.contains('dark-mode') ? 'Light Mode' : 'Dark Mode';
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
function animate() {
    animationId = requestAnimationFrame(animate);
    
    if (!isPaused) {
        const delta = clock.getDelta();
        
        // Update planet positions
        for (const planetName in solarSystem) {
            if (planetName !== 'sun') {
                const planet = solarSystem[planetName];
                planet.angle += planet.speed * delta * 10;
                
                // Update planet position in orbit
                planet.group.position.x = Math.cos(planet.angle) * planet.orbitRadius;
                planet.group.position.z = Math.sin(planet.angle) * planet.orbitRadius;
                
                // Rotate planet on its axis
                planet.mesh.rotation.y += 0.01;
                
                // Make labels always face the camera
                planet.mesh.children.forEach(child => {
                    if (child instanceof THREE.Sprite) {
                        child.lookAt(camera.position);
                    }
                });
            }
        }
    }
    
    controls.update();
    renderer.render(scene, camera);
}

// Clean up on unmount
function cleanup() {
    cancelAnimationFrame(animationId);
    window.removeEventListener('resize', onWindowResize);
    if (renderer && renderer.domElement) {
        document.getElementById('scene-container').removeChild(renderer.domElement);
    }
}

// Initialize the app
init();

// Handle cleanup if needed
window.addEventListener('beforeunload', cleanup);