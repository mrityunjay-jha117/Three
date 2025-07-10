import { useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";

import vertex_shader from "./shaders_copy/coffeeSmoke/vertex.glsl?raw";
import fragment_shader from "./shaders_copy/coffeeSmoke/fragment.glsl?raw";

function Plane() {
  // const { scene } = useGLTF("/tuk.glb");
  const { scene, materials, nodes } = useGLTF("/bakedModel.glb");
  const bakedObj = scene.getObjectByName("baked");

  // Improve texture anisotropy if present
  if (
    bakedObj &&
    (bakedObj as THREE.Mesh).material &&
    ((bakedObj as THREE.Mesh).material as THREE.MeshStandardMaterial).map
  ) {
    (
      ((bakedObj as THREE.Mesh).material as THREE.MeshStandardMaterial)
        .map as THREE.Texture
    ).anisotropy = 8;
  }

  const texture = useTexture("/perlin.png");
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const planeGeoRef = useRef<THREE.PlaneGeometry>(null);

  useEffect(() => {
    return () => {
      // Dispose scene materials and geometries
      for (const key in materials) {
        materials[key].dispose();
      }
      for (const key in nodes) {
        const node = nodes[key];
        if ((node as THREE.Mesh).geometry) {
          ((node as THREE.Mesh).geometry as THREE.BufferGeometry).dispose();
        }
      }
      // Dispose custom resources
      if (planeGeoRef.current) {
        planeGeoRef.current.dispose();
      }
      if (materialRef.current) {
        materialRef.current.dispose();
      }
      texture.dispose();
    };
  }, [materials, nodes, texture]);

  // Animate utime using useFrame
  useFrame((delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.utime.value = delta.clock.getElapsedTime();
    }
  });

  return (
    <>
      <mesh position={[0, 4.85, 0]} scale={[1.5, 6, 1.5]}>
        <planeGeometry ref={planeGeoRef} args={[1, 1, 16, 64]} />
        <shaderMaterial
          ref={materialRef}
          side={THREE.DoubleSide}
          transparent={true}
          depthWrite={false}
          uniforms={{
            uperlintexture: { value: texture },
            utime: { value: 0 },
          }}
          vertexShader={vertex_shader}
          fragmentShader={fragment_shader}
        />
      </mesh>
      <primitive object={scene} />
    </>
  );
}

export default function Cofee() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas
        gl={{ antialias: true }}
        camera={{
          position: [-10, 12, 18],
          fov: 25,
          near: 0.1,
          far: 100,
        }}
        style={{ background: "#2d2d2d" }}
      >
        <Plane />
        <OrbitControls enablePan enableZoom enableRotate />
      </Canvas>
    </div>
  );
}
