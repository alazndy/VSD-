import { create } from 'zustand';
import * as THREE from 'three';

export type SystemType = 'VBV-360-10000-AI' | 'BN360-300';
export type MonitorType = 'MON-7-3CH' | 'MON-10.4-4CH';
export type SensorType = 'ultrasonic' | 'radar';
export type GizmoMode = 'translate' | 'rotate';

export interface CameraState {
  id: string;
  name: string;
  position: [number, number, number];
  rotation: [number, number, number]; // Euler angles
  fovH: number;
  fovV: number;
  blocked: boolean;
}

export interface SensorState {
  id: string;
  name: string;
  type: SensorType;
  position: [number, number, number];
  rotation: [number, number, number];
  range: number;
  minRange: number;
  maxWidth: number | null; // e.g. 16 for capped width
  widthH: number; // horizontal beam width / angle
  widthV: number; // vertical beam width / angle
  resolution: number;
  odsEnabled: boolean;
  isActive: boolean;
  detectedDistance: number | null; // Simulated detection
}

export interface MatState {
  id: string;
  position: [number, number, number];
  visibleBy: string[];
}

export interface MonitorState {
  id: string;
  name: string;
  type: MonitorType;
  cameraIds: (string | null)[]; // Up to 3 or 4 channels
}

export type StoreSnapshot = {
  cameras: Record<string, CameraState>;
  monitors: Record<string, MonitorState>;
  sensors: Record<string, SensorState>;
  has360System: boolean;
  vehicleSize: { width: number; length: number; height: number };
  modelScale: [number, number, number];
  modelRotation: [number, number, number];
  systemType: SystemType;
  mats: Record<string, MatState>;
  wiringNodes?: any[];
  wiringEdges?: any[];
};

interface AppState {
  systemType: SystemType;
  setSystemType: (type: SystemType) => void;
  
  has360System: boolean;
  setHas360System: (has360: boolean) => void;

  vehicleSize: { width: number; length: number; height: number };
  setVehicleSize: (size: { width: number; length: number; height: number }) => void;
  
  modelScale: [number, number, number];
  setModelScale: (scale: [number, number, number]) => void;

  modelRotation: [number, number, number];
  setModelRotation: (rotation: [number, number, number]) => void;

  cameras: Record<string, CameraState>;
  addCamera: (camera: CameraState) => void;
  removeCamera: (id: string) => void;
  updateCamera: (id: string, updates: Partial<CameraState>) => void;
  
  monitors: Record<string, MonitorState>;
  addMonitor: (monitor: MonitorState) => void;
  removeMonitor: (id: string) => void;
  updateMonitor: (id: string, updates: Partial<MonitorState>) => void;

  sensors: Record<string, SensorState>;
  addSensor: (sensor: SensorState) => void;
  removeSensor: (id: string) => void;
  updateSensor: (id: string, updates: Partial<SensorState>) => void;

  selectedObjectId: string | null;
  setSelectedObjectId: (id: string | null) => void;

  gizmoMode: GizmoMode;
  setGizmoMode: (mode: GizmoMode) => void;

  mats: Record<string, MatState>;
  updateMats: (size: { width: number; length: number; height: number }) => void;

  wiringNodes: any[];
  wiringEdges: any[];
  updateWiring: (nodes: any[], edges: any[]) => void;

  // History functionality
  past: StoreSnapshot[];
  future: StoreSnapshot[];
  saveSnapshot: () => void;
  undo: () => void;
  redo: () => void;
}

function getCameraRotation(normalX: number, normalZ: number, pitchDownRads: number): [number, number, number] {
  const dummy = new THREE.PerspectiveCamera();
  dummy.position.set(0, 0, 0);
  
  // Calculate exact target point to look at
  const forward = new THREE.Vector3(normalX, 0, normalZ).normalize();
  const y = -Math.sin(pitchDownRads);
  const xzLen = Math.cos(pitchDownRads);
  
  const target = new THREE.Vector3(forward.x * xzLen, y, forward.z * xzLen);
  dummy.lookAt(target);
  
  return [dummy.rotation.x, dummy.rotation.y, dummy.rotation.z];
}

