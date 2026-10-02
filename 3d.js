// Import Three.js and STLExporter module
import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let cubes = [];
let fingers = [];
let base;
let fingerLeft, fingerRight;
let flapLeft, flapRight;
const cubeSize = 1; // Base size of the cubes
let fingerThreshold = 25;

let currentX, currentY, currentZ;
let modelsPending = 4;
const assemblySizes = {
    99: { nominal: 99, body: 118, flapX: 67, frame: 125, bundle: 'PCBStencil_Size99mm_Set.zip' },
    150: { nominal: 150, body: 169, flapX: 92.5, frame: 176, bundle: 'PCBStencil_Size150mm_Set.zip' },
    201: { nominal: 201, body: 220, flapX: 118, frame: 227, bundle: 'PCBStencil_Size201mm_Set.zip' }
};

function getAssembly() {
    return assemblySizes[document.getElementById('assembly-size').value];
}


function init() {
    // Create the scene and the camera
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-100, 100, 100, -100, 0.1, 1000);

    // Create the renderer and attach it to the canvas
    const canvas = document.getElementById('myCanvas');
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x111411);
    renderer.shadowMap.enabled = true; // Enable shadow mapping

    camera.position.set(145, -165, 145);
    camera.lookAt(0, 0, 0);
    controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.minZoom = 0.7;
    controls.maxZoom = 5;
    controls.target.set(0, 0, 0);
    controls.update();
    adjustCanvasSize();

    // Create lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 2); // Soft white light
    scene.add(ambientLight);
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(-80, -100, 160);
    scene.add(keyLight);

    // A loose build-plane grid gives the model scale and orientation in space.
    const grid = new THREE.GridHelper(400, 20, 0x596052, 0x2b302b);
    grid.rotation.x = Math.PI / 2;
    grid.position.z = -2.1;
    grid.material.transparent = true;
    grid.material.opacity = 0.55;
    scene.add(grid);

    createCubes();

    // Load the STL file into the scene
    loadSTLModel(true);
    loadSTLModel(false);

    loadFlapSTLModel(true);
    loadFlapSTLModel(false);

    // Add event listener for STL export
    document.getElementById('export-stl').addEventListener('click', function () {
        const exporter = new STLExporter();
        const stlString = exporter.parse(scene);
        const blob = new Blob([stlString], { type: 'text/plain' });

        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `PCBStencil_${getAssembly().nominal}mm_Tray_${currentX.toFixed(1)}x${currentY.toFixed(1)}mm.stl`;
        a.click();
        URL.revokeObjectURL(a.href);
    });

    animate();
}

function loadSTLModel(isLeft = true) {
    // Create a new STLLoader
    const loader = new STLLoader();

    // Load your STL file
    loader.load('finger.stl', function (geometry) {
        // Create a material
        const material = new THREE.MeshStandardMaterial({ color: 0xc8ff3d, flatShading: true });

        // Create a mesh with the geometry and the material
        const mesh = new THREE.Mesh(geometry, material);

        mesh.rotation.x = -Math.PI / 2;

        if(isLeft){
            fingerLeft = mesh;
        }
        else{
            fingerRight = mesh;
            mesh.rotation.z = Math.PI;
        }

        // Add the mesh to the scene
        scene.add(mesh);

        UpdateFingers();
        UpdateFlaps();
        modelLoaded();
    }, onProgress, onError);
}

function loadFlapSTLModel(isLeft = true) {
    // Create a new STLLoader
    const loader = new STLLoader();

    // Load your STL file
    loader.load('flap.stl', function (geometry) {
        // Create a material
        const material = new THREE.MeshStandardMaterial({ color: 0xc8ff3d, flatShading: true });

        // Create a mesh with the geometry and the material
        const mesh = new THREE.Mesh(geometry, material);

        if(isLeft){
            flapLeft = mesh;
        }
        else{
            flapRight = mesh;
        }

        mesh.position.x = isLeft ? -getAssembly().flapX : getAssembly().flapX;
        if(isLeft){
            mesh.rotation.z = -Math.PI;
        }

        // Add the mesh to the scene
        scene.add(mesh);

        UpdateFingers();
        UpdateFlaps();
        modelLoaded();

    }, onProgress, onError);
}

function onProgress(xhr) {
    // Reserved for a future progress indicator.
}

function onError(error) {
    console.error('An error happened loading the STL model', error);
    const notice = document.getElementById('viewer-error');
    notice.textContent = 'A required model could not be loaded. Serve this folder over HTTP and refresh.';
    notice.classList.add('visible');
}

