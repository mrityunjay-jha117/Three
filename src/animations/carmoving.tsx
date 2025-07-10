import AnimatedModel from "../components/animated_model";
import PortfolioSection from "../components/canvas_setter";

export default function Try() {
  return (
    <div className="relative w-full h-full z-10">
      <div className="h-screen  leading-relaxed  z-20 text-white font-black text-9xl flex justify-center items-center">
        Hold 'W'
      </div>
      <div className="absolute top-0 left-0 right-0 w-full h-full z-10">
        <PortfolioSection
          Scene={
            <AnimatedModel
              gltfPath="/tukmon.glb"
              // gltfPath="/explicit.glb"
            />
          }
        />
      </div>
    </div>
  );
}
