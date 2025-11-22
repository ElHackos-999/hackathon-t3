"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface ThreeBackgroundProps {
  isSpeaking: boolean;
}

export function ThreeBackground({ isSpeaking }: ThreeBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sphereRef = useRef<THREE.Mesh | null>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.offsetWidth / containerRef.current.offsetHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(containerRef.current.offsetWidth, containerRef.current.offsetHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Sphere setup
    const geometry = new THREE.SphereGeometry(2, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x6366f1, // Indigo-500
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
    sphereRef.current = sphere;

    // Animation loop
    const animate = () => {
      if (sphereRef.current) {
        sphereRef.current.rotation.x += 0.002;
        sphereRef.current.rotation.y += 0.002;

        if (isSpeaking) {
           // Pulse effect when speaking
           const time = Date.now() * 0.005;
           const scale = 1 + Math.sin(time) * 0.1;
           sphereRef.current.scale.set(scale, scale, scale);
           sphereRef.current.rotation.x += 0.01;
           sphereRef.current.rotation.y += 0.01;
           (sphereRef.current.material as THREE.MeshBasicMaterial).color.setHex(0xec4899); // Pink-500
        } else {
           sphereRef.current.scale.set(1, 1, 1);
           (sphereRef.current.material as THREE.MeshBasicMaterial).color.setHex(0x6366f1); // Indigo-500
        }
      }

      renderer.render(scene, camera);
      animationFrameId.current = requestAnimationFrame(animate);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
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

  return (
    <div
      ref={containerRef}
      className="w-full h-full absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 inset-0 -z-10 pointer-events-none"
      style={{ background: "linear-gradient(to bottom, #0f172a, #1e293b)" }}
    />
  );
}
