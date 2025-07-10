import { useRef, useEffect, useState } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import * as THREE from "three";

type AnimatedModelProps = {
  gltfPath: string;
};

type MovementKeys = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
};

export default function AnimatedModel({ gltfPath }: AnimatedModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(gltfPath);
  const { actions, mixer } = useAnimations(animations, groupRef);

  const { speed, scale } = useControls("Animation Controls", {
    speed: { value: 1, min: 0, max: 3, step: 0.1 },
    position: { value: [10, 10, 1000], step: 0.1 },
    rotation: { value: [0, 0, 0], step: 0.1 },
    scale: { value: 1, min: 0.1, max: 5, step: 0.1 },
  });

  const [wheelMeshes, setWheelMeshes] = useState<THREE.Mesh[]>([]);

  // Track key state
  const [movement, setMovement] = useState<MovementKeys>({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return; // avoid holding down repetition
      setMovement((prev) => ({
        ...prev,
        forward: e.key === "w" ? true : prev.forward,
        backward: e.key === "s" ? true : prev.backward,
        left: e.key === "a" ? true : prev.left,
        right: e.key === "d" ? true : prev.right,
      }));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setMovement((prev) => ({
        ...prev,
        forward: e.key === "w" ? false : prev.forward,
        backward: e.key === "s" ? false : prev.backward,
        left: e.key === "a" ? false : prev.left,
        right: e.key === "d" ? false : prev.right,
      }));
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const wheels: THREE.Mesh[] = [];
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (
          ["Cylinder001", "Cylinder007", "Cylinder014", "Cylinder021"].includes(
            child.name
          )
        ) {
          wheels.push(child);
        }
      }
    });
    setWheelMeshes(wheels);
  }, [scene]);

  useEffect(() => {
    if (!actions || animations.length === 0) return;
    const action = actions[animations[0].name];
    action?.reset().play().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.5);
  }, [actions, animations]);

  useFrame((_, delta) => {
    mixer?.update(delta * speed);

    const group = groupRef.current;
    if (!group) return;

    const moveSpeed = delta * 20;
    const rotateSpeed = delta * 6;

    
    if (movement.left) group.rotation.y -= rotateSpeed;
if (movement.right) group.rotation.y += rotateSpeed;

if (movement.forward || movement.backward) {
  const direction = movement.forward ? 1 : -1;

  // Get local forward direction
  // const forward = new THREE.Vector3(0, 0, -1);
  const forward = new THREE.Vector3(1, 0, 0);
  forward.applyQuaternion(group.quaternion); // apply car's rotation
  forward.normalize();

  // Move in that direction
  group.position.add(forward.multiplyScalar(moveSpeed * direction));

  // Spin wheels realistically
  wheelMeshes.forEach((mesh) => {
    mesh.rotation.y += moveSpeed * direction * 10; // Adjust axis if needed
  });
}


    group.scale.set(scale, scale, scale);
  });

  return <primitive ref={groupRef} object={scene} />;
}
