// import React, { lazy, Suspense, useState, useEffect } from "react";
// import { Loader } from "@react-three/drei";

// // Lazy imports for each 3D scene (each includes its own Canvas)
// const Shadow = lazy(
//   () => import("./kuch_to_banega/bouncing_ball_shadow/shadow"),
// );
// const Particles = lazy(
//   () => import("./kuch_to_banega/floating_bubbles/particles"),
// );
// const CanvasWrapper = lazy(() => import("./kuch_to_banega/morphing/morphing"));
// const ThreeCanvas = lazy(() => import("./kuch_to_banega/intro/3dtext"));
// const WaterScene = lazy(() => import("./kuch_to_banega/raging_sea/raging_sea"));
// const Cofee = lazy(() => import("./kuch_to_banega/buy me a coffee/coffee"));
// const TerrainCanvas = lazy(() => import("./kuch_to_banega/terrain/terrain"));
// const PhysicsGame = lazy(() => import("./kuch_to_banega/game/canvas"));
// const RapierPhysics = lazy(
//   () => import("./kuch_to_banega/rapier/RapierPhysics"),
// );
// const modelNames = [
//   "3D Text Intro",
//   "Buy Me A Coffee",
//   "Terrain",
//   "Morphing Particles",
//   "Raging Sea",
//   "Floating Bubbles",
//   "Bouncing Ball Shadow",
//   "Physics Game",
//   "Rapier Physics",
// ] as const;

// type ModelName = (typeof modelNames)[number];

// const models: Record<
//   ModelName,
//   React.LazyExoticComponent<React.ComponentType<any>>
// > = {
//   "3D Text Intro": ThreeCanvas,
//   "Buy Me A Coffee": Cofee,
//   Terrain: TerrainCanvas,
//   "Morphing Particles": CanvasWrapper,
//   "Raging Sea": WaterScene,
//   "Floating Bubbles": Particles,
//   "Bouncing Ball Shadow": Shadow,
//   "Physics Game": PhysicsGame,
//   "Rapier Physics": RapierPhysics,
// };

// export default function App() {
//   const [model, setModel] = useState<{ name: ModelName; key: string } | null>(
//     null,
//   );
//   const [isTransitioning, setIsTransitioning] = useState(false);
//   const [isAppReady, setIsAppReady] = useState(false);

//   useEffect(() => {
//     // Add a small delay to trigger entrance animation
//     const timer = setTimeout(() => {
//       setIsAppReady(true);
//     }, 100);

//     return () => clearTimeout(timer);
//   }, []);

//   const handleModelChange = (modelName: ModelName | null) => {
//     // Prevent changing models while a transition is in progress
//     if (isTransitioning) {
//       return;
//     }

//     // If we are just going back to the menu
//     if (!modelName) {
//       setModel(null);
//       return;
//     }

//     // Start the transition process
//     setIsTransitioning(true);

//     // 1. Unmount the current component by setting the model to null.
//     //    This triggers the useEffect cleanup functions in the active scene.
//     setModel(null);

//     // 2. Wait for a moment to allow for GPU memory and other resources
//     //    to be fully released by the unmounted component.
//     setTimeout(() => {
//       // 3. Mount the new component with a unique key to ensure it's a fresh instance.
//       setModel({ name: modelName, key: `scene-${Date.now()}` });
//       setIsTransitioning(false);
//     }, 200); // A slightly longer delay for safer cleanup
//   };

//   const ModelComponent = model ? models[model.name] : null;

