import * as THREE from 'three';
import { CameraState } from './store';

let worker: Worker | null = null;
let isWorkerReady = false;
let messageIdCounter = 0;

export function initWorker() {
  if (!worker) {
    worker = new Worker(new URL('./workers/opencv.worker.ts', import.meta.url));
    
    worker.onmessage = (e) => {
      if (e.data.type === 'INIT_DONE') {
        isWorkerReady = true;
        console.log('OpenCV Worker is ready');
      }
    };
    
    worker.postMessage({ type: 'INIT' });
  }
}

export function calculateExtrinsics(cameras: Record<string, CameraState>): Promise<Record<string, any>> {
  return new Promise((resolve, reject) => {
    if (!worker || !isWorkerReady) {
      reject(new Error('Worker not ready'));
      return;
    }
    
    const id = messageIdCounter++;
    
    const listener = (e: MessageEvent) => {
      if (e.data.id === id) {
        worker?.removeEventListener('message', listener);
        if (e.data.type === 'CALCULATION_DONE') {
          resolve(e.data.payload);
        } else if (e.data.type === 'ERROR') {
          reject(new Error(e.data.error));
        }
      }
    };
    
    worker.addEventListener('message', listener);
    
    // Prepare data for worker
    const payloadCameras: Record<string, any> = {};
    for (const [camId, cam] of Object.entries(cameras)) {
      // Calculate 3x3 rotation matrix from Euler angles
      const euler = new THREE.Euler(cam.rotation[0], cam.rotation[1], cam.rotation[2], 'XYZ');
      const matrix = new THREE.Matrix4().makeRotationFromEuler(euler);
      
      // Extract 3x3 rotation matrix (row-major)
      const e = matrix.elements; // column-major
      const rotationMatrix = [
        e[0], e[4], e[8],
        e[1], e[5], e[9],
        e[2], e[6], e[10]
      ];
      
      payloadCameras[camId] = {
        position: cam.position,
        rotationMatrix
      };
    }
    
    worker.postMessage({
      type: 'CALCULATE_EXTRINSICS',
      id,
      payload: { cameras: payloadCameras }
    });
  });
}
