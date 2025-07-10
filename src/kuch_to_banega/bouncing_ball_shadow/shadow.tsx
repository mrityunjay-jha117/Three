import React, { useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useTexture } from "@react-three/drei";
import * as THREE from "three";

function Flat() {
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    return () => {
      if (meshRef.current) {
        meshRef.current.geometry.dispose();
        const mat = meshRef.current.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      }
    };
  }, []);

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="#e99999" />
    </mesh>
  );
}

function Sphere({ sphereRef }: { sphereRef: React.RefObject<THREE.Mesh> }) {
  const clock = useRef(new THREE.Clock());

  useEffect(() => {
    return () => {
      if (sphereRef.current) {
        sphereRef.current.geometry.dispose();
        const mat = sphereRef.current.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      }
    };
  }, [sphereRef]);

  useFrame(() => {
    const t = clock.current.getElapsedTime();
    const sphere = sphereRef.current;
    if (sphere) {
      sphere.position.x = Math.cos(t / 2) * 7;
      sphere.position.z = Math.sin(t / 2) * 7;
      sphere.position.y = Math.abs(Math.sin(t * 2)) * 3 + 1;
    }
  });

  return (
    <mesh ref={sphereRef} castShadow>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color="#ff6b6b" />
    </mesh>
  );
}

function SphereShadow({ targetRef }: { targetRef: React.RefObject<THREE.Mesh> }) {
  const shadowRef = useRef<THREE.Mesh>(null);
  const alphaMap = useTexture("/textures/9.png");

  useEffect(() => {
    return () => {
      if (shadowRef.current) {
        shadowRef.current.geometry.dispose();
        const mat = shadowRef.current.material as THREE.Material;
        mat.dispose();
      }
      alphaMap.dispose();
    };
  }, [alphaMap]);

  useFrame(() => {
    const target = targetRef.current;
    const shadow = shadowRef.current;
    if (target && shadow) {
      shadow.position.set(target.position.x, 0.01, target.position.z);
      (shadow.material as THREE.MeshBasicMaterial).opacity = target.position.y * 0.3;
    }
  });

  return (
    <mesh ref={shadowRef} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[1.5, 1.5]} />
      <meshBasicMaterial
        color="black"
        transparent
        alphaMap={alphaMap}
      />
    </mesh>
  );
}

export default function Shadow() {
  const sphereRef = useRef<THREE.Mesh>(null!);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    return () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
        const ext = gl?.getExtension("WEBGL_lose_context");
        ext?.loseContext();
      }
    };
  }, []);

  return (
    <Canvas
      camera={{ position: [3, 5, 7], fov: 60 }}
      onCreated={({ gl }) => {
        canvasRef.current = gl.domElement;
      }}
      shadows
    >
      <directionalLight castShadow intensity={1} position={[5, 4, 0]} />
      <ambientLight intensity={0.3} />

      <Flat />
      <Sphere sphereRef={sphereRef} />
      <SphereShadow targetRef={sphereRef} />

      <OrbitControls enableDamping />
    </Canvas>
  );
}
