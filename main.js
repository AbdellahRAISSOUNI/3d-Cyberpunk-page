import './style.css';
import * as THREE from 'three';
import { PMREMGenerator } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js';
import gsap from 'gsap';
import LocomotiveScroll from 'locomotive-scroll';

const locomotiveScroll = new LocomotiveScroll();

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 3.5;

const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector("#canvas"),
    antialias: true,
    alpha: true,
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping; // Add tone mapping
renderer.toneMappingExposure = 1; // Adjust exposure as needed
renderer.outputEncoding = THREE.sRGBEncoding; // Set correct color encoding

// Add HDRI background
const pmremGenerator = new PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

let model;

new RGBELoader()
    .load('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/pond_bridge_night_1k.hdr', function(texture) {
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;
        scene.environment = envMap; // This will make objects reflect the HDRI
        texture.dispose();
        pmremGenerator.dispose();

        const loader = new GLTFLoader();
        loader.load('./DamagedHelmet.gltf', (gltf) => {
            model = gltf.scene;
                scene.add(model);
            },
            function (xhr) {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function (error) {
                console.error('An error occurred:', error);
            }
        );
});

// Postprocessing setup
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const rgbShiftPass = new ShaderPass(RGBShiftShader);
rgbShiftPass.uniforms['amount'].value = 0.003; // Adjust the amount of RGB shift
composer.addPass(rgbShiftPass);

window.addEventListener("mousemove", (e)=>{
    if(model){
        const rotationX = (e.clientX/window.innerWidth - .5) * (Math.PI * .3);
        const rotationY = (e.clientY/window.innerHeight - .5) * (Math.PI * .3);
        gsap.to(model.rotation, { 
            y: rotationX, 
            x: rotationY, 
            duration: 0, 
            ease: "power2.out" 
        });
    }
});

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
    window.requestAnimationFrame(animate);
    composer.render();
}
animate();