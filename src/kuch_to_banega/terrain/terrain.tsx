import { useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  AdaptiveDpr,
  useDetectGPU,
} from "@react-three/drei";
import * as THREE from "three";
import { useControls, Leva } from "leva";

// NOTE: You'll need to install these packages
import { SUBTRACTION, Evaluator, Brush } from "three-bvh-csg";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";

// NOTE: Make sure these shader files exist
import terrainVertexShader from "./shaders/terrain/vertex.glsl?raw";
import terrainFragmentShader from "./shaders/terrain/fragment.glsl?raw";

// Performance monitor component
const PerformanceMonitor = () => {
  const { performance } = useControls("Performance", {
    performance: { value: "medium", options: ["low", "medium", "high"] },
  });

  const { gl } = useThree();

  useEffect(() => {
    // Adjust pixel ratio based on performance setting
    if (performance === "low") {
      gl.setPixelRatio(Math.min(window.devicePixelRatio, 1));
    } else if (performance === "medium") {
      gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    } else {
      gl.setPixelRatio(window.devicePixelRatio);
    }
  }, [performance, gl]);

  return null;
};

// Create terrain mesh component
const TerrainMesh = () => {
  // Refs
  const terrainRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<CustomShaderMaterial | null>(null);
  const timeRef = useRef(0);

  // Get GPU capabilities to adjust quality
  const gpu = useDetectGPU();

  useEffect(() => {
    return () => {
      // Dispose of material and geometry
      if (materialRef.current) {
        materialRef.current.dispose();
      }
      if (terrainRef.current && terrainRef.current.geometry) {
        terrainRef.current.geometry.dispose();
      }
    };
  }, []);

  // Dynamic resolution based on GPU
  const getTerrainResolution = () => {
    if (!gpu.tier) return 96; // Default
    if (gpu.tier === 3) return 128; // High-end
    if (gpu.tier === 2) return 96; // Mid-range
    return 64; // Low-end
  };

  const resolution = useMemo(() => getTerrainResolution(), [gpu.tier]);

  // Controls with performance-related parameters
  const {
    positionFrequency,
    strength,
    warpFrequency,
    warpStrength,
    colorWaterDeep,
    colorWaterSurface,
    colorSand,
    colorGrass,
    colorSnow,
    colorRock,
    animationSpeed,
    animationEnabled,
  } = useControls({
    positionFrequency: { value: 0.2, min: 0, max: 0.3, step: 0.001 },
    strength: { value: 4.2, min: 0, max: 5, step: 0.001 },
    warpFrequency: { value: 0.1, min: 0, max: 4, step: 0.001 },
    warpStrength: { value: 0.5, min: 0, max: 1, step: 0.001 },
    colorWaterDeep: "#002b3d",
    colorWaterSurface: "#287ff2",
    colorSand: "#ffe894",
    colorGrass: "#85d534",
    colorSnow: "#dbcbcb",
    colorRock: "#bfbd8d",
    animationSpeed: { value: 0.5, min: 0, max: 2, step: 0.1 },
    animationEnabled: true,
  });

  // Uniforms with memoization
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPositionFrequency: { value: positionFrequency },
      uStrength: { value: strength },
      uWarpFrequency: { value: warpFrequency },
      uWarpStrength: { value: warpStrength },
      uColorWaterDeep: { value: new THREE.Color(colorWaterDeep) },
      uColorWaterSurface: { value: new THREE.Color(colorWaterSurface) },
      uColorSand: { value: new THREE.Color(colorSand) },
      uColorGrass: { value: new THREE.Color(colorGrass) },
      uColorSnow: { value: new THREE.Color(colorSnow) },
      uColorRock: { value: new THREE.Color(colorRock) },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Create materials with optimized settings
  const material = useMemo(
    () =>
      new CustomShaderMaterial({
        baseMaterial: THREE.MeshStandardMaterial,
        vertexShader: terrainVertexShader,
        fragmentShader: terrainFragmentShader,
        uniforms: uniforms, // Pass uniforms here
      }),
    [uniforms],
  );

  // Assign material to ref for cleanup
  useEffect(() => {
    materialRef.current = material;
  }, [material]);

  // Update uniforms when controls change
  useEffect(() => {
    if (!materialRef.current) return;

    uniforms.uPositionFrequency.value = positionFrequency;
    uniforms.uStrength.value = strength;
    uniforms.uWarpFrequency.value = warpFrequency;
    uniforms.uWarpStrength.value = warpStrength;
    uniforms.uColorWaterDeep.value.set(colorWaterDeep);
    uniforms.uColorWaterSurface.value.set(colorWaterSurface);
    uniforms.uColorSand.value.set(colorSand);
    uniforms.uColorGrass.value.set(colorGrass);
    uniforms.uColorSnow.value.set(colorSnow);
    uniforms.uColorRock.value.set(colorRock);
  }, [
    positionFrequency,
    strength,
    warpFrequency,
    warpStrength,
    colorWaterDeep,
    colorWaterSurface,
    colorSand,
    colorGrass,
    colorSnow,
    colorRock,
    uniforms,
  ]);

  // Optimized animation with delta time and frame skipping
  useFrame((_, delta) => {
    if (!terrainRef.current || !animationEnabled) return;

    // Update less frequently for better performance
    timeRef.current += delta * animationSpeed;
    if (Math.floor(timeRef.current * 60) % 2 === 0) {
      uniforms.uTime.value = timeRef.current;
    }
  });

  // Create terrain geometry with dynamic resolution for better performance
  const geometry = useMemo(() => {
    // Use dynamic resolution based on GPU capabilities
    const geo = new THREE.PlaneGeometry(10, 10, resolution, resolution);
    geo.deleteAttribute("uv");
    geo.deleteAttribute("normal");
    geo.rotateX(-Math.PI * 0.5);
    return geo;
  }, [resolution]);

  return (
    <mesh
      ref={terrainRef}
      geometry={geometry}
      material={material}
      castShadow
      receiveShadow
      frustumCulled={true}
    />
  );
};

