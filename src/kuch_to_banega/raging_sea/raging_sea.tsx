import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls } from "@react-three/drei";
import { useControls } from "leva";
import waterVertexShader from "./shaders/water/vertex.glsl?raw";
import waterFragmentShader from "./shaders/water/fragment.glsl?raw";

import perlinNoise from "./shaders/includes/perlinClassic3D.glsl?raw";
import ambientLight from "./shaders/includes/ambientLight.glsl?raw";
import directionalLight from "./shaders/includes/directionalLight.glsl?raw";
import pointLight from "./shaders/includes/pointLight.glsl?raw";

const shaderIncludes: Record<string, string> = {
  "perlinClassic3D.glsl": perlinNoise,
  "ambientLight.glsl": ambientLight,
  "directionalLight.glsl": directionalLight,
  "pointLight.glsl": pointLight,
};

const processShader = (
  shader: string,
  includeContent: Record<string, string> = shaderIncludes,
) => {
  const includeRegex = /#include\s+([^\s]+)/g;
  let processedShader = shader;
  let match;

  const processedIncludes = new Map<string, string>();
  while ((match = includeRegex.exec(shader)) !== null) {
    const includePath = match[1].replace(/['"<>]/g, "");
    const includeKey = includePath.split("/").pop() || "";

    if (!processedIncludes.has(includeKey) && includeKey in includeContent) {
      // Process include content only once per key
      const includeProcessed = processShader(
        includeContent[includeKey],
        includeContent,
      );
      processedIncludes.set(includeKey, includeProcessed);
    }

    if (processedIncludes.has(includeKey)) {
      const includeContent = processedIncludes.get(includeKey) || "";
      processedShader = processedShader.replace(match[0], includeContent);
    } else {
      console.warn(`Include not found: ${includePath}`);
      processedShader = processedShader.replace(match[0], "");
    }
  }

  return processedShader;
};

// Process shaders once at module level
const processedVertexShader = processShader(waterVertexShader);
const processedFragmentShader = processShader(waterFragmentShader);

const Water = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Leva Controls
  const {
    depthColor,
    surfaceColor,
    uBigWavesElevation,
    uBigWavesFrequencyX,
    uBigWavesFrequencyY,
    uBigWavesSpeed,
    uSmallWavesElevation,
    uSmallWavesFrequency,
    uSmallWavesSpeed,
    uSmallIterations,
    uColorOffset,
    uColorMultiplier,
  } = useControls({
    depthColor: "#ff4000",
    surfaceColor: "#151c37",
    uBigWavesElevation: { value: 0.2, min: 0, max: 1, step: 0.001 },
    uBigWavesFrequencyX: { value: 4, min: 0, max: 10, step: 0.001 },
    uBigWavesFrequencyY: { value: 1.5, min: 0, max: 10, step: 0.001 },
    uBigWavesSpeed: { value: 0.75, min: 0, max: 4, step: 0.001 },
    uSmallWavesElevation: { value: 0.15, min: 0, max: 1, step: 0.001 },
    uSmallWavesFrequency: { value: 3, min: 0, max: 30, step: 0.001 },
    uSmallWavesSpeed: { value: 0.2, min: 0, max: 4, step: 0.001 },
    uSmallIterations: { value: 4, min: 0, max: 5, step: 1 },
    uColorOffset: { value: 0.925, min: 0, max: 1, step: 0.001 },
    uColorMultiplier: { value: 1, min: 0, max: 10, step: 0.001 },
  });

  // Create ShaderMaterial once and store it in a ref
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: processedVertexShader,
      fragmentShader: processedFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uBigWavesElevation: { value: 0 },
        uBigWavesFrequency: { value: new THREE.Vector2() },
        uBigWavesSpeed: { value: 0 },
        uSmallWavesElevation: { value: 0 },
        uSmallWavesFrequency: { value: 0 },
        uSmallWavesSpeed: { value: 0 },
        uSmallIterations: { value: 0 },
        uDepthColor: { value: new THREE.Color() },
        uSurfaceColor: { value: new THREE.Color() },
        uColorOffset: { value: 0 },
        uColorMultiplier: { value: 0 },
      },
    });
  }, []);

  // Store for ref usage in animation frame
  materialRef.current = material;

  // Cleanup geometry and material on unmount
  useEffect(() => {
    return () => {
      if (meshRef.current) {
        if (meshRef.current.geometry) meshRef.current.geometry.dispose();
      }
      if (materialRef.current) {
        materialRef.current.dispose();
      }
    };
  }, []);

  // Update uniforms when controls change
  useEffect(() => {
    if (!material) return;

    material.uniforms.uBigWavesElevation.value = uBigWavesElevation;
    material.uniforms.uBigWavesFrequency.value.set(
      uBigWavesFrequencyX,
      uBigWavesFrequencyY,
    );
    material.uniforms.uBigWavesSpeed.value = uBigWavesSpeed;
    material.uniforms.uSmallWavesElevation.value = uSmallWavesElevation;
    material.uniforms.uSmallWavesFrequency.value = uSmallWavesFrequency;
    material.uniforms.uSmallWavesSpeed.value = uSmallWavesSpeed;
    material.uniforms.uSmallIterations.value = uSmallIterations;
    material.uniforms.uDepthColor.value.set(depthColor);
    material.uniforms.uSurfaceColor.value.set(surfaceColor);
    material.uniforms.uColorOffset.value = uColorOffset;
    material.uniforms.uColorMultiplier.value = uColorMultiplier;
  }, [
    material,
    uBigWavesElevation,
    uBigWavesFrequencyX,
    uBigWavesFrequencyY,
    uBigWavesSpeed,
    uSmallWavesElevation,
    uSmallWavesFrequency,
    uSmallWavesSpeed,
    uSmallIterations,
    depthColor,
    surfaceColor,
    uColorOffset,
    uColorMultiplier,
  ]);

  // Update time uniform in animation frame
  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI * 0.5, 0, 0]}>
      <planeGeometry args={[2, 2, 512, 512]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};

const WaterScene = () => {
  return (
    <Canvas
      camera={{ position: [1, 1, 1], fov: 75, near: 0.1, far: 100 }}
      gl={{ toneMapping: THREE.ACESFilmicToneMapping }}
    >
      <color attach="background" args={["#000"]} />
      <OrbitControls enableDamping />
      <Water />
    </Canvas>
  );
};

export default WaterScene;
