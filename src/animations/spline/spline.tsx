import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useMemo, useState } from 'react';

type FlyingTubeProps = {
  points: THREE.Vector3[];
  speed?: number;
};

export default function FlyingTubeScene({ points, speed = 0.005 }: FlyingTubeProps) {
  const { camera, scene } = useThree();

  // Set fog once when scene is available
  useMemo(() => {
    scene.fog = new THREE.Fog('#000000', 10, 10); // near = 10, far = 50
  }, [scene]);

  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  }, [points]);

  const geometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 300, 2, 30, false);
  }, [curve]);

  const material = useMemo(() => {
    const texture = new THREE.TextureLoader().load('/spacepart2.jpg');
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 10);

    const mat = new THREE.MeshStandardMaterial({
      color: 'white',
      // emissive: new THREE.Color(),
      emissiveIntensity: 1,
      wireframe:true,
      metalness: 0.3,
      roughness: 0.2,
      map: texture,
      side: THREE.BackSide,
    });

    return mat;
  }, []);

  const meshRef = useRef<THREE.Mesh>(null);
  const [t, setT] = useState(0);

  useFrame((_, delta) => {
    const newT = (t + speed * delta) % 1;
    const pos = curve.getPointAt(newT);
    const tangent = curve.getTangentAt(newT);

    camera.position.copy(pos);
    camera.lookAt(pos.clone().add(tangent));
    setT(newT);
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 0, 0]} intensity={3} color="white" />
      <mesh geometry={geometry} material={material} ref={meshRef} />
    </>
  );
}
