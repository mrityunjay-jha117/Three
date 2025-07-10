import { useRef, useMemo, useEffect } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {  useControls, button as levaButton } from "leva";
import * as THREE from "three";
import gsap from "gsap";
import particlesVertexShader from "./shaders/particles/vertex.glsl?raw";
import particlesFragmentShader from "./shaders/particles/fragment.glsl?raw";
import { DRACOLoader, GLTFLoader } from "three/examples/jsm/Addons.js";

function ParticlesModel({
  glbPath = "/model.glb",
}: {
  glbPath?: string;
}) {
  const group = useRef<THREE.Group>(null!);
  const geometry = useRef(new THREE.BufferGeometry()).current;
  const currentRef = useRef(0);

  // Load GLB + DRACO
  const dracoLoader = useMemo(() => {
    const loader = new DRACOLoader();
    loader.setDecoderPath("/draco/");
    return loader;
  }, []);

  const gltf = useLoader(GLTFLoader, glbPath, (loader) =>
    loader.setDRACOLoader(dracoLoader),
  );
  const scene = gltf.scene;

  // Extract and pad position attributes
  const positionsArray = useMemo(() => {
    const attrs: THREE.BufferAttribute[] = [];
    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        const attr = mesh.geometry.attributes.position as THREE.BufferAttribute;
        if (attr) attrs.push(attr);
      }
    });
    return attrs;
  }, [scene]);

  const maxCount = useMemo(
    () => Math.max(...positionsArray.map((a) => a.count)),
    [positionsArray],
  );

  const padded = useMemo(() => {
    return positionsArray.map((attr) => {
      const src = attr.array as Float32Array;
      const dst = new Float32Array(maxCount * 3);
      for (let i = 0; i < maxCount; i++) {
        const i3 = i * 3;
        if (i3 < src.length) dst.set(src.subarray(i3, i3 + 3), i3);
        else {
          const idx = Math.floor(Math.random() * attr.count) * 3;
          dst.set(src.subarray(idx, idx + 3), i3);
        }
      }
      return new THREE.Float32BufferAttribute(dst, 3);
    });
  }, [positionsArray, maxCount]);

  const sizesArray = useMemo(() => {
    const arr = new Float32Array(maxCount);
    for (let i = 0; i < maxCount; i++) arr[i] = Math.random();
    return arr;
  }, [maxCount]);

  // Shader uniforms
  const uniforms = useMemo(
    () => ({
      uSize: { value: 0.2 },
      uResolution: {
        value: new THREE.Vector2(
          window.innerWidth * window.devicePixelRatio,
          window.innerHeight * window.devicePixelRatio,
        ),
      },
      uProgress: { value: 0 },
      uColorA: { value: new THREE.Color("#ff7300") },
      uColorB: { value: new THREE.Color("#0091ff") },
    }),
    [],
  );

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: particlesVertexShader,
        fragmentShader: particlesFragmentShader,
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [uniforms],
  );

  // Initial geometry setup and full cleanup
  useEffect(() => {
    geometry.setAttribute("position", padded[0]);
    geometry.setAttribute("aPositionTarget", padded[0]);
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizesArray, 1));

    return () => {
      // Dispose custom geometry and material
      geometry.dispose();
      material.dispose();

      // Dispose DRACO loader
      dracoLoader.dispose();

      // Dispose all resources from the loaded GLTF scene
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();

          const materials = Array.isArray(obj.material)
            ? obj.material
            : [obj.material];

          materials.forEach((mat) => {
            if (mat) {
              // Dispose textures
              Object.values(mat).forEach((value) => {
                if (value instanceof THREE.Texture) {
                  value.dispose();
                }
              });
              // Dispose material
              mat.dispose();
            }
          });
        }
      });
    };
  }, [geometry, material, padded, sizesArray, dracoLoader, scene]);

  // Morph between current ➝ next
  const morph = (nextIdx: number) => {
    const from = currentRef.current;
    if (!padded[nextIdx] || nextIdx === from) return;

    geometry.setAttribute("position", padded[from]);
    geometry.setAttribute("aPositionTarget", padded[nextIdx]);
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.aPositionTarget.needsUpdate = true;

    uniforms.uProgress.value = 0;

    gsap.to(uniforms.uProgress, {
      value: 1,
      duration: 2,
      ease: "linear",
      onComplete: () => {
        currentRef.current = nextIdx;
      },
    });
  };

  // Sync resolution
  useEffect(() => {
    const resize = () => {
      const d = window.devicePixelRatio;
      uniforms.uResolution.value.set(
        window.innerWidth * d,
        window.innerHeight * d,
      );
    };
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [uniforms]);

  // Leva controls for color
  const { colorA, colorB } = useControls("Colors", {
    colorA: "#ff7300",
    colorB: "#0091ff",
  });

  useEffect(() => {
    uniforms.uColorA.value.set(colorA);
  }, [colorA]);
  useEffect(() => {
    uniforms.uColorB.value.set(colorB);
  }, [colorB]);

  // Dynamic morph controls
  const morphButtons = useMemo(() => {
    const controls: Record<string, any> = {};
    for (let i = 0; i < padded.length; i++) {
      controls[`morphTo_${i}`] = levaButton(() => morph(i));
    }
    return controls;
  }, [padded]);

  useControls("Morph Targets", morphButtons);

  return (
    <group ref={group}>
      <points geometry={geometry} material={material} frustumCulled={false} />
      <OrbitControls enableDamping />
    </group>
  );
}

function CanvasWrapper({ glbPath }: { glbPath?: string }) {
  const { clearColor } = useControls("Appearance", { clearColor: "#160920" });

  return (
    <>
      <Canvas
        camera={{ position: [0, 0, 15], fov: 35 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={[clearColor]} />
        <ambientLight intensity={0.5} />
        <ParticlesModel glbPath={glbPath} />
      </Canvas>
    </>
  );
}

export default CanvasWrapper;