// Create board component with simplified geometry
const Board = () => {
  // Create board using CSG - memoize result for performance
  const boardMesh = useMemo(() => {
    // Lower resolution for the board which doesn't need high detail
    const boardFill = new Brush(new THREE.BoxGeometry(11, 2, 11, 1, 1, 1));
    const boardHole = new Brush(new THREE.BoxGeometry(10, 2.1, 10, 1, 1, 1));
    const evaluator = new Evaluator();
    const board = evaluator.evaluate(boardFill, boardHole, SUBTRACTION);
    board.geometry.clearGroups();
    return board;
  }, []);

  return (
    <primitive object={boardMesh} castShadow receiveShadow>
      <meshStandardMaterial color="#ffffff" metalness={0} roughness={0.3} />
    </primitive>
  );
};

// Create water component with simplified geometry
const Water = () => {
  return (
    <mesh position={[0, -0.1, 0]} rotation={[-Math.PI * 0.5, 0, 0]}>
      <planeGeometry args={[10, 10, 1, 1]} />
      <meshPhysicalMaterial transmission={1} roughness={0.3} />
    </mesh>
  );
};

// Create scene with optimized lighting
const TerrainScene = () => {
  return (
    <>
      {/* Environment with disabled background for better performance */}
      <Environment preset="sunset" background={false} />

      {/* Optimized directional light */}
      <directionalLight
        position={[6.25, 3, 4]}
        intensity={2}
        castShadow
        shadow-mapSize={[512, 512]} // Reduced from 1024 for performance
        shadow-camera-near={0.1}
        shadow-camera-far={30}
        shadow-camera-top={8}
        shadow-camera-right={8}
        shadow-camera-bottom={-8}
        shadow-camera-left={-8}
      />

      {/* Scene content */}
      <TerrainMesh />
      <Board />
      <Water />

      {/* Camera controls with damping for smoother performance */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        zoomSpeed={0.5}
      />
    </>
  );
};

// Main exported component with performance optimizations
export default function TerrainCanvas() {
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
    <>

      <Canvas
        style={{ background: "#bdbdbd" }}
        shadows
        dpr={[0.8, 1.5]}
        camera={{ position: [-10, 6, -2], fov: 35 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1,
          outputColorSpace: "srgb",
          powerPreference: "high-performance",
        }}
        performance={{ min: 0.5 }}
        // ⬇️ Attach canvas DOM reference
        onCreated={({ gl }) => {
          canvasRef.current = gl.domElement;
        }}
      >
        <AdaptiveDpr pixelated />
        <PerformanceMonitor />
        <TerrainScene />
      </Canvas>
    </>
  );
}
