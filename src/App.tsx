import React, { lazy, Suspense, useState } from "react";
import { Loader } from "@react-three/drei";

// Lazy imports for each 3D scene (each includes its own Canvas)
const Shadow = lazy(
  () => import("./kuch_to_banega/bouncing_ball_shadow/shadow"),
);
const Particles = lazy(
  () => import("./kuch_to_banega/floating_bubbles/particles"),
);
const CanvasWrapper = lazy(() => import("./kuch_to_banega/morphing/morphing"));
const ThreeCanvas = lazy(() => import("./kuch_to_banega/intro/3dtext"));
const WaterScene = lazy(() => import("./kuch_to_banega/raging_sea/raging_sea"));
const Cofee = lazy(() => import("./kuch_to_banega/buy me a coffee/coffee"));
const TerrainCanvas = lazy(() => import("./kuch_to_banega/terrain/terrain"));
const PhysicsGame = lazy(() => import("./kuch_to_banega/game/canvas"));

const modelNames = [
  "3D Text Intro",
  "Buy Me A Coffee",
  "Terrain",
  "Morphing Particles",
  "Raging Sea",
  "Floating Bubbles",
  "Bouncing Ball Shadow",
  "Physics Game",
] as const;

type ModelName = (typeof modelNames)[number];

const models: Record<
  ModelName,
  React.LazyExoticComponent<React.ComponentType<any>>
> = {
  "3D Text Intro": ThreeCanvas,
  "Buy Me A Coffee": Cofee,
  "Terrain": TerrainCanvas,
  "Morphing Particles": CanvasWrapper,
  "Raging Sea": WaterScene,
  "Floating Bubbles": Particles,
  "Bouncing Ball Shadow": Shadow,
  "Physics Game": PhysicsGame,
};

export default function App() {
  const [model, setModel] = useState<{ name: ModelName; key: string } | null>(
    null,
  );
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleModelChange = (modelName: ModelName | null) => {
    // Prevent changing models while a transition is in progress
    if (isTransitioning) {
      return;
    }

    // If we are just going back to the menu
    if (!modelName) {
      setModel(null);
      return;
    }

    // Start the transition process
    setIsTransitioning(true);

    // 1. Unmount the current component by setting the model to null.
    //    This triggers the useEffect cleanup functions in the active scene.
    setModel(null);

    // 2. Wait for a moment to allow for GPU memory and other resources
    //    to be fully released by the unmounted component.
    setTimeout(() => {
      // 3. Mount the new component with a unique key to ensure it's a fresh instance.
      setModel({ name: modelName, key: `scene-${Date.now()}` });
      setIsTransitioning(false);
    }, 200); // A slightly longer delay for safer cleanup
  };

  const ModelComponent = model ? models[model.name] : null;

  return (
    <div className="w-full h-screen bg-black text-white flex flex-col items-center justify-center">
      {!model ? (
        <>
          <h1 className="text-2xl font-semibold my-4">Select a 3D Model</h1>
          <div className="flex flex-wrap justify-center gap-4">
            {modelNames.map((name) => (
              <button
                key={name}
                className="px-4 py-2 rounded-md border bg-gray-800 hover:bg-gray-700 disabled:opacity-50"
                onClick={() => handleModelChange(name)}
                disabled={isTransitioning}
              >
                {name}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <button
            className="absolute top-4 left-4 px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 border border-gray-500 text-sm disabled:opacity-50"
            onClick={() => handleModelChange(null)}
            disabled={isTransitioning}
          >
            ← Back
          </button>

          <div key={model.key} className="w-full h-[80vh]">
            <Suspense
              fallback={
                <div className="flex items-center justify-center w-full h-full">
                  <p className="animate-pulse text-xl">Loading 3D Scene...</p>
                </div>
              }
            >
              {ModelComponent && <ModelComponent />}
            </Suspense>
          </div>
        </>
      )}

      <Loader />
    </div>
  );
}