export const defaultCameras: Record<string, CameraState> = {
  // Assuming vehicle faces -Z:
  // Front is at -Z, looks at -Z. Rear is at +Z, looks at +Z.
  // Left is at -X, looks at -X. Right is at +X, looks at +X.
  front: { id: 'front', name: 'Front Camera', position: [0, 3, -4], rotation: getCameraRotation(0, -1, Math.PI / 3), fovH: 190, fovV: 130, blocked: false },
  rear: { id: 'rear', name: 'Rear Camera', position: [0, 3, 4], rotation: getCameraRotation(0, 1, Math.PI / 3), fovH: 190, fovV: 130, blocked: false },
  left: { id: 'left', name: 'Left Camera', position: [-2, 3, 0], rotation: getCameraRotation(-1, 0, Math.PI / 3), fovH: 190, fovV: 130, blocked: false },
  right: { id: 'right', name: 'Right Camera', position: [2, 3, 0], rotation: getCameraRotation(1, 0, Math.PI / 3), fovH: 190, fovV: 130, blocked: false },
};

export const useStore = create<AppState>((set) => ({
  systemType: 'VBV-360-10000-AI',
  has360System: false,
  setHas360System: (has360) => set((state) => {
    // If turning on, add the default cameras if they don't exist
    const newCameras = { ...state.cameras };
    if (has360) {
      if (!newCameras.front) newCameras.front = defaultCameras.front;
      if (!newCameras.rear) newCameras.rear = defaultCameras.rear;
      if (!newCameras.left) newCameras.left = defaultCameras.left;
      if (!newCameras.right) newCameras.right = defaultCameras.right;
    } else {
      // Remove default cameras
      delete newCameras.front;
      delete newCameras.rear;
      delete newCameras.left;
      delete newCameras.right;
    }
    return { has360System: has360, cameras: newCameras };
  }),
  setSystemType: (type) => set((state) => {
    const fovH = type === 'VBV-360-10000-AI' ? 190 : 180;
    const fovV = type === 'VBV-360-10000-AI' ? 130 : 120;
    
    const newCameras = { ...state.cameras };
    Object.keys(newCameras).forEach(key => {
      newCameras[key] = { ...newCameras[key], fovH, fovV };
    });

    return { systemType: type, cameras: newCameras };
  }),
  
  vehicleSize: { width: 2, length: 5, height: 2 },
  setVehicleSize: (size) => set((state) => {
    // Prevent infinite render loops by avoiding identical updates
    if (
      Math.abs(state.vehicleSize.width - size.width) < 0.001 &&
      Math.abs(state.vehicleSize.length - size.length) < 0.001 &&
      Math.abs(state.vehicleSize.height - size.height) < 0.001
    ) {
      return state;
    }

    // Auto-update mats when vehicle size changes
    const w = size.width / 2 + 1; // 1 meter padding
    const l = size.length / 2 + 1;
    return { 
      vehicleSize: size,
      mats: {
        mat0: { ...state.mats.mat0, position: [w, 0.01, l] },
        mat1: { ...state.mats.mat1, position: [-w, 0.01, l] },
        mat2: { ...state.mats.mat2, position: [-w, 0.01, -l] },
        mat3: { ...state.mats.mat3, position: [w, 0.01, -l] },
      }
    };
  }),

  modelScale: [1, 1, 1],
  setModelScale: (scale) => set({ modelScale: scale }),

  modelRotation: [0, 0, 0],
  setModelRotation: (rotation) => set({ modelRotation: rotation }),
  
  cameras: {},
  addCamera: (camera) => set((state) => ({ cameras: { ...state.cameras, [camera.id]: camera } })),
  removeCamera: (id) => set((state) => {
    const newCameras = { ...state.cameras };
    delete newCameras[id];
    return { cameras: newCameras };
  }),
  updateCamera: (id, updates) => set((state) => ({
    cameras: {
      ...state.cameras,
      [id]: { ...state.cameras[id], ...updates }
    }
  })),

  monitors: {},
  addMonitor: (monitor) => set((state) => ({ monitors: { ...state.monitors, [monitor.id]: monitor } })),
  removeMonitor: (id) => set((state) => {
    const newMonitors = { ...state.monitors };
    delete newMonitors[id];
    return { monitors: newMonitors };
  }),
  updateMonitor: (id, updates) => set((state) => ({
    monitors: { ...state.monitors, [id]: { ...state.monitors[id], ...updates } }
  })),

  sensors: {},
  addSensor: (sensor) => set((state) => ({ sensors: { ...state.sensors, [sensor.id]: sensor } })),
  removeSensor: (id) => set((state) => {
    const newSensors = { ...state.sensors };
    delete newSensors[id];
    return { sensors: newSensors };
  }),
  updateSensor: (id, updates) => set((state) => ({
    sensors: {
      ...state.sensors,
      [id]: { ...state.sensors[id], ...updates }
    }
  })),
  
  selectedObjectId: null,
  setSelectedObjectId: (id) => set({ selectedObjectId: id }),

  gizmoMode: 'rotate',
  setGizmoMode: (mode) => set({ gizmoMode: mode }),

  mats: {
    mat0: { id: 'mat0', position: [2, 0.01, 4], visibleBy: [] },
    mat1: { id: 'mat1', position: [-2, 0.01, 4], visibleBy: [] },
    mat2: { id: 'mat2', position: [-2, 0.01, -4], visibleBy: [] },
    mat3: { id: 'mat3', position: [2, 0.01, -4], visibleBy: [] },
  },
  updateMats: (size) => set((state) => {
    const w = size.width / 2 + 1; // 1 meter padding
    const l = size.length / 2 + 1;
    return {
      mats: {
        mat0: { ...state.mats.mat0, position: [w, 0.01, l] },
        mat1: { ...state.mats.mat1, position: [-w, 0.01, l] },
        mat2: { ...state.mats.mat2, position: [-w, 0.01, -l] },
        mat3: { ...state.mats.mat3, position: [w, 0.01, -l] },
      }
    };
  }),

  wiringNodes: [],
  wiringEdges: [],
  updateWiring: (nodes, edges) => set({ wiringNodes: nodes, wiringEdges: edges }),

  past: [],
  future: [],
  saveSnapshot: () => set((state) => {
    const snapshot: StoreSnapshot = {
      cameras: JSON.parse(JSON.stringify(state.cameras)),
      monitors: JSON.parse(JSON.stringify(state.monitors)),
      sensors: JSON.parse(JSON.stringify(state.sensors)),
      has360System: state.has360System,
      vehicleSize: { ...state.vehicleSize },
      modelScale: [...state.modelScale],
      modelRotation: [...state.modelRotation],
      systemType: state.systemType,
      mats: JSON.parse(JSON.stringify(state.mats)),
      wiringNodes: JSON.parse(JSON.stringify(state.wiringNodes)),
      wiringEdges: JSON.parse(JSON.stringify(state.wiringEdges)),
    };
    // Keep max 50 snapshots
    const newPast = [...state.past, snapshot].slice(-50);
    return { past: newPast, future: [] };
  }),
  undo: () => set((state) => {
    if (state.past.length === 0) return state;
    const previous = state.past[state.past.length - 1];
    const newPast = state.past.slice(0, -1);
    const currentSnapshot: StoreSnapshot = {
      cameras: state.cameras,
      monitors: state.monitors,
      sensors: state.sensors,
      has360System: state.has360System,
      vehicleSize: state.vehicleSize,
      modelScale: state.modelScale,
      modelRotation: state.modelRotation,
      systemType: state.systemType,
      mats: state.mats,
      wiringNodes: state.wiringNodes,
      wiringEdges: state.wiringEdges,
    };
    return {
      ...previous,
      past: newPast,
      future: [currentSnapshot, ...state.future]
    };
  }),
  redo: () => set((state) => {
    if (state.future.length === 0) return state;
    const next = state.future[0];
    const newFuture = state.future.slice(1);
    const currentSnapshot: StoreSnapshot = {
       cameras: state.cameras,
       monitors: state.monitors,
       sensors: state.sensors,
       has360System: state.has360System,
       vehicleSize: state.vehicleSize,
       modelScale: state.modelScale,
       modelRotation: state.modelRotation,
       systemType: state.systemType,
       mats: state.mats,
       wiringNodes: state.wiringNodes,
       wiringEdges: state.wiringEdges,
    };
    return {
      ...next,
      past: [...state.past, currentSnapshot],
      future: newFuture
    };
  })
}));
