import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  KeyboardControls,
  Stats,
  useKeyboardControls,
} from "@react-three/drei";
import {
  Physics,
  RigidBody,
  RapierRigidBody,
  CuboidCollider,
} from "@react-three/rapier";

// Define keyboard controls map as an array of entries
const keyboardMap = [
  { name: "forward", keys: ["ArrowUp", "KeyW"] },
  { name: "backward", keys: ["ArrowDown", "KeyS"] },
  { name: "left", keys: ["ArrowLeft", "KeyA"] },
  { name: "right", keys: ["ArrowRight", "KeyD"] },
  { name: "jump", keys: ["Space"] },
  { name: "sprint", keys: ["ShiftLeft", "ShiftRight"] },
];

// Tailwind 400 color palette
const tailwind400 = [
  "#f87171", // red-400
  "#fb923c", // orange-400
  "#facc15", // yellow-400
  "#4ade80", // green-400
  "#38bdf8", // blue-400
  "#818cf8", // indigo-400
  "#a78bfa", // violet-400
  "#f472b6", // pink-400
  "#34d399", // emerald-400
  "#fbbf24", // amber-400
];

// Utility to pick a random color
function getRandomColor() {
  return tailwind400[Math.floor(Math.random() * tailwind400.length)];
}

// Utility to pick a random scale
function getRandomScale() {
  return 0.7 + Math.random() * 1.3; // Range: 0.7 to 2.0
}

// Shared geometry and material (optimized for performance)
const sharedGeometries = [
  <sphereGeometry args={[1.2, 16, 16]} />, // Sphere (lower segments)
  <icosahedronGeometry args={[1.2, 0]} />, // Icosahedron (no subdivisions)
  <cylinderGeometry args={[0.7, 0.7, 1.8, 12]} />, // Cylinder (fewer segments)
  <boxGeometry args={[1.6, 1.6, 1.6]} />, // Cube (already optimal)
];

// Utility to get half-height for each geometry and scale
function getHalfHeight(geometryIdx: number, scale: number) {
  switch (geometryIdx) {
    case 0: // Sphere
      return 1.2 * scale; // radius * scale
    case 1: // Icosahedron (roughly spherical)
      return 1.2 * scale;
    case 2: // Cylinder
      return 0.9 * scale; // half of height (1.8 * scale / 2)
    case 3: // Cube
      return 0.8 * scale; // half of height (1.6 * scale / 2)
    default:
      return scale;
  }
}

// Utility to get collider type for each geometry
// Only "ball", "cuboid", or "trimesh" are valid for RigidBodyAutoCollider
function getColliderType(geometryIdx: number): "ball" | "cuboid" {
  switch (geometryIdx) {
    case 0:
    case 1:
      return "ball";
    case 2:
      return "cuboid"; // Use "cuboid" for cylinder as fallback
    case 3:
      return "cuboid";
    default:
      return "ball";
  }
}

// Shared ref for obstacles tracking
const obstacleRefs: React.MutableRefObject<RapierRigidBody | null>[] = [];

