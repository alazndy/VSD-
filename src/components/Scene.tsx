import { useRef } from 'react';
import { View, OrbitControls, Environment, GizmoHelper, GizmoViewport, PerspectiveCamera } from '@react-three/drei';
import { Suspense } from 'react';
import VehicleModel from './VehicleModel';
import DraggableCamera from './DraggableCamera';
import DraggableSensor from './DraggableSensor';
import CalibrationMats from './CalibrationMats';
import BlendingMap from './BlendingMap';
import GroundLabels from './GroundLabels';
import { useStore } from '../store';

export default function Scene() {
  const cameras = useStore((state) => state.cameras);
  const sensors = useStore((state) => state.sensors);
  const has360System = useStore((state) => state.has360System);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="w-full h-full absolute inset-0">
      <View track={containerRef} className="w-full h-full">
        <PerspectiveCamera makeDefault position={[10, 10, 10]} fov={50} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        <Suspense fallback={null}>
          <VehicleModel />
          <GroundLabels />
        </Suspense>

        {Object.values(cameras).map((cam) => (
          <DraggableCamera key={cam.id} id={cam.id} />
        ))}

        {Object.values(sensors).map((sensor) => (
          <DraggableSensor key={sensor.id} id={sensor.id} />
        ))}

        {has360System && (
          <>
            <CalibrationMats />
            <BlendingMap />
          </>
        )}

        <OrbitControls makeDefault />
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport axisColors={['#F27D26', '#00FF41', '#3b82f6']} labelColor="white" />
        </GizmoHelper>
      </View>
    </div>
  );
}
