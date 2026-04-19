import { useEffect, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

// A simple global state for the uploaded file URL and type just for the prototype
export let uploadedModelUrl: string | null = null;
export let uploadedModelType: 'stl' | 'obj' | 'fbx' | null = null;
export const setUploadedModel = (url: string, type: 'stl' | 'obj' | 'fbx') => {
  uploadedModelUrl = url;
  uploadedModelType = type;
  // trigger re-render
  window.dispatchEvent(new Event('model-uploaded'));
};

export default function VehicleModel() {
  const [model, setModel] = useState<THREE.Group | null>(null);
  const setVehicleSize = useStore((state) => state.setVehicleSize);
  const modelScale = useStore((state) => state.modelScale);
  const modelRotation = useStore((state) => state.modelRotation);
  const { scene } = useThree();

  useEffect(() => {
    const handleUpload = () => {
      if (!uploadedModelUrl || !uploadedModelType) return;

      const loadModel = async () => {
        try {
          let object: THREE.Object3D;
          if (uploadedModelType === 'stl') {
            const loader = new STLLoader();
            const geometry = await loader.loadAsync(uploadedModelUrl!);
            const material = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.5, roughness: 0.5 });
            object = new THREE.Mesh(geometry, material);
          } else if (uploadedModelType === 'obj') {
            const loader = new OBJLoader();
            object = await loader.loadAsync(uploadedModelUrl!);
          } else {
            const loader = new FBXLoader();
            object = await loader.loadAsync(uploadedModelUrl!);
          }

          // Calculate initial bounding box
          const box = new THREE.Box3().setFromObject(object);
          const center = box.getCenter(new THREE.Vector3());
          
          // Offset the raw model so its origin is at bottom-center (0, 0, 0)
          object.position.set(-center.x, -box.min.y, -center.z);
          
          const wrapper = new THREE.Group();
          wrapper.add(object);

          // Reset scale and rotation on new upload
          const store = useStore.getState();
          store.setModelScale([1, 1, 1]);
          store.setModelRotation([0, 0, 0]);
          setModel(wrapper);
        } catch (error) {
          console.error("Model loading failed:", error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes("FileVersion") || errorMessage.includes("FBX version not supported")) {
            alert(`Sistem Hatası: Yüklediğiniz FBX formatı çok eski veya desteklenmiyor (${errorMessage}). Lütfen dosyayı FBX 2013 (Binary veya ASCII 7100+) ve üzeri bir sürüme dönüştürüp tekrar deneyin.`);
          } else {
            alert(`Model yüklenirken bir hata oluştu: ${errorMessage}`);
          }
        }
      };

      loadModel();
    };

    window.addEventListener('model-uploaded', handleUpload);
    return () => window.removeEventListener('model-uploaded', handleUpload);
  }, []);

  // Sync scale dynamically and measure real dimensions
  useEffect(() => {
    if (!model) {
      // Scale default placeholder box directly relative to modelScale
      setVehicleSize({ width: 2 * modelScale[0], height: 2 * modelScale[1], length: 5 * modelScale[2] });
      return;
    }

    model.scale.set(modelScale[0], modelScale[1], modelScale[2]);
    model.rotation.set(
      modelRotation[0] * Math.PI / 180,
      modelRotation[1] * Math.PI / 180,
      modelRotation[2] * Math.PI / 180
    );
    model.updateMatrixWorld(true);
    
    // Calculate new bounding box taking both scale and rotation into account
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    
    setVehicleSize({ width: size.x, height: size.y, length: size.z });
  }, [model, modelScale, modelRotation, setVehicleSize]);

  if (!model) {
    // Default placeholder vehicle (a generic delivery truck)
    return (
      <group
        name="vehicle" 
        position={[0, 1 * modelScale[1], 0]} 
        scale={modelScale as unknown as [number, number, number]}
        rotation={[
          modelRotation[0] * Math.PI / 180,
          modelRotation[1] * Math.PI / 180,
          modelRotation[2] * Math.PI / 180
        ]}
      >
        {/* Chassis / Underbody */}
        <mesh position={[0, -0.4, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.9, 0.4, 5.0]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        
        {/* Cargo Box */}
        <mesh position={[0, 0.4, 0.5]} castShadow receiveShadow>
          <boxGeometry args={[2.0, 1.2, 4.0]} />
          <meshStandardMaterial color="#f1f5f9" />
        </mesh>
        
        {/* Cabin */}
        <mesh position={[0, 0.1, -2.0]} castShadow receiveShadow>
          <boxGeometry args={[2.0, 0.6, 1.0]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>

        {/* Windshield */}
        <mesh position={[0, 0.2, -2.51]} castShadow receiveShadow>
          <planeGeometry args={[1.8, 0.4]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        
        {/* Side Windows for cabin */}
        <mesh position={[-1.01, 0.2, -2.0]} rotation={[0, -Math.PI / 2, 0]} castShadow receiveShadow>
          <planeGeometry args={[0.8, 0.4]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <mesh position={[1.01, 0.2, -2.0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
          <planeGeometry args={[0.8, 0.4]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>

        {/* Wheels */}
        {[[-1.0, 1.5], [1.0, 1.5], [-1.0, -1.5], [1.0, -1.5]].map(([x, z], i) => (
          <mesh key={`wheel-${i}`} position={[x, -0.6, z]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
            <cylinderGeometry args={[0.4, 0.4, 0.3, 24]} />
            <meshStandardMaterial color="#020617" />
          </mesh>
        ))}
        
        {/* Headlights */}
        <mesh position={[-0.7, -0.3, -2.51]} castShadow>
          <boxGeometry args={[0.4, 0.15, 0.05]} />
          <meshStandardMaterial color="#fef08a" emissive="#facc15" emissiveIntensity={0.5}/>
        </mesh>
        <mesh position={[0.7, -0.3, -2.51]} castShadow>
          <boxGeometry args={[0.4, 0.15, 0.05]} />
          <meshStandardMaterial color="#fef08a" emissive="#facc15" emissiveIntensity={0.5}/>
        </mesh>
        
        {/* Taillights */}
        <mesh position={[-0.8, -0.3, 2.51]} castShadow>
          <boxGeometry args={[0.2, 0.3, 0.05]} />
          <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={0.8}/>
        </mesh>
        <mesh position={[0.8, -0.3, 2.51]} castShadow>
          <boxGeometry args={[0.2, 0.3, 0.05]} />
          <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={0.8}/>
        </mesh>
      </group>
    );
  }

  return <primitive object={model} name="vehicle" />;
}