// High Score Clock component
const HighScoreClock = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [highScore, setHighScore] = useState(0);
  const [obstaclesRemaining, setObstaclesRemaining] = useState(30);
  const [hasSpawnedObstacles, setHasSpawnedObstacles] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const checkIntervalRef = useRef<number | null>(null);
  const timeRef = useRef(0); // <-- NEW

  // Keep timeRef in sync with time
  useEffect(() => {
    timeRef.current = time;
  }, [time]);

  // Start timer immediately
  useEffect(() => {
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setTime((prevTime) => {
        const next = prevTime + 0.1;
        timeRef.current = next;
        return next;
      });
    }, 100);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Check obstacles and stop timer when needed
  useEffect(() => {
    checkIntervalRef.current = setInterval(() => {
      // Wait for obstacles to be created
      if (obstacleRefs.length === 0) {
        setObstaclesRemaining(30);
        return;
      }
      if (!hasSpawnedObstacles && obstacleRefs.length > 0) {
        setHasSpawnedObstacles(true);
      }
      const planeY = -10;
      let remaining = 0;
      obstacleRefs.forEach((ref) => {
        if (ref.current) {
          try {
            const position = ref.current.translation();
            if (position.y > planeY) {
              remaining++;
            }
          } catch (error) {}
        }
      });
      setObstaclesRemaining(remaining);
      // Only stop timer if obstacles have ever been spawned
      if (
        hasSpawnedObstacles &&
        remaining === 0 &&
        obstacleRefs.length > 0 &&
        isRunning
      ) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsRunning(false);
        setHighScore((prev) => Math.max(prev, timeRef.current)); // Use latest time
      }
    }, 200);
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [isRunning, hasSpawnedObstacles]); // Remove 'time' from deps, use ref

  // Reset timer and high score if obstacles are respawned (optional, not required for now)

  return (
    <div className="absolute top-4 right-4 text-white bg-black/70 rounded-lg p-4 font-mono">
      <div className="text-xl font-bold">
        Time: {time.toFixed(1)}s {isRunning ? "🟢" : "🔴"}
      </div>
      <div className="text-sm text-gray-300">
        Obstacles: {obstaclesRemaining}/{Math.max(obstacleRefs.length, 30)}
      </div>
      <div className="text-xs text-blue-300">
        Status: {isRunning ? "Running..." : "Stopped"}
      </div>
      <div className="text-xs text-gray-400">
        Debug: Refs={obstacleRefs.length}, Timer=
        {intervalRef.current ? "✓" : "✗"}
      </div>
      {!isRunning && (
        <div className="text-lg text-green-400">
          High Score: {highScore.toFixed(1)}s
        </div>
      )}
      {!isRunning && obstacleRefs.length > 0 && (
        <div className="text-sm text-yellow-400 mt-1">
          All obstacles cleared!
        </div>
      )}
    </div>
  );
};

// Shared ref for player position
const playerPositionRef = { current: new THREE.Vector3(0, 2, 0) };

