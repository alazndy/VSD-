import { Text } from '@react-three/drei';

export default function GroundLabels() {
  return (
    <group>
      {/* FRONT */}
      <Text
        position={[0, 0.01, -6]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={1}
        color="#E1E1E6"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.3}
      >
        FRONT / ÖN
      </Text>
      
      {/* REAR */}
      <Text
        position={[0, 0.01, 6]}
        rotation={[-Math.PI / 2, 0, Math.PI]}
        fontSize={1}
        color="#E1E1E6"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.3}
      >
        REAR / ARKA
      </Text>
      
      {/* LEFT */}
      <Text
        position={[-6, 0.01, 0]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        fontSize={1}
        color="#E1E1E6"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.3}
      >
        LEFT / SOL
      </Text>
      
      {/* RIGHT */}
      <Text
        position={[6, 0.01, 0]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        fontSize={1}
        color="#E1E1E6"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.3}
      >
        RIGHT / SAĞ
      </Text>
    </group>
  );
}
