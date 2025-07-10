import { useMemo, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useTexture } from "@react-three/drei";
import * as THREE from "three";

function Particle_In_Sphere() {
  const reference = useRef<THREE.Group>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null!);
  const materialRef = useRef<THREE.PointsMaterial>(null!);
  const texture = useTexture("/particles/2.png");

  useEffect(() => {
    // Ensure refs are current before returning the cleanup function
    const geometry = geometryRef.current;
    const material = materialRef.current;

    return () => {
      geometry?.dispose();
      material?.dispose();
      texture.dispose();
    };
  }, [texture]);

  useFrame(() => {
    if (reference.current) {
      reference.current.position.y += 0.001; // Rotate the group for animation
    }
  });
  const count = 1000;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    const color = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      arr[i] = (Math.random() - 0.5) * 5;
      color[i] = Math.random();
    }
    return { arr, color };
  }, [count]);

  return (
    <group ref={reference}>
      <points>
        <bufferGeometry ref={geometryRef}>
          <bufferAttribute
            attach="attributes-position"
            args={[positions.arr, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[positions.color, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          ref={materialRef}
          map={texture}
          transparent
          alphaMap={texture}
          depthWrite={false}
          sizeAttenuation={true}
          vertexColors={true}
          size={0.1}
        />
      </points>
    </group>
  );
}

export default function Particles() {
  return (
    <>
      <div style={{ width: "100vw", height: "100vh" }}>
        <Canvas
          camera={{
            position: [-1, 3, 1],
            fov: 75,
          }}
          style={{ background: "#000000" }}
        >
          <Particle_In_Sphere />
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
          />
        </Canvas>
      </div>
    </>
  );
}