// Player component controlled by WASD keys
const Player = ({
  cameraYawRef,
}: {
  cameraYawRef: React.MutableRefObject<number>;
}) => {
  // Correct keyboard controls
  const [subscribeKeys, getKeys] = useKeyboardControls();
  const playerRef = useRef<RapierRigidBody>(null);
  const jumpForce = 300; // Increased from 25
  const moveSpeed = 20; // Much faster
  const sprintMultiplier = 3.0; // Much faster sprint
  const moveDirection = useRef(new THREE.Vector3());
  const currentVelocity = useRef(new THREE.Vector3());
  const { camera } = useThree(); // Add this line to access the camera
  const playerGroup = useRef<THREE.Group>(null);
  const bounceCount = useRef(0); // Track number of bounces
  const maxBounces = 3; // Maximum allowed bounces

  useFrame(() => {
    if (!playerRef.current) return;
    // --- READ ALL VALUES FIRST ---
    const velocity = playerRef.current.linvel();
    const position = playerRef.current.translation();
    currentVelocity.current.set(velocity.x, velocity.y, velocity.z);
    playerPositionRef.current.set(position.x, position.y, position.z);

    // Check for ground collision to count bounces
    const isNearGround = position.y < 2.5 && velocity.y < -0.1;
    if (isNearGround && bounceCount.current < maxBounces) {
      // Allow bounce
    } else if (bounceCount.current >= maxBounces) {
      // Stop bouncing by setting high damping
      playerRef.current.setLinearDamping(15);
      playerRef.current.setAngularDamping(15);
    }

    // Reset bounce count when player jumps or is well above ground
    if (position.y > 3 && velocity.y > 0) {
      bounceCount.current = 0;
      playerRef.current.setLinearDamping(1.2);
      playerRef.current.setAngularDamping(0.8);
    }

    // Rotate player mesh to match camera yaw
    if (playerGroup.current) {
      playerGroup.current.rotation.y = cameraYawRef.current;
    }

    // Get keyboard state
    const keys = getKeys();
    const forward = keys["forward"];
    const backward = keys["backward"];
    const left = keys["left"];
    const right = keys["right"];
    const sprint = keys["sprint"];
    const moveActive = forward || backward || left || right;

    // Calculate movement directions (relative to camera)
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0;
    cameraDirection.normalize();
    const cameraRight = new THREE.Vector3();
    cameraRight.crossVectors(cameraDirection, camera.up).normalize();

    // Calculate move direction from inputs
    moveDirection.current.set(0, 0, 0);
    if (forward) moveDirection.current.add(cameraDirection);
    if (backward) moveDirection.current.sub(cameraDirection);
    if (right) moveDirection.current.add(cameraRight);
    if (left) moveDirection.current.sub(cameraRight);
    if (moveDirection.current.lengthSq() > 0) moveDirection.current.normalize();

    // Set target speed
    const currentSpeed = sprint ? moveSpeed * sprintMultiplier : moveSpeed;

    // --- NOW WRITE ---
    if (moveActive) {
      // Clamp horizontal velocity for control
      const targetVel = {
        x: moveDirection.current.x * currentSpeed,
        y: velocity.y,
        z: moveDirection.current.z * currentSpeed,
      };
      // Clamp to max speed
      const hVel = Math.sqrt(
        targetVel.x * targetVel.x + targetVel.z * targetVel.z,
      );
      const maxVel = moveSpeed * sprintMultiplier;
      if (hVel > maxVel) {
        const scale = maxVel / hVel;
        targetVel.x *= scale;
        targetVel.z *= scale;
      }
      playerRef.current.setLinvel(targetVel, true);
    } else {
      // No input: apply strong braking to horizontal velocity
      playerRef.current.setLinvel(
        {
          x: velocity.x * 0.6,
          y: velocity.y,
          z: velocity.z * 0.6,
        },
        true,
      );
    }
  });

  // Pure jump logic: allow jumping anytime without ground detection
  useEffect(() => {
    const unsubscribeJump = subscribeKeys(
      (state) => state.jump,
      (value) => {
        if (value && playerRef.current) {
          // Pure jump - no ground checking, can jump in midair
          playerRef.current.applyImpulse({ x: 0, y: jumpForce, z: 0 }, true);
        }
      },
    );
    return () => {
      unsubscribeJump();
    };
  }, [subscribeKeys, jumpForce]);

  return (
    <RigidBody
      ref={playerRef}
      position={[0, 1.5 * 1.2, 0]} // Y = radius * scale
      mass={12}
      linearDamping={1.2}
      angularDamping={0.8}
      enabledRotations={[false, false, false]}
      lockRotations={true}
      friction={0.01}
      restitution={1.9}
      userData={{ isPlayer: true }}
      colliders="ball"
      onCollisionEnter={(event) => {
        // Count bounces when hitting the ground
        const otherBody = event.other.rigidBody;
        if (otherBody && otherBody.bodyType() === 0) {
          // Fixed body (ground)
          bounceCount.current += 1;
        }
      }}
    >
      <group ref={playerGroup}>
        <mesh scale={[1.5, 1.5, 1.5]}>
          <sphereGeometry args={[1.2, 16, 16]} />
          <meshStandardMaterial
            color="#38bdf8"
            roughness={0.4}
            metalness={0.6}
          />
        </mesh>
      </group>
    </RigidBody>
  );
};

// TPS Camera Controller
const TPSCameraController = ({
  cameraYawRef,
}: {
  cameraYawRef: React.MutableRefObject<number>;
}) => {
  const { camera, gl } = useThree();
  const yaw = cameraYawRef;
  const isPointerDown = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const distance = 10;
  const height = 5;

  // Smoothed camera target
  const smoothedTarget = useRef(playerPositionRef.current.clone());

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      isPointerDown.current = true;
      lastPointer.current.x = e.clientX;
      lastPointer.current.y = e.clientY;
    };
    const onPointerUp = () => {
      isPointerDown.current = false;
    };
    const onPointerMove = (e: MouseEvent) => {
      if (!isPointerDown.current) return;
      const dx = e.clientX - lastPointer.current.x;
      // Only update yaw, ignore dy for pitch
      yaw.current -= dx * 0.01;
      lastPointer.current.x = e.clientX;
      lastPointer.current.y = e.clientY;
    };
    gl.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointermove", onPointerMove);
    return () => {
      gl.domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, [gl, yaw]);

  useFrame(() => {
    // Smoothly interpolate camera target toward player position
    smoothedTarget.current.lerp(playerPositionRef.current, 0.18);
    // Camera always at fixed height, only rotates around Y
    const offset = new THREE.Vector3(
      Math.sin(yaw.current) * distance,
      height,
      Math.cos(yaw.current) * distance,
    );
    camera.position.copy(smoothedTarget.current).add(offset);
    camera.lookAt(smoothedTarget.current);
  });
  return null;
};

