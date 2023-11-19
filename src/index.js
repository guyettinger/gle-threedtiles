import "regenerator-runtime/runtime.js";
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OGC3DTile } from "./tileset/OGC3DTile";
import { TileLoader } from "./tileset/TileLoader";
import { MapControls, OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OcclusionCullingService } from "./tileset/OcclusionCullingService";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

import { InstancedOGC3DTile } from "./tileset/instanced/InstancedOGC3DTile.js"
import { InstancedTileLoader } from "./tileset/instanced/InstancedTileLoader.js"
import { Sky } from "three/examples/jsm/objects/Sky";
import { ShadowMapViewer } from 'three/addons/utils/ShadowMapViewer.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let lightShadowMapViewer;
const dirLight = new THREE.DirectionalLight(0xffFFFF, 1.0, 0, Math.PI / 5, 0.3);
dirLight.position.set(1,1,1);
let cameraToLight = new THREE.Vector3(-1000, 1000, -1000);
let lightVector = new THREE.Vector3(1000, -1000, 1000);
let lightTarget = new THREE.Object3D();
const occlusionCullingService = new OcclusionCullingService();
occlusionCullingService.setSide(THREE.DoubleSide);
const scene = initScene();

/* const m = new THREE.Mesh(new THREE.TorusGeometry(), new THREE.MeshPhongMaterial());
m.castShadow = true;
m.receiveShadow = true;
m.scale.set(50,50,50)
scene.add(m); */

const domContainer = initDomContainer("screen");
const camera = initCamera(domContainer.offsetWidth, domContainer.offsetHeight);
const stats = initStats(domContainer);
const renderer = initRenderer(camera, domContainer);
const ogc3DTilesStatic = initTileset(scene, 0.03);
//const instancedTileLoader = createInstancedTileLoader(scene);
//const ogc3DTiles = initInstancedTilesets(instancedTileLoader);


const gltfLoader = new GLTFLoader();

//gltfLoader.setKTX2Loader(ktx2Loader)


/*gltfLoader.load(
    // resource URL
    'http://localhost:8080/House-02.glb',
    // called when the resource is loaded
    function (gltf) {

        scene.add(gltf.scene);

    },
    // called while loading is progressing
    function (xhr) {

        console.log((xhr.loaded / xhr.total * 100) + '% loaded');

    },
    // called when loading has errors
    function (error) {

        console.log('An error happened : ' + error);

    }
);*/
// Optional: Provide a DRACOLoader instance to decode compressed mesh data

const controller = initController(camera, domContainer);

const composer = initComposer(scene, camera, renderer);

animate();

let sky, sun;
initSky();
function initSky() {
    sky = new Sky();
    sky.scale.setScalar(450000);
    scene.add(sky);

    sun = new THREE.Vector3();

    const effectController = {
        turbidity: 10,
        rayleigh: 1,
        mieCoefficient: 0.005,
        mieDirectionalG: 0.3,
        elevation: 5,
        azimuth: 40,
        exposure: renderer.toneMappingExposure
    };

    const uniforms = sky.material.uniforms;
    uniforms['turbidity'].value = effectController.turbidity;
    uniforms['rayleigh'].value = effectController.rayleigh;
    uniforms['mieCoefficient'].value = effectController.mieCoefficient;
    uniforms['mieDirectionalG'].value = effectController.mieDirectionalG;

    const phi = THREE.MathUtils.degToRad(90 - effectController.elevation);
    const theta = THREE.MathUtils.degToRad(effectController.azimuth);

    sun.setFromSphericalCoords(1, phi, theta);

    uniforms['sunPosition'].value.copy(sun);

    renderer.toneMappingExposure = effectController.exposure;
    renderer.render(scene, camera);
}
function initComposer(scene, camera, renderer) {
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.0, 0.5, 0.4);


    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);
    return composer;
}
function initScene() {
    const scene = new THREE.Scene();
    scene.matrixAutoUpdate = false;
    //scene.matrixWorldAutoUpdate = false;
    scene.background = new THREE.Color(0xE5E3E4);

    


    //scene.add(lightTarget)
    //const helper = new THREE.DirectionalLightHelper(dirLight, 50);
    //scene.add(helper);
    scene.add(new THREE.AmbientLight(0xFFFFFF, 1.0));

    scene.add(dirLight)

    /* lightShadowMapViewer = new ShadowMapViewer(dirLight);
    lightShadowMapViewer.position.x = 10;
    lightShadowMapViewer.position.y = 110;
    lightShadowMapViewer.size.width = 400;
    lightShadowMapViewer.size.height = 400;
    lightShadowMapViewer.update(); */

    /* const light = new THREE.PointLight(0xbbbbff, 2, 5000);
    const sphere = new THREE.SphereGeometry(2, 16, 8);
    light.add(new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ color: 0xbbbbff })));
    scene.add(light);
    light.position.set(200, 200, 200);


    const light2 = new THREE.PointLight(0xffbbbb, 2, 5000);
    const sphere2 = new THREE.SphereGeometry(2, 16, 8);
    light2.add(new THREE.Mesh(sphere2, new THREE.MeshBasicMaterial({ color: 0xffbbbb })));
    scene.add(light2);
    light2.position.set(200, 100, -100); */


    return scene;
}

