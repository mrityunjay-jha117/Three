import React, { useRef, useEffect, useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { RigidBody, Physics, RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";

// Types
interface BodyProps {
  position: [number, number, number];
  color: number;
  mousePosition: THREE.Vector3;
}

interface MouseBallProps {
  mousePosition: THREE.Vector3;
}

// Constants
const SCENE_MIDDLE = new THREE.Vector3(0, 0, 0);
const COLOR_PALETTE = [
  0xf87171, // red-400
  0xfb923c, // orange-400
  0xfacc15, // yellow-400
  0x4ade80, // green-400
  0x34d399, // emerald-400
  0x60a5fa, // blue-400
  0x818cf8, // indigo-400
  0xc084fc, // purple-400
  0xf472b6, // pink-400
  0x94a3b8, // slate-400
];

// Physical Body Component
const PhysicalBody: React.FC<BodyProps> = ({
  position,
  color,
  mousePosition,
}) => {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!rigidBodyRef.current || !meshRef.current) return;

    const rigidBody = rigidBodyRef.current;
    rigidBody.resetForces(true);

    const translation = rigidBody.translation();
    const pos = new THREE.Vector3(translation.x, translation.y, translation.z);
    const dir = pos.clone().sub(SCENE_MIDDLE).normalize();
    const distance = pos.length();

    // Apply force towards center with distance-based scaling to prevent overshooting
    const forceStrength = Math.min(-1.5, -distance * 0.3);
    rigidBody.addForce(dir.multiplyScalar(forceStrength), true);

    // Add mouse repulsion force
    const mouseDistance = pos.distanceTo(mousePosition);
    const repulsionRadius = 3.0; // Distance at which repulsion starts
    const repulsionStrength = 10.0; // Strength of repulsion

    if (mouseDistance < repulsionRadius) {
      const mouseDir = pos.clone().sub(mousePosition).normalize();
      const repulsionForce =
        (repulsionStrength * (repulsionRadius - mouseDistance)) /
        repulsionRadius;
      rigidBody.addForce(mouseDir.multiplyScalar(repulsionForce), true);
    }

    // Update mesh rotation
    const rotation = rigidBody.rotation();
    const quaternion = new THREE.Quaternion(
      rotation.x,
      rotation.y,
      rotation.z,
      rotation.w,
    );
    meshRef.current.setRotationFromQuaternion(quaternion);
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={position}
      colliders="ball"
      linearDamping={2.0}
      angularDamping={2.0}
    >
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshLambertMaterial color={color}  />
      </mesh>
    </RigidBody>
  );
};

// Mouse Ball Component
const MouseBall: React.FC<MouseBallProps> = ({ mousePosition }) => {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (rigidBodyRef.current) {
      rigidBodyRef.current.setTranslation(mousePosition, true);
    }
    if (lightRef.current) {
      lightRef.current.position.copy(mousePosition);
    }
  });

  return (
    <>
      <RigidBody
        ref={rigidBodyRef}
        type="kinematicPosition"
        colliders="ball"
        position={[0, 0, 0]}
      />
      {/* Glowing bulb mesh at mouse position */}
      <mesh position={mousePosition}>
        <sphereGeometry args={[0.08, 24, 24]} />
        <meshPhysicalMaterial
          color={0xffffcc}
          emissive={0xffffaa}
          emissiveIntensity={1.5}
          roughness={0.2}
          metalness={0.1}
          transparent={true}
          opacity={0.95}
        />
      </mesh>
      <pointLight
        ref={lightRef}
        position={mousePosition}
        intensity={10}
        distance={3}
        decay={2}
        color={0xffffff}
        castShadow={true}
      />
    </>
  );
};

// Mouse Interaction Hook
const useMouseInteraction = () => {
  const { camera, raycaster, pointer } = useThree();
  const [mousePosition, setMousePosition] = useState(
    new THREE.Vector3(0, 0, 0),
  );
  const mousePlaneRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!mousePlaneRef.current) return;

    // Orient the mouse plane to the camera
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    cameraDirection.multiplyScalar(-1);
    mousePlaneRef.current.lookAt(cameraDirection);

    // Raycast to get mouse position in 3D space
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(
      [mousePlaneRef.current],
      false,
    );

    if (intersects.length > 0) {
      setMousePosition(intersects[0].point);
    }
  });

  return { mousePosition, mousePlaneRef };
};

// Main Physics Scene Component
const PhysicsScene: React.FC = () => {
  const { mousePosition, mousePlaneRef } = useMouseInteraction();

  // Generate random bodies
  const bodies = useMemo(() => {
    const bodyArray = [];
    const numBodies = 30;
    const range = 12;

    for (let i = 0; i < numBodies; i++) {
      const position: [number, number, number] = [
        Math.random() * range - range * 0.25,
        Math.random() * range - range * 0.25 + 0.05,
        Math.random() * range - range * 0.25,
      ];

      const color =
        COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];

      bodyArray.push({
        key: i,
        position,
        color,
      });
    }

    return bodyArray;
  }, []);

  return (
    <Physics gravity={[0, 0, 0]} debug={false}>
      {/* Mouse interaction plane (invisible) */}
      <mesh ref={mousePlaneRef} position={[0, 0, 0.2]}>
        <planeGeometry args={[48, 48]} />
        <meshLambertMaterial transparent opacity={0} />
      </mesh>

      {/* Physical bodies */}
      {bodies.map((body) => (
        <PhysicalBody
          key={body.key}
          position={body.position}
          color={body.color}
          mousePosition={mousePosition}
        />
      ))}

      {/* Mouse ball */}
      <MouseBall mousePosition={mousePosition} />

      {/* Better lighting for 3D appearance */}
      <ambientLight intensity={4} />
    </Physics>
  );
};

// Main R3F Component
const RapierPhysics: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Give some time for geometries to load
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

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

  if (isLoading) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000",
          color: "#fff",
          fontSize: "1.5rem",
        }}
      >
        Loading Physics Scene...
      </div>
    );
  }
  return (
    <div
      style={{ width: "100vw", height: "100vh", backgroundColor: "#000000" }}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        scene={{ background: new THREE.Color(0x000000) }}
      >
        <OrbitControls enableZoom={false} enableDamping />
        <PhysicsScene />
      </Canvas>
    </div>
  );
};

export default RapierPhysics;