function modelLoaded() {
    modelsPending -= 1;
    document.getElementById('export-stl').disabled = modelsPending > 0;
}

function UpdateFlaps(){

    if(currentZ == null){
        return;
    }

    if(flapLeft != null){
        flapLeft.position.x = -getAssembly().flapX;
        flapLeft.position.z = -1;
        flapLeft.scale.set(1, 1, currentZ + 2);

    }
    if(flapRight != null){
        flapRight.position.x = getAssembly().flapX;
        flapRight.position.z = -1;
        flapRight.scale.set(1, 1, currentZ + 2);
    }
}

function createCubes() {
    const material = new THREE.MeshStandardMaterial({ color: 0xc8ff3d });
    const cubePosition = { x: 0, y: 0, z: 0 };
    const cubeScale = { x: 10, y: 10, z: 1.6 };

    for(let i = 0; i < 4; i++) {
        const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
        let cube = new THREE.Mesh(geometry, material);
        cube.position.set(cubePosition.x, cubePosition.y, cubePosition.z);
        cube.scale.set(cubeScale.x, cubeScale.y, cubeScale.z);
        cube.castShadow = true; // Enable shadows for this object
        cube.receiveShadow = true; // Allow this object to receive shadows
        scene.add(cube);
        cubes.push(cube);
    }

    // Create the fingers
    const fingerMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const fingerPosition = { x: 0, y: 0, z: 0 };
    const fingerScale = { x: 10, y: 10, z: 1.6 };

    for(let i = 0; i < 4; i++) {
        const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
        let cubeFinger = new THREE.Mesh(geometry, material);
        cubeFinger.position.set(fingerPosition.x, fingerPosition.y, fingerPosition.z);
        cubeFinger.scale.set(fingerScale.x, fingerScale.y, fingerScale.z);
        cubeFinger.castShadow = true; // Enable shadows for this object
        cubeFinger.receiveShadow = true; // Allow this object to receive shadows
        scene.add(cubeFinger);
        fingers.push(cubeFinger);
    }

    const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x394522 });
    const basePosition = { x: 0, y: 0, z: -0.8 };
    const baseScale = { x: 118, y: 118, z: 2 };

    const baseGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    let baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    baseMesh.position.set(basePosition.x, basePosition.y, basePosition.z);
    baseMesh.scale.set(baseScale.x, baseScale.y, baseScale.z);
    baseMesh.castShadow = true; // Enable shadows for this object
    baseMesh.receiveShadow = true; // Allow this object to receive shadows
    scene.add(baseMesh);
    base = baseMesh;
}

function adjustPlate(width, length, height) {

    currentX = width;
    currentY = length;
    currentZ = height;

    const assembly = getAssembly();
    let maxX = assembly.body;
    let maxY = assembly.body;

    let fingerX = width > assembly.nominal - 2 ? 8 : 10;
    let fingerY = 20;

    let halfWidth = width / 2;
    let halfLength = length / 2;

    let cubesX = [
        (maxX / 2) - halfWidth - fingerX,
        (maxX / 2) - halfWidth - fingerX,
        maxX,
        maxX
    ];

    let cubesY = [
        length,
        length,
        Math.max(0, (maxY / 2) - halfLength),
        Math.max(0, (maxY / 2) - halfLength)
    ];

    cubes[0].scale.set(cubesX[0], cubesY[0], height); // Left
    cubes[1].scale.set(cubesX[1], cubesY[1], height); // Right
    cubes[2].scale.set(cubesX[2], cubesY[2], height); // Top
    cubes[3].scale.set(cubesX[3], cubesY[3], height); // Bottom

    // Adjust positions after scaling
    cubes[0].position.x = (maxX / 2) - (cubesX[0] / 2);
    cubes[1].position.x = -(maxX / 2) + (cubesX[1] / 2);
    cubes[2].position.y = halfLength + (cubesY[2] / 2);
    cubes[3].position.y = -halfLength - (cubesY[3] / 2);

    // Adjust fingers

    let fingerScaleY = (cubesY[0] / 2) - (fingerY / 2);

    if(currentY < fingerThreshold){
        fingerScaleY = length / 2;
        fingerY = (length / 2) * 1.5;
    }

    fingers[0].scale.set(fingerX, fingerScaleY, height); // Top Left
    fingers[1].scale.set(fingerX, fingerScaleY, height); // Top Right
    fingers[2].scale.set(fingerX, fingerScaleY, height); // Bottom Left
    fingers[3].scale.set(fingerX, fingerScaleY, height); // Bottom Right

     // Adjust finger positions after scaling

    let fingerPositionX = (width / 2) + (fingerX / 2);//
    let fingerPositionY = (fingerY / 2) + (fingerScaleY / 2);

    fingers[0].position.x = -fingerPositionX;
    fingers[1].position.x = fingerPositionX;
    fingers[2].position.x = -fingerPositionX;
    fingers[3].position.x = fingerPositionX;

    fingers[0].position.y = fingerPositionY;
    fingers[1].position.y = fingerPositionY;
    fingers[2].position.y = -fingerPositionY;
    fingers[3].position.y = -fingerPositionY;

    UpdateFingers();
    UpdateFlaps();

    base.position.set(0, 0, (-height/2) - 1);
    base.scale.set(maxX, maxY, 2);
}

