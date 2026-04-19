import { useStore } from '../store';
import * as THREE from 'three';

export default function CalibrationMats() {
  const mats = useStore((state) => state.mats);

  return (
    <group>
      {Object.values(mats).map((mat) => (
        <group key={mat.id} position={mat.position} rotation={[-Math.PI / 2, 0, 0]}>
          {/* Outer white square */}
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[1.2, 1.2]} />
            <meshBasicMaterial color="#FFFFFF" side={THREE.DoubleSide} />
          </mesh>
          {/* Inner black square */}
          <mesh position={[0, 0, 0.01]}>
            <planeGeometry args={[0.6, 0.6]} />
            <meshBasicMaterial color="#000000" side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
