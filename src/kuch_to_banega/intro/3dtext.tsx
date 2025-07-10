import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text3D, Center, useTexture } from "@react-three/drei";
import * as THREE from "three";

// 3D Text Component
function RotatingText() {
  const textRef = useRef<THREE.Group>(null!);
  const matcapTexture = useTexture("textures/3.png");
  const textMeshRef = useRef<THREE.Mesh>(null!);
  const textMatRef = useRef<THREE.MeshMatcapMaterial>(null!);

  useEffect(() => {
    return () => {
      // Dispose geometry, material, and texture
      if (textMeshRef.current) {
        textMeshRef.current.geometry?.dispose();
      }
      if (textMatRef.current) {
        textMatRef.current.dispose();
      }
      matcapTexture.dispose();
    };
  }, [matcapTexture]);

  return (
    <group ref={textRef} position={[0, 0, 0]}>
      <Center>
        <Text3D
          font="/font/helvetiker_bold.typeface.json"
          size={0.9}
          height={0.2}
          curveSegments={6}
          bevelEnabled
          bevelThickness={0.02}
          bevelSize={0.02}
          bevelOffset={0}
          bevelSegments={1}
          ref={textMeshRef} // Ref to the Mesh
        >
          Mrityunjay
          <meshMatcapMaterial matcap={matcapTexture} ref={textMatRef} />
        </Text3D>
      </Center>
    </group>
  );
}
function RotatingGroup() {
  const rotatingref = useRef<THREE.Group>(null!);
  useFrame((_, delta) => {
    if (rotatingref.current) {
      rotatingref.current.rotation.y += delta * 0.2; // Adjust rotation speed as needed
    }
  });
  return (
    <>
      <group ref={rotatingref}>
        <Donut />
        <RotatingText />
        <Square />
      </group>
    </>
  );
}
function Donut() {
  const matcapTexture = useTexture("textures/8.png");
  const geometryRef = useRef<THREE.TorusGeometry>(null!);
  const materialRef = useRef<THREE.MeshMatcapMaterial>(null!);

  useEffect(() => {
    // This will run when the component unmounts
    return () => {
      if (geometryRef.current) geometryRef.current.dispose();
      if (materialRef.current) materialRef.current.dispose();
      matcapTexture.dispose();
    };
  }, [matcapTexture]);

  const donuts = useMemo(() => {
    const donutElements = [];
    for (let i = 0; i < 100; i++) {
      donutElements.push(
        <mesh
          key={i}
          position={[
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
          ]}
          rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]}
          scale={Math.random() * 0.3 + 0.1}
        >
          <torusGeometry
            ref={i === 0 ? geometryRef : undefined}
            args={[1.4, 0.6, 32, 50]}
          />
          <meshMatcapMaterial
            ref={i === 0 ? materialRef : undefined}
            matcap={matcapTexture}
          />
        </mesh>,
      );
    }
    return donutElements;
  }, [matcapTexture]);

  return <group>{donuts}</group>;
}
function Square() {
  const matcapTexture = useTexture("textures/8.png");
  const geometryRef = useRef<THREE.BoxGeometry>(null!);
  const materialRef = useRef<THREE.MeshMatcapMaterial>(null!);

  useEffect(() => {
    // This will run when the component unmounts
    return () => {
      if (geometryRef.current) geometryRef.current.dispose();
      if (materialRef.current) materialRef.current.dispose();
      matcapTexture.dispose();
    };
  }, [matcapTexture]);

  const squares = useMemo(() => {
    const squareElements = [];
    for (let i = 0; i < 100; i++) {
      squareElements.push(
        <mesh
          key={i}
          position={[
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
          ]}
          rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]}
          scale={Math.random() * 0.3 + 0.1}
        >
          <boxGeometry ref={i === 0 ? geometryRef : undefined} args={[1, 1]} />
          <meshMatcapMaterial
            ref={i === 0 ? materialRef : undefined}
            matcap={matcapTexture}
          />
        </mesh>,
      );
    }
    return squareElements;
  }, [matcapTexture]);

  return <group>{squares}</group>;
}
// Main Canvas Component
export default function ThreeCanvas() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas
        camera={{
          position: [2, -2, 5],
          fov: 75,
        }}
        style={{ background: "#220000" }}
      >
        <RotatingGroup />
        {/* Camera controls for interaction */}
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      </Canvas>
    </div>
  );
}