// Object generator that creates obstacles at random positions
const ObstacleGenerator = React.memo(() => {
  const obstacles: React.ReactElement[] = [];
  const maxObstacles = 30; // Reduced from 50
  const spawnRadius = 45; // Reduced spawn radius to keep obstacles on finite plane

  // Clear existing refs
  obstacleRefs.length = 0;

  for (let i = 0; i < maxObstacles; i++) {
    const x = (Math.random() - 0.5) * spawnRadius;
    const z = (Math.random() - 0.5) * spawnRadius;
    const geometryIdx = Math.floor(Math.random() * sharedGeometries.length);
    const geometry = sharedGeometries[geometryIdx];
    const color = getRandomColor();
    const scale = getRandomScale();
    const halfHeight = getHalfHeight(geometryIdx, scale);
    // Always spawn strictly above plane, never submerged
    const y = halfHeight + 0.01 + Math.random() * 15;
    const colliderType = getColliderType(geometryIdx);

    // Create ref for this obstacle
    const obstacleRef = React.createRef<RapierRigidBody>();
    obstacleRefs.push(obstacleRef);

    obstacles.push(
      <RigidBody
        key={`obstacle-${i}`}
        ref={obstacleRef}
        position={[x, y, z]}
        colliders={colliderType}
        type={"dynamic"}
        mass={4}
        friction={0.08}
        restitution={0.2}
        linearDamping={0.5}
        angularDamping={0.5}
      >
        <mesh scale={[scale, scale, scale]}>
          {geometry}
          <meshStandardMaterial color={color} roughness={0.4} metalness={0.6} />
        </mesh>
      </RigidBody>,
    );
  }
  return <>{obstacles}</>;
});

// Finite plane component
const FinitePlane = () => {
  return (
    <>
      {/* Physical collider */}
      <RigidBody type="fixed" friction={0.01}>
        {/* Lower ground friction */}
        <CuboidCollider args={[50, 0.1, 50]} position={[0, 0, 0]} />
      </RigidBody>

      {/* Visual plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#303030" />
      </mesh>

      {/* Grid for visual reference */}
      <group position={[0, 0.01, 0]}>
        <gridHelper args={[100, 100, "#606060", "#404040"]} />
      </group>
    </>
  );
};

// Set up keyboard controls
// (Removed duplicate keyboardMap declaration)

// Instructions component
const Instructions = () => {
  return (
    <div className="absolute top-0 left-0 text-white p-4 bg-black/50 rounded-br-lg">
      <h2 className="text-xl font-bold mb-2">Controls:</h2>
      <ul>
        <li>WASD or Arrow Keys: Move</li>
        <li>Space: Jump</li>
        <li>Shift: Sprint</li>
      </ul>
    </div>
  );
};

// Main scene component
const Scene = ({
  cameraYawRef,
}: {
  cameraYawRef: React.MutableRefObject<number>;
}) => {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <Physics gravity={[0, -50, 0]} timeStep={1 / 60} interpolate={true}>
        <Player cameraYawRef={cameraYawRef} />
        <FinitePlane />
        <ObstacleGenerator />
      </Physics>
      <Environment preset="sunset" background={false} />
    </>
  );
};

// Main canvas component
const GameCanvas = () => {
  const cameraYawRef = useRef(0);
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
    <KeyboardControls map={keyboardMap}>
      <div style={{ width: "100%", height: "100vh" }}>
        <Canvas
          camera={{ position: [0, 5, 10], fov: 75 }}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            outputColorSpace: THREE.SRGBColorSpace,
          }}
        >
          <Scene cameraYawRef={cameraYawRef} />
          <TPSCameraController cameraYawRef={cameraYawRef} />
          {/* FPS Stats in top-right corner */}
          <Stats />
        </Canvas>
        <Instructions />
        <HighScoreClock />
      </div>
    </KeyboardControls>
  );
};

export default GameCanvas;
