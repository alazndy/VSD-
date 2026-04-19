import { useRef, useState, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { useDrag } from '@use-gesture/react';
import { TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';

function createRadarGeometry(range: number, widthH: number, widthV: number, maxW: number | null) {
  const geom = new THREE.BufferGeometry();
  const vertices = [];
  const indices = [];
  const segments = 64;
  const halfH = widthH / 2;
  const halfV = widthV / 2;
  const wLimit = maxW ? maxW / 2 : Infinity;

  vertices.push(0, 0, 0);

  for (let i = 0; i <= segments; i++) {
    const theta = -halfH + (i / segments) * (halfH * 2);
    let r = range;

    if (wLimit !== Infinity && Math.abs(Math.sin(theta)) > 0.001) {
      const rLimit = Math.abs(wLimit / Math.sin(theta));
      r = Math.min(r, rLimit);
    }

    const x = r * Math.sin(theta);
    const z = r * Math.cos(theta);
    const d = Math.sqrt(x*x + z*z);
    const y = d * Math.tan(halfV);

    vertices.push(x, y, z);
    vertices.push(x, -y, z);
  }

  for (let i = 0; i < segments; i++) {
     const top1 = 1 + i * 2;
     const bot1 = 2 + i * 2;
     const top2 = 1 + (i + 1) * 2;
     const bot2 = 2 + (i + 1) * 2;

     indices.push(0, top2, top1);
     indices.push(0, bot1, bot2);
     indices.push(top1, bot1, top2);
     indices.push(top2, bot1, bot2);

     if (i === 0) indices.push(0, top1, bot1);
     if (i === segments - 1) indices.push(0, bot2, top2);
  }

  geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

export default function DraggableSensor({ id }: { id: string }) {
  const sensorState = useStore((state) => state.sensors[id]);
  const updateSensor = useStore((state) => state.updateSensor);
  const setSelectedObjectId = useStore((state) => state.setSelectedObjectId);
  const selectedObjectId = useStore((state) => state.selectedObjectId);
  const gizmoMode = useStore((state) => state.gizmoMode);
  
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera, size, raycaster, scene } = useThree();
  const [isDragging, setIsDragging] = useState(false);

  const bind = useDrag(({ active, movement: [mx, my], xy: [x, y], event }) => {
    event.stopPropagation();
    setIsDragging(active);
    setSelectedObjectId(id);

    if (active) {
      const ndc = new THREE.Vector2(
        (x / size.width) * 2 - 1,
        -(y / size.height) * 2 + 1
      );

      raycaster.setFromCamera(ndc, camera);
      
      const vehicle = scene.getObjectByName('vehicle');
      if (vehicle) {
        const intersects = raycaster.intersectObject(vehicle, true);
        if (intersects.length > 0) {
          const hit = intersects[0];
          const point = hit.point;
          const normal = hit.face?.normal?.clone() || new THREE.Vector3(0, 1, 0);
          
          if (hit.object.matrixWorld) {
            normal.transformDirection(hit.object.matrixWorld);
          }

          const offsetPoint = point.clone().add(normal.clone().multiplyScalar(0.05));
          
          const forward = normal.clone().normalize();
          const dummy = new THREE.Object3D();
          dummy.position.copy(offsetPoint);
          dummy.lookAt(offsetPoint.clone().add(forward));
          
          updateSensor(id, {
            position: [offsetPoint.x, offsetPoint.y, offsetPoint.z],
            rotation: [dummy.rotation.x, dummy.rotation.y, dummy.rotation.z]
          });
        }
      }
    }
  });

  const isSelected = selectedObjectId === id;

  let snappedDistance = sensorState.detectedDistance !== null 
    ? Math.round(sensorState.detectedDistance / sensorState.resolution) * sensorState.resolution 
    : null;

  if (snappedDistance !== null && snappedDistance < sensorState.minRange) {
    snappedDistance = sensorState.minRange;
  }

  const radarGeom = useMemo(() => {
    if (sensorState.type !== 'radar') return null;
    return createRadarGeometry(sensorState.range, sensorState.widthH, sensorState.widthV, sensorState.maxWidth);
  }, [sensorState.type, sensorState.range, sensorState.widthH, sensorState.widthV, sensorState.maxWidth]);

  const radarDetectedGeom = useMemo(() => {
    if (sensorState.type !== 'radar' || snappedDistance === null) return null;
    return createRadarGeometry(snappedDistance, sensorState.widthH, sensorState.widthV, sensorState.maxWidth);
  }, [sensorState.type, snappedDistance, sensorState.widthH, sensorState.widthV, sensorState.maxWidth]);

  const getGeometry = () => {
    if (sensorState.type === 'radar') {
      return <boxGeometry args={[0.3, 0.2, 0.1]} />;
    }
    return <cylinderGeometry args={[0.1, 0.1, 0.2, 16]} />;
  };

  const getColor = () => {
    if (!sensorState.isActive) return '#333333';
    if (sensorState.type === 'radar') return isSelected ? '#3b82f6' : '#60a5fa';
    return isSelected ? '#f59e0b' : '#fbbf24';
  };

  return (
    <group>
      <group
        position={sensorState.position}
        rotation={sensorState.rotation}
      >
        <mesh
          ref={meshRef}
          rotation={sensorState.type === 'ultrasonic' ? [Math.PI / 2, 0, 0] : [0, 0, 0]}
          {...(bind as any)()}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedObjectId(id);
          }}
        >
          {sensorState.type === 'radar' ? (
             <boxGeometry args={[0.3, 0.2, 0.1]} />
          ) : (
             <cylinderGeometry args={[0.1, 0.1, 0.2, 16]} />
          )}
          <meshStandardMaterial color={getColor()} emissive={getColor()} emissiveIntensity={0.5} />
          
          {/* Label Plane */}
          {isSelected && (
            <mesh position={[0, 0.3, 0]}>
              <planeGeometry args={[0.6, 0.15]} />
              <meshBasicMaterial color="#000000" transparent opacity={0.5} side={THREE.DoubleSide} />
            </mesh>
          )}
        </mesh>

        {/* Visibility/Range Cone */}
        {isSelected && sensorState.isActive && (
          <group>
            {/* ULTRASONIC VISUALIZATION */}
            {sensorState.type === 'ultrasonic' && (
              <group>
                <mesh 
                  position={[0, 0, sensorState.range / 2]} 
                  rotation={[-Math.PI / 2, 0, 0]}
                  scale={[
                    sensorState.range * Math.tan(sensorState.widthH / 2),
                    1,
                    sensorState.range * Math.tan(sensorState.widthV / 2)
                  ]}
                >
                  <coneGeometry args={[1, sensorState.range, 32, 1, true]} />
                  <meshBasicMaterial 
                    color={getColor()} 
                    transparent 
                    opacity={0.05} 
                    side={THREE.DoubleSide} 
                    depthWrite={false}
                  />
                </mesh>

                {/* Resolution markers */}
                {Array.from({ length: Math.floor(sensorState.range / (sensorState.resolution * 5)) }).map((_, i) => {
                   const dist = (i + 1) * sensorState.resolution * 5;
                   const radX = dist * Math.tan(sensorState.widthH / 2);
                   const radY = dist * Math.tan(sensorState.widthV / 2);
                   return (
                     <mesh key={i} position={[0, 0, dist]} scale={[radX, radY, 1]}>
                       <ringGeometry args={[0.98, 1, 32]} />
                       <meshBasicMaterial color={getColor()} transparent opacity={0.2} side={THREE.DoubleSide} />
                     </mesh>
                   );
                })}

                {/* Min Range Indicator */}
                {sensorState.minRange > 0 && (
                  <mesh position={[0, 0, sensorState.minRange]} scale={[sensorState.minRange * Math.tan(sensorState.widthH / 2), sensorState.minRange * Math.tan(sensorState.widthV / 2), 1]}>
                     <ringGeometry args={[0, 1, 32]} />
                     <meshBasicMaterial color="#333333" transparent opacity={0.3} side={THREE.DoubleSide} />
                  </mesh>
                )}

                {/* Detected Object Indicator */}
                {snappedDistance !== null && (
                   <mesh position={[0, 0, snappedDistance]} scale={[snappedDistance * Math.tan(sensorState.widthH / 2), snappedDistance * Math.tan(sensorState.widthV / 2), 1]}>
                     <ringGeometry args={[0, 1, 32]} />
                     <meshBasicMaterial color="#ef4444" transparent opacity={0.4} side={THREE.DoubleSide} />
                   </mesh>
                )}
              </group>
            )}

            {/* RADAR VISUALIZATION */}
            {sensorState.type === 'radar' && radarGeom && (
              <group>
                <mesh geometry={radarGeom}>
                  <meshBasicMaterial color={getColor()} transparent opacity={0.15} side={THREE.DoubleSide} depthWrite={false} />
                </mesh>
                <lineSegments>
                  <edgesGeometry args={[radarGeom]} />
                  <lineBasicMaterial color={getColor()} transparent opacity={0.25} />
                </lineSegments>

                {/* Detected Object Indicator */}
                {radarDetectedGeom && (
                  <mesh geometry={radarDetectedGeom}>
                     <meshBasicMaterial color="#ef4444" transparent opacity={0.6} side={THREE.DoubleSide} depthWrite={false} />
                  </mesh>
                )}
              </group>
            )}
          </group>
        )}
      </group>

      {isSelected && (
        <TransformControls 
          object={meshRef} 
          mode={gizmoMode} 
          size={0.6}
          onMouseDown={() => {
            useStore.getState().saveSnapshot();
          }}
          onMouseUp={() => {
            if (meshRef.current) {
              const worldPos = new THREE.Vector3();
              meshRef.current.getWorldPosition(worldPos);
              const worldRot = new THREE.Euler();
              worldRot.setFromRotationMatrix(new THREE.Matrix4().extractRotation(meshRef.current.matrixWorld));
              
              updateSensor(id, {
                position: [worldPos.x, worldPos.y, worldPos.z],
                rotation: [worldRot.x, worldRot.y, worldRot.z]
              });
            }
          }}
        />
      )}
    </group>
  );
}
