import React from "react";
import RapierPhysics from "./RapierPhysics";

const RapierDemo: React.FC = () => {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000" }}>
      <RapierPhysics />
    </div>
  );
};

export default RapierDemo;
