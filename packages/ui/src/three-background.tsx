"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

import audioFragmentShader from "./shaders/audio/fragment.glsl";
import audioVertexShader from "./shaders/audio/vertex.glsl";
import wobbleFragmentShader from "./shaders/wobble/fragment.glsl";
// import {puter} from '@heyputer/puter.js'; // Dynamic import to avoid SSR issues

import wobbleVertexShader from "./shaders/wobble/vertex.glsl";

interface ThreeBackgroundProps {
  isSpeaking: boolean;
  response: string;
}

export function ThreeBackground({
  isSpeaking,
  response,
}: ThreeBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sphereRef = useRef<THREE.Mesh | null>(null);
  const animationFrameId = useRef<number | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const audioAnalyserRef = useRef<AudioNode | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && !audioContextRef.current) {
      const AudioContextClass =
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const analyser = audioContext.createAnalyser();
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;
      audioAnalyserRef.current = analyser;
    }
  }, []);

  const getAudioData = () => {
    if (!analyserRef.current || !dataArrayRef.current)
      return { volume: 0, frequencies: new Uint8Array(0) };

    const dataArray = dataArrayRef.current;
    // @ts-expect-error -- description
    analyserRef.current.getByteFrequencyData(dataArray);

    const volume = dataArray.reduce((a, b) => a + b) / dataArray.length;
    const frequencies = dataArray;

    return { volume, frequencies };
  };

  const mapVolumeToRange = (rawVolume: number, min: number, max: number) => {
    return min + (rawVolume / 255) * (max - min);
  };

  const playAudio = async (text: string) => {
    if (!text) return;

    try {
      const { puter } = await import("@heyputer/puter.js");

      // Ensure AudioContext is running
      if (audioContextRef.current?.state === "suspended") {
        await audioContextRef.current.resume();
        console.log("AudioContext resumed");
      }

      puter.ai
        .txt2speech(text, {
          voice: "Joanna",
          engine: "neural",
          language: "en-US",
        })
        .then((audio: HTMLAudioElement) => {
          audio.volume = 1.0; // Ensure volume is up

          const playPromise = audio.play();

          playPromise
            .then(() => {
              console.log("Audio playing successfully");

              if (!audioAnalyserRef.current || !audioContextRef.current) return;

              // Create source only if not already connected (though for new audio element it's new source)
              const source =
                audioContextRef.current.createMediaElementSource(audio);
              source.connect(audioAnalyserRef.current);
              audioAnalyserRef.current.connect(
                audioContextRef.current.destination,
              );
            })
            .catch((error) => {
              console.error("Audio playback blocked:", error);
            });
        });
    } catch (error) {
      console.error("Failed to play audio:", error);
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const textureLoader = new THREE.TextureLoader();
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.offsetWidth / containerRef.current.offsetHeight,
      0.1,
      1000,
    );
    camera.position.z = 5;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(
      containerRef.current.offsetWidth,
      containerRef.current.offsetHeight,
    );
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Environment setup
    textureLoader.load("/textures/env-light_small.png", (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = texture;
      scene.environmentIntensity = 1;
    });

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1).normalize();

    // Sphere setup
    const uniforms = {
      uTime: new THREE.Uniform(0),
      uPositionFrequency: new THREE.Uniform(0.3),
      uTimeFrequency: new THREE.Uniform(0.4),
      uStrength: new THREE.Uniform(0.3),
      uWarpPositionFrequency: new THREE.Uniform(0.38),
      uWarpTimeFrequency: new THREE.Uniform(0.12),
      uWarpStrength: new THREE.Uniform(1.7),
      uColorA: new THREE.Uniform(new THREE.Color("#6366f1")),
      uColorB: new THREE.Uniform(new THREE.Color("#ec4899")),
      uFrequencies: new THREE.Uniform(new Float32Array(256)),
    };

    const material = new CustomShaderMaterial({
      // CSM
      baseMaterial: THREE.MeshPhysicalMaterial,
      vertexShader: wobbleVertexShader,
      fragmentShader: wobbleFragmentShader,
      uniforms: uniforms,

      // MeshPhysicalMaterial
      metalness: 0,
      roughness: 0.5,
      color: "#ffffff",
      transmission: 0,
      ior: 1.5,
      thickness: 1.5,
      transparent: true,
      wireframe: false,
    });

    let geometry = new THREE.IcosahedronGeometry(2, 50);
    // @ts-expect-error -- description
    geometry = mergeVertices(geometry);
    geometry.computeTangents();

    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
    sphereRef.current = sphere;

    const clock = new THREE.Clock();

    // Animation loop
    const animate = () => {
      if (sphereRef.current) {
        const elapsedTime = clock.getElapsedTime();

        sphereRef.current.rotation.x += 0.002;
        sphereRef.current.rotation.y += 0.002;

        // @ts-expect-error -- description
        material.uniforms.uTime.value = elapsedTime;
        // @ts-expect-error -- description
        material.uniforms.uFrequencies.value = getAudioData().frequencies;
        // @ts-expect-error -- description
        material.uniforms.uPositionFrequency.value = mapVolumeToRange(
          getAudioData().volume,
          0.2,
          0.7,
        );
        // @ts-expect-error -- description
        material.uniforms.uWarpPositionFrequency.value = mapVolumeToRange(
          getAudioData().volume,
          0.3,
          0.9,
        );

        if (isSpeaking) {
          // Pulse effect when speaking
          const time = Date.now() * 0.005;
          const scale = 1 + Math.sin(time) * 0.05;
          sphereRef.current.scale.set(scale, scale, scale);
          sphereRef.current.rotation.x += 0.01;
          sphereRef.current.rotation.y += 0.01;
        } else {
          sphereRef.current.scale.set(1, 1, 1);
        }
      }

      renderer.render(scene, camera);
      animationFrameId.current = requestAnimationFrame(animate);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (cameraRef.current && rendererRef.current && containerRef.current) {
        cameraRef.current.aspect =
          containerRef.current.offsetWidth / containerRef.current.offsetHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(
          containerRef.current.offsetWidth,
          containerRef.current.offsetHeight,
        );
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      // Cleanup Three.js resources
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [isSpeaking]);

  useEffect(() => {
    if (!response) return;

    playAudio(response);
  }, [response]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 top-1/2 left-1/2 -z-10 h-full w-full -translate-x-1/2 -translate-y-1/2"
      style={{ background: "linear-gradient(to bottom, #0f172a, #1e293b)" }}
    />
  );
}