function initDomContainer(divID) {

    const domContainer = document.getElementById(divID);
    domContainer.style = "position: absolute; height:100%; width:100%; left: 0px; top:0px;";
    document.body.appendChild(domContainer);
    return domContainer;
}


function initRenderer(camera, dom) {

    const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(dom.offsetWidth, dom.offsetHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    //renderer.toneMapping = THREE.ReinhardToneMapping;
    //renderer.toneMappingExposure = Math.pow(0.8, 2.0);

    renderer.shadowMap.enabled = false;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.autoClear = false;

    dom.appendChild(renderer.domElement);

    onWindowResize();
    window.addEventListener('resize', onWindowResize);
    function onWindowResize() {

        const aspect = window.innerWidth / window.innerHeight;
        camera.aspect = aspect;
        camera.updateProjectionMatrix();

        renderer.setSize(dom.offsetWidth, dom.offsetHeight);
    }

    return renderer;
}

function initStats(dom) {
    const stats = Stats();
    document.body.appendChild(stats.dom);
    return stats;
}




function initTileset(scene, gem) {

    const tileLoader = new TileLoader({
        renderer: renderer,
        maxCachedItems: 1000,
        meshCallback: mesh => {
            //// Insert code to be called on every newly decoded mesh e.g.:
            //mesh.material = new THREE.MeshPhongMaterial({color:0xff0000}),
            mesh.material.wireframe = false;
            mesh.material.side = THREE.DoubleSide;
            //mesh.castShadow = true
            //mesh.receiveShadow = true;
            mesh.geometry.computeVertexNormals();
            //console.log(mesh.material.type)
            //mesh.material.shadowSide = THREE.BackSide;
            mesh.material.flatShading = true;
            mesh.material.needsUpdate = true
            mesh.material.metalness = 0.5

            let meshURLs = [];
            let transforms = [];

        },
        pointsCallback: points => {
            points.material.size = Math.min(1.0, 0.1 * Math.sqrt(points.geometricError));
            points.material.sizeAttenuation = true;
        }
    });
    const ogc3DTile = new OGC3DTile({
        //url: "https://storage.googleapis.com/ogc-3d-tiles/berlinTileset/tileset.json",
        url: "http://localhost:8080/tileset.json",
        //url: "https://storage.googleapis.com/ogc-3d-tiles/2x2/1/tileset.json",

        geometricErrorMultiplier: 1,
        loadOutsideView: false,
        tileLoader: tileLoader,
        //occlusionCullingService: occlusionCullingService,
        static: false,
        centerModel: true,
        renderer: renderer,
        //yUp:false,
        //displayErrors: true,
        //displayCopyright: true,
        onLoadCallback:(e)=>{
            console.log(e)
        }

    });
    setIntervalAsync(function () {


        ogc3DTile.update(camera);
    }, 10);

    ogc3DTile.scale.set(0.01, 0.01, 0.01)

    ogc3DTile.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI * -0.5)
    //ogc3DTile.translateOnAxis(new THREE.Vector3(0, 0, 1), 7)
    /* 
    ogc3DTile.translateOnAxis(new THREE.Vector3(0, 0, 1), 10) // Z-UP to Y-UP
    ogc3DTile.translateOnAxis(new THREE.Vector3(0, 1, 0), 18.5) // Z-UP to Y-UP */
    scene.add(ogc3DTile);

    return ogc3DTile;
}


