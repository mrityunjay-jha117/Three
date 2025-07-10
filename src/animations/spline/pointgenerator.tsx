import * as THREE from 'three';
export default function Pointgenerator() {
  const points: THREE.Vector3[] = [];

  for (let i = 0; i < 30; i++) {
    const angle = i * 0.4; // spacing angle
    const radius = 5 + Math.sin(i * 0.3) * 2; // wavy spiral
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const z = i * 0.8; // increasing z for spiral stretch
    points.push(new THREE.Vector3(x, y, z));
  }

  return points;
}