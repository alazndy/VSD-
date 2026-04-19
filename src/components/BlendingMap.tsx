import { useRef, useMemo } from 'react';
import { useStore } from '../store';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

const BlendingShaderMaterial = {
  uniforms: {
    camPos0: { value: new THREE.Vector3() },
    camDir0: { value: new THREE.Vector3() },
    camFov0: { value: 0 },
    
    camPos1: { value: new THREE.Vector3() },
    camDir1: { value: new THREE.Vector3() },
    camFov1: { value: 0 },
    
    camPos2: { value: new THREE.Vector3() },
    camDir2: { value: new THREE.Vector3() },
    camFov2: { value: 0 },
    
    camPos3: { value: new THREE.Vector3() },
    camDir3: { value: new THREE.Vector3() },
    camFov3: { value: 0 },
  },
  vertexShader: `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  fragmentShader: `
    varying vec3 vWorldPosition;
    
    uniform vec3 camPos0; uniform vec3 camDir0; uniform float camFov0;
    uniform vec3 camPos1; uniform vec3 camDir1; uniform float camFov1;
    uniform vec3 camPos2; uniform vec3 camDir2; uniform float camFov2;
    uniform vec3 camPos3; uniform vec3 camDir3; uniform float camFov3;

    int checkVisibility(vec3 pos, vec3 dir, float fov, vec3 target) {
      vec3 diff = target - pos;
      if (length(diff) < 0.001) return 1;
      vec3 toTarget = normalize(diff);
      float angle = acos(clamp(dot(dir, toTarget), -1.0, 1.0));
      // Convert FOV to radians and divide by 2 for half-angle
      if (angle < (fov * 3.14159 / 180.0) / 2.0) {
        return 1;
      }
      return 0;
    }

    void main() {
      int visibleCount = 0;
      
      visibleCount += checkVisibility(camPos0, camDir0, camFov0, vWorldPosition);
      visibleCount += checkVisibility(camPos1, camDir1, camFov1, vWorldPosition);
      visibleCount += checkVisibility(camPos2, camDir2, camFov2, vWorldPosition);
      visibleCount += checkVisibility(camPos3, camDir3, camFov3, vWorldPosition);
      
      vec3 color = vec3(0.0);
      float alpha = 0.3; // Base opacity
      
      if (visibleCount == 0) {
        color = vec3(1.0, 0.0, 0.0); // Red (Blind spot)
      } else if (visibleCount == 1) {
        color = vec3(1.0, 1.0, 0.0); // Yellow (Single camera)
      } else {
        color = vec3(0.0, 1.0, 0.0); // Green (Overlap/Blending)
      }
      
      // Add grid lines
      vec2 grid = fract(vWorldPosition.xz);
      if (grid.x < 0.02 || grid.y < 0.02) {
        color = mix(color, vec3(1.0), 0.5);
      }
      
      // Fade out at edges
      float dist = length(vWorldPosition.xz);
      alpha *= smoothstep(20.0, 10.0, dist);
      
      gl_FragColor = vec4(color, alpha);
    }
  `
};

export default function BlendingMap() {
  const cameras = useStore((state) => state.cameras);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useFrame(() => {
    if (!materialRef.current) return;
    
    const camArray = Object.values(cameras);
    for (let i = 0; i < 4; i++) {
      if (camArray[i]) {
        const cam = camArray[i];
        const pos = new THREE.Vector3(...cam.position);
        const euler = new THREE.Euler(...cam.rotation);
        const dir = new THREE.Vector3(0, 0, -1).applyEuler(euler); // Camera looks down -Z locally
        
        materialRef.current.uniforms[`camPos${i}`].value.copy(pos);
        materialRef.current.uniforms[`camDir${i}`].value.copy(dir);
        materialRef.current.uniforms[`camFov${i}`].value = cam.fovH;
      }
    }
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
      <planeGeometry args={[40, 40]} />
      <shaderMaterial 
        ref={materialRef}
        args={[BlendingShaderMaterial]} 
        transparent 
        depthWrite={false}
      />
    </mesh>
  );
}
