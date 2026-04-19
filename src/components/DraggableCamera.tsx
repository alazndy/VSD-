import { useRef, useState, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useDrag } from '@use-gesture/react';
import { TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';

export default function DraggableCamera({ id }: { id: string }) {
  const cameraState = useStore((state) => state.cameras[id]);
  const updateCamera = useStore((state) => state.updateCamera);
  const setSelectedObjectId = useStore((state) => state.setSelectedObjectId);
  const selectedObjectId = useStore((state) => state.selectedObjectId);
  const gizmoMode = useStore((state) => state.gizmoMode);
  
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera, size, raycaster, scene } = useThree();
  const [isDragging, setIsDragging] = useState(false);

  // Check for FOV blockage
  useEffect(() => {
    if (!meshRef.current) return;
    
    const vehicle = scene.getObjectByName('vehicle');
    if (!vehicle) return;

    // Create a raycaster from the camera's position pointing forward (-Z)
    const forward = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(...cameraState.rotation));
    const camRaycaster = new THREE.Raycaster(new THREE.Vector3(...cameraState.position), forward);
    
    const intersects = camRaycaster.intersectObject(vehicle, true);
    
    // If it hits the vehicle within a short distance, it's blocked
    const isBlocked = intersects.length > 0 && intersects[0].distance < 2.0;
    
    if (cameraState.blocked !== isBlocked) {
      updateCamera(id, { blocked: isBlocked });
    }
  }, [cameraState.position, cameraState.rotation, scene, id, updateCamera, cameraState.blocked]);

  const bind = useDrag(({ active, movement: [mx, my], xy: [x, y], event }) => {
    event.stopPropagation();
    setIsDragging(active);
    setSelectedObjectId(id);

    if (active) {
      // Convert mouse coordinates to normalized device coordinates
      const ndc = new THREE.Vector2(
        (x / size.width) * 2 - 1,
        -(y / size.height) * 2 + 1
      );

      raycaster.setFromCamera(ndc, camera);
      
      // Find intersections with the vehicle
      const vehicle = scene.getObjectByName('vehicle');
      if (vehicle) {
        const intersects = raycaster.intersectObject(vehicle, true);
        if (intersects.length > 0) {
          const hit = intersects[0];
          const point = hit.point;
          const normal = hit.face?.normal?.clone() || new THREE.Vector3(0, 1, 0);
          
          // Transform normal to world space if needed
          if (hit.object.matrixWorld) {
            normal.transformDirection(hit.object.matrixWorld);
          }

          // Offset slightly from the surface
          const offsetPoint = point.clone().add(normal.clone().multiplyScalar(0.1));
          
          // Calculate rotation to look outwards and pitched down
          const forward = normal.clone().normalize();
          const pitchDownRads = Math.PI / 3; // 60 degrees down
          
          const horizontalForward = new THREE.Vector3(forward.x, 0, forward.z).normalize();
          // Fallback if normal is straight up/down
          if (horizontalForward.lengthSq() < 0.001) {
             horizontalForward.copy(forward);
          }
          
          const yOffset = -Math.sin(pitchDownRads);
          const xzLen = Math.cos(pitchDownRads);
          
          const target = offsetPoint.clone().add(new THREE.Vector3(
            horizontalForward.x * xzLen, 
            yOffset, 
            horizontalForward.z * xzLen
          ));
          
          // We need a temporary object to calculate the Euler angles
          const dummy = new THREE.PerspectiveCamera();
          dummy.position.copy(offsetPoint);
          dummy.lookAt(target);
          
          updateCamera(id, {
            position: [offsetPoint.x, offsetPoint.y, offsetPoint.z],
            rotation: [dummy.rotation.x, dummy.rotation.y, dummy.rotation.z]
          });
        }
      }
    }
  });

  const isSelected = selectedObjectId === id;

  return (
    <group>
      <mesh
        ref={meshRef}
        position={cameraState.position}
        rotation={cameraState.rotation}
        {...(bind as any)()}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedObjectId(id);
        }}
      >
        <boxGeometry args={[0.3, 0.3, 0.4]} />
        <meshStandardMaterial color={isSelected ? '#00FF41' : '#F27D26'} emissive={isSelected ? '#00FF41' : '#F27D26'} emissiveIntensity={0.5} />
        {/* Lens indicator */}
        <mesh position={[0, 0, -0.22]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.05, 16]} />
          <meshStandardMaterial color="#0F0F11" />
        </mesh>
        
        {/* FOV Cone */}
        {isSelected && (() => {
          // Cap FOV at 175 degrees for standard 3D rendering preventing extreme stretching
          const safeFovV = Math.min(cameraState.fovV, 175) * Math.PI / 180;
          const safeFovH = Math.min(cameraState.fovH, 175) * Math.PI / 180;
          
          const radiusV = 5 * Math.tan(safeFovV / 2);
          const radiusH = 5 * Math.tan(safeFovH / 2);
          
          return (
            <mesh 
              position={[0, 0, -2.5]} 
              rotation={[Math.PI / 2, 0, 0]}
              scale={[radiusH / radiusV, 1, 1]}
            >
              <coneGeometry args={[radiusV, 5, 32, 1, true]} />
              <meshBasicMaterial 
                color={cameraState.blocked ? '#ef4444' : '#00FF41'} 
                transparent 
                opacity={0.15} 
                side={THREE.DoubleSide} 
                depthWrite={false}
              />
            </mesh>
          );
        })()}
        
        {/* Blocked Warning */}
        {cameraState.blocked && (
          <mesh position={[0, 0.4, 0]}>
            <planeGeometry args={[0.8, 0.2]} />
            <meshBasicMaterial color="#ef4444" side={THREE.DoubleSide} />
          </mesh>
        )}
      </mesh>

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
              updateCamera(id, {
                position: [meshRef.current.position.x, meshRef.current.position.y, meshRef.current.position.z],
                rotation: [meshRef.current.rotation.x, meshRef.current.rotation.y, meshRef.current.rotation.z]
              });
            }
          }}
        />
      )}
    </group>
  );
}