function createInstancedTileLoader(scene) {
    return new InstancedTileLoader(scene, {
        renderer: renderer,
        maxCachedItems: 0,
        maxInstances: 1,
        meshCallback: mesh => {
            //// Insert code to be called on every newly decoded mesh e.g.:
            mesh.material.wireframe = false;
            //mesh.material.alphaMap = mesh.material.map;
            //mesh.material.side = THREE.DoubleSide;
            //mesh.geometry.computeVertexNormals();
            //console.log(mesh.material.type)
            //mesh.material.shadowSide = THREE.BackSide;
            //mesh.material.flatShading = true;
            //mesh.material.needsUpdate = true
            //mesh.material.map = mesh.material.metalnessMap
            //mesh.material.metalness = 0.5
            //mesh.material.metalnessMap = undefined
            //mesh.material.emissiveIntensity = 0
            //mesh.material.emissive = new THREE.Color( 0xffffff );
            //mesh.material.map = undefined
            //mesh.material.emissiveMap = undefined
            //mesh.material.aoMap = undefined
            //mesh.material.aoMapIntensity = 0
            //mesh.material.normalMap = undefined
            //mesh.material.roughness = 0.5
            //mesh.material.roughnessMap = undefined

        },
        pointsCallback: points => {
            points.material.size = Math.min(1.0, 0.5 * Math.sqrt(points.geometricError));
            points.material.sizeAttenuation = true;
        }
    });
}
function initInstancedTilesets(instancedTileLoader) {

    const instancedTilesets = [];


    for (let x = 0; x < 1; x++) {
        for (let y = 0; y < 1; y++) {
            const tileset = new InstancedOGC3DTile({
                url: "http://localhost:8080/georef_tileset.json",
                //url: "https://storage.googleapis.com/ogc-3d-tiles/nyc/tileset.json",
                geometricErrorMultiplier: 0.1,
                loadOutsideView: true,
                tileLoader: instancedTileLoader,
                static: false,
                renderer: renderer,
                centerModel: false
            });
            tileset.translateOnAxis(new THREE.Vector3(1, 0, 0), 100000 * x);
            tileset.translateOnAxis(new THREE.Vector3(0,0, 1), 100000 * y);
            tileset.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI * -0.5);
            tileset.updateMatrix();
            tileset.scale.set(0.1,0.1,0.1)
            instancedTilesets.push(tileset);
            scene.add(tileset);
        }
    }


    scene.updateMatrixWorld(true)
    function now() {
        return (typeof performance === 'undefined' ? Date : performance).now();
    }
    let updateIndex = 0;
    setInterval(() => {
        let startTime = now();
        do {
            const frustum = new THREE.Frustum();
            frustum.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
            instancedTilesets[updateIndex].update(camera, frustum);
            updateIndex = (updateIndex + 1) % instancedTilesets.length;
        } while (updateIndex < instancedTilesets.length && now() - startTime < 10);
    }, 40);

    //initLODMultiplierSlider(instancedTilesets);
}


function initCamera(width, height) {
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 200000);
    camera.position.set(10, 10, 10);
    camera.lookAt(0, 0, 0);

    camera.matrixAutoUpdate = true;

    document.addEventListener('keydown', function (event) {
        if (event.key === 'p') {
            console.log(camera.position);
        }
    });

    return camera;
}
function initController(camera, dom) {
    const controller = new OrbitControls(camera, dom);

    //controller.target.set(4629210.73133627, 435359.7901640832, 4351492.357788198);
    controller.target.set(0, 0, 0);


    controller.minDistance = 0.1;
    controller.maxDistance = 30000;
    controller.update();
    return controller;
}


function animate() {
    requestAnimationFrame(animate);

    //dirLight.position.addVectors(controller.target, cameraToLight);
    //dirLight.lookAt(dirLight.position.x+lightVector.x, dirLight.position.y+lightVector.y, dirLight.position.z+lightVector.z);
    //console.log(controller);
    //lightTarget.position.addVectors(dirLight.position, lightVector);
    //dirLight.needsUpdate = true;
    //instancedTileLoader.update();
    composer.render();
    //occlusionCullingService.update(scene, renderer, camera)
    stats.update();
    //lightShadowMapViewer.render(renderer);
}

function setIntervalAsync(fn, delay) {
    let timeout;

    const run = async () => {
        const startTime = Date.now();
        try {
            await fn();
        } catch (err) {
            console.error(err);
        } finally {
            const endTime = Date.now();
            const elapsedTime = endTime - startTime;
            const nextDelay = elapsedTime >= delay ? 0 : delay - elapsedTime;
            timeout = setTimeout(run, nextDelay);
        }
    };

    timeout = setTimeout(run, delay);

    return { clearInterval: () => clearTimeout(timeout) };
}