//   return (
//     <div
//       className={`relative w-full h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white flex flex-col items-center justify-center overflow-hidden transition-opacity duration-1000 ${isAppReady ? "opacity-100" : "opacity-0"}`}
//     >
//       {/* Animated floating particles background */}
//       <div className="absolute inset-0 z-0 pointer-events-none select-none animate-gradient-move">
//         <svg
//           width="100%"
//           height="100%"
//           className="absolute inset-0"
//           style={{ filter: "blur(2px)" }}
//         >
//           <defs>
//             <radialGradient id="g1" cx="70%" cy="20%" r="80%">
//               <stop offset="0%" stopColor="#6366f1" stopOpacity="0.12" />
//               <stop offset="100%" stopColor="transparent" />
//             </radialGradient>
//             <radialGradient id="g2" cx="20%" cy="80%" r="80%">
//               <stop offset="0%" stopColor="#ec4899" stopOpacity="0.12" />
//               <stop offset="100%" stopColor="transparent" />
//             </radialGradient>
//           </defs>
//           <rect width="100%" height="100%" fill="url(#g1)" />
//           <rect width="100%" height="100%" fill="url(#g2)" />
//         </svg>
//       </div>
//       {/* Glassmorphism card and content */}
//       {!model ? (
//         <div className="w-full max-w-3xl px-8 py-12 rounded-3xl bg-black/60 backdrop-blur-2xl border border-gray-800 shadow-2xl relative z-10 animate-fade-in">
//           <h1 className="text-5xl md:text-6xl font-extrabold mb-3 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 drop-shadow-lg tracking-tight">
//             3D Experience Gallery
//           </h1>
//           <p className="text-gray-200 text-center mb-10 text-xl font-medium">
//             Select a scene to explore
//           </p>
//           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
//             {modelNames.map((name) => (
//               <button
//                 key={name}
//                 className="relative px-7 py-4 rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 text-white font-semibold shadow-xl hover:from-blue-600 hover:to-purple-600 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-opacity-60 transition-all duration-300 overflow-hidden group disabled:opacity-50 border border-gray-700/60"
//                 onClick={() => handleModelChange(name)}
//                 disabled={isTransitioning}
//               >
//                 <span className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></span>
//                 <span className="relative z-10 text-lg tracking-wide drop-shadow">
//                   {name}
//                 </span>
//               </button>
//             ))}
//           </div>
//         </div>
//       ) : (
//         <>
//           <button
//             className="absolute top-8 left-8 z-50 px-5 py-2.5 rounded-full bg-gray-800/80 hover:bg-gray-700 backdrop-blur-md border border-gray-700/50 text-white font-semibold transition-all duration-300 hover:scale-105 shadow-xl disabled:opacity-50 flex items-center gap-2 text-lg"
//             onClick={() => handleModelChange(null)}
//             disabled={isTransitioning}
//           >
//             <svg
//               xmlns="http://www.w3.org/2000/svg"
//               className="h-6 w-6"
//               viewBox="0 0 20 20"
//               fill="currentColor"
//             >
//               <path
//                 fillRule="evenodd"
//                 d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
//                 clipRule="evenodd"
//               />
//             </svg>
//             Back
//           </button>
//           <div
//             key={model.key}
//             className="w-full h-[80vh] animate-fade-in rounded-2xl shadow-2xl border border-gray-800/60 bg-black/40 backdrop-blur-xl mt-4"
//           >
//             <Suspense
//               fallback={
//                 <div className="flex flex-col items-center justify-center w-full h-full">
//                   <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6 shadow-xl"></div>
//                   <p className="text-2xl text-blue-400 font-semibold tracking-wide drop-shadow">
//                     Loading 3D Scene...
//                   </p>
//                 </div>
//               }
//             >
//               {ModelComponent && <ModelComponent />}
//             </Suspense>
//           </div>
//         </>
//       )}
//       <Loader
//         containerStyles={{
//           background: "transparent",
//           position: "absolute",
//           bottom: 24,
//           left: 0,
//           right: 0,
//           margin: "auto",
//           zIndex: 30,
//           width: "320px",
//           maxWidth: "90vw",
//         }}
//         barStyles={{
//           height: "12px",
//           borderRadius: "8px",
//           background:
//             "linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)",
//           boxShadow: "0 2px 16px 0 #8b5cf655",
//         }}
//       />
//     </div>
//   );
// }
import CanvasWrapper from "./kuch_to_banega/morphing/morphing";
export default function App() {
  return (
    <div className="w-full h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white flex items-center justify-center">
      <CanvasWrapper />
    </div>
  );
}