function UpdateFingers(){

    if(currentX == null){
        return;
    }

    if(fingerLeft != null){
        fingerLeft.visible = (currentY >= fingerThreshold);
    }
    if(fingerRight != null){
        fingerRight.visible = (currentY >= fingerThreshold);
    }

    let fingerX = 10;
    let fingerY = 20;

    let fingerScaleY = (currentY / 2) - (fingerY / 2);

    let fingerPositionX = (currentX / 2) + (fingerX / 2);//
    let fingerPositionY = (fingerY / 2) + (fingerScaleY / 2);

    if(fingerLeft){
        fingerLeft.position.x = -fingerPositionX + 5;
        fingerLeft.position.z = -1;
        fingerLeft.scale.set(1, currentZ + 2, 1);
    }
    if(fingerRight){
        fingerRight.position.x = fingerPositionX - 5;
        fingerRight.position.z = -1;
        fingerRight.scale.set(1, currentZ + 2, 1);

    }
}


function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

function adjustCanvasSize() {
    // Get the container element
    const container = document.getElementById('canvas-container');

    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);
    const aspect = width / height;
    const viewSize = getAssembly().body * 1.57;

    // Adjust the camera aspect ratio and frustum
    camera.left = -(viewSize * aspect) / 2;
    camera.right = (viewSize * aspect) / 2;
    camera.top = viewSize / 2;
    camera.bottom = -viewSize / 2;
    camera.updateProjectionMatrix();

    // Update renderer size
    renderer.setSize(width, height, false);
}

// Call this function when the window is resized
function onWindowResize() {
    // Adjust the canvas size on window resize
    adjustCanvasSize();
}

window.addEventListener('resize', onWindowResize);

init();

function handleInputChange() {
    // Get the values from the inputs
    const width = parseFloat(document.getElementById('width').value);
    const height = parseFloat(document.getElementById('height').value);
    const thickness = parseFloat(document.getElementById('thickness').value);

    const tolerance = parseFloat(document.getElementById('tolerance').value);

    const form = document.getElementById('stlForm');
    const exportButton = document.getElementById('export-stl');
    if (!form.checkValidity() || ![width, height, thickness, tolerance].every(Number.isFinite)) {
        exportButton.disabled = true;
        return;
    }
    exportButton.disabled = modelsPending > 0;
    adjustPlate(width + tolerance, height + tolerance, thickness);
    document.getElementById('model-size').textContent = `${getAssembly().nominal} mm holder · ${(width + tolerance).toFixed(1)} × ${(height + tolerance).toFixed(1)} × ${thickness.toFixed(1)} mm PCB pocket`;
}

function handleAssemblyChange() {
    const assembly = getAssembly();
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    widthInput.max = assembly.nominal;
    heightInput.max = assembly.body;
    if (parseFloat(widthInput.value) > assembly.nominal) widthInput.value = assembly.nominal;
    if (parseFloat(heightInput.value) > assembly.body) heightInput.value = assembly.body;

    document.getElementById('assembly-details').textContent = `${assembly.body} × ${assembly.body} mm tray body · ${assembly.nominal} mm max width`;
    const hardwareDownload = document.getElementById('hardware-download');
    hardwareDownload.href = `./3D/${assembly.bundle}`;
    hardwareDownload.firstChild.textContent = `${assembly.nominal} mm holder files `;
    controls.reset();
    adjustCanvasSize();
    handleInputChange();
}

// Add change event listeners to the form inputs
document.getElementById('width').addEventListener('input', handleInputChange);
document.getElementById('height').addEventListener('input', handleInputChange);
document.getElementById('thickness').addEventListener('change', handleInputChange);
document.getElementById('tolerance').addEventListener('change', handleInputChange);
document.getElementById('assembly-size').addEventListener('change', handleAssemblyChange);

// Apply the default assembly limits and render the initial tray.
handleAssemblyChange();


