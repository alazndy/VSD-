import { Suspense, useMemo, useRef } from 'react';
import { useStore } from '../store';
import { PerspectiveCamera, View } from '@react-three/drei';
import { Radar, Zap, Volume2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import VehicleModel from './VehicleModel';
import GroundLabels from './GroundLabels';
import CalibrationMats from './CalibrationMats';

function CameraView({ id, name, label }: { id: string, name: string, label?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cameraState = useStore((state) => state.cameras[id]);
  const sensors = useStore((state) => state.sensors);
  const has360System = useStore((state) => state.has360System);

  // Find sensors that should show on this screen if ODS is enabled
  const activeOdsSensors = useMemo(() => {
    return Object.values(sensors).filter(s => s.odsEnabled && s.isActive);
  }, [sensors]);

  if (!cameraState) {
    return (
      <div className="bg-black border border-border relative flex items-center justify-center min-h-[100px] h-full">
        <span className="text-[10px] text-text-dim/50 font-mono">NO SIGNAL</span>
        {label && (
           <div className="absolute top-1 left-1 text-[9px] font-mono text-accent z-20 bg-black/50 px-1 py-0.5">
             CH: {label.toUpperCase()}
           </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-black border border-border relative overflow-hidden flex items-center justify-center min-h-[100px] h-full mb-2 last:mb-0">
      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_40%,rgba(0,0,0,0.8)_100%)] pointer-events-none z-10"></div>
      
      <div className="absolute top-1 left-1 text-[9px] font-mono text-accent z-20 bg-black/50 px-1 py-0.5 max-w-[90%] truncate">
        CH: {(label || name).toUpperCase()}
        {label && name && label !== name && (
          <span className="text-text-dim ml-1 bg-black/20 px-1">[{name.toUpperCase()}]</span>
        )}
      </div>

      {/* ODS Overlays */}
      <div className="absolute inset-0 pointer-events-none z-20 flex flex-col items-center justify-center">
        {activeOdsSensors.length > 0 && activeOdsSensors.some(s => s.detectedDistance !== null && s.isActive) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="border-2 border-red-500 w-[95%] h-[95%] absolute inset-0 m-auto flex items-end justify-center pb-2"
          >
             <div className="bg-red-500 text-white text-[10px] px-2 py-0.5 font-bold flex items-center gap-1">
               <AlertTriangle className="w-3 h-3" />
               ODS: OBJECT DETECTED
             </div>
          </motion.div>
        )}
        
        <div className="absolute bottom-1 right-1 flex flex-col items-end gap-1">
          {activeOdsSensors.filter(s => s.isActive).map(s => {
            const dist = s.detectedDistance !== null 
              ? (Math.round(s.detectedDistance / s.resolution) * s.resolution).toFixed(2)
              : null;
            return (
              <div key={s.id} className={`text-black text-[7px] font-bold px-1 rounded flex items-center gap-1 ${dist ? 'bg-red-500 text-white animate-pulse' : 'bg-accent/80'}`}>
                {s.type === 'radar' ? <Radar className="w-2 h-2" /> : <Zap className="w-2 h-2" />}
                {s.name} {dist && `| ${dist}m`}
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="w-[120%] h-[120%] border border-dashed border-accent/20 rounded-[40%] flex items-center justify-center opacity-40 absolute z-10 pointer-events-none"></div>

      <div ref={containerRef} className="w-full h-full absolute inset-0">
        <View track={containerRef} className="w-full h-full">
          <PerspectiveCamera 
            makeDefault 
            position={cameraState.position} 
            rotation={cameraState.rotation} 
            fov={cameraState.fovV} 
          />
          <color attach="background" args={['#1a1a20']} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <Suspense fallback={null}>
            <VehicleModel />
            <GroundLabels />
          </Suspense>
          {has360System && <CalibrationMats />}
          <gridHelper args={[20, 20, '#2D2D33', '#1A1A1E']} position={[0, -0.01, 0]} />
        </View>
      </div>
    </div>
  );
}

export default function CameraViews() {
  const has360System = useStore((state) => state.has360System);
  const monitors = useStore((state) => state.monitors);
  const cameras = useStore((state) => state.cameras);
  const sensors = useStore((state) => state.sensors);

  const baseCameras = ['front', 'rear', 'left', 'right'];

  const audioAlertSensors = useMemo(() => {
    return Object.values(sensors).filter(s => !s.odsEnabled && s.isActive);
  }, [sensors]);

  return (
    <aside className="bg-surface border-l border-border p-2 flex flex-col gap-4 h-full overflow-y-auto">
      {/* Sensor Audio Alerts Section */}
      {audioAlertSensors.length > 0 && (
         <div className="bg-bg border border-red-500/30 p-2">
            <div className="text-[9px] uppercase tracking-[1px] text-red-400 mb-2 font-bold flex items-center gap-2">
               <Volume2 className="w-3 h-3" /> AUDIO WARNINGS ACTIVE
            </div>
            <div className="flex flex-col gap-1">
               {audioAlertSensors.map(s => (
                 <div key={s.id} className="flex items-center justify-between text-[8px] font-mono text-text-dim border-b border-border/50 pb-1">
                    <span className="flex items-center gap-1">
                      {s.type === 'radar' ? <Radar className="w-2 h-2" /> : <Zap className="w-2 h-2" />}
                      {s.name}
                      {s.detectedDistance !== null && (
                        <span className="text-white ml-1">
                          [{(Math.round(s.detectedDistance / s.resolution) * s.resolution).toFixed(2)}m]
                        </span>
                      )}
                    </span>
                    <motion.span 
                      animate={{ opacity: s.detectedDistance !== null ? [1, 0, 1] : 0.5 }}
                      transition={{ repeat: Infinity, duration: 0.5 }}
                      className={s.detectedDistance !== null ? "text-red-500 font-bold" : "text-text-dim"}
                    >
                      {s.detectedDistance !== null ? "BEEP BEEP" : "IDLE"}
                    </motion.span>
                 </div>
               ))}
            </div>
         </div>
      )}

      {has360System && (
         <div>
           <div className="text-[10px] uppercase tracking-[1px] text-text-dim mb-2 border-b border-border pb-1">360 ECU OUT</div>
           <div className="grid grid-cols-1 gap-2">
             {baseCameras.map((id) => (
               cameras[id] ? <CameraView key={`360-${id}`} id={id} name={cameras[id].name} /> : null
             ))}
           </div>
         </div>
      )}

      {Object.values(monitors).length > 0 && (
         <div className="flex flex-col gap-6">
           {Object.values(monitors).map((mon) => (
             <div key={mon.id} className="flex flex-col gap-2">
               <div className="text-[10px] uppercase tracking-[1px] text-text-dim border-b border-border pb-1 flex justify-between">
                 <span>{mon.name}</span>
                 <span className="opacity-50 text-[8px]">{mon.type === 'MON-7-3CH' ? '7" / 3CH' : '10.4" / 4CH AHD'}</span>
               </div>
               
               <div className={`grid gap-1 ${mon.type === 'MON-7-3CH' ? 'grid-cols-1' : 'grid-cols-2'}`}>
                 {mon.cameraIds.map((camId, idx) => {
                   const connectedCam = camId ? cameras[camId] : null;
                   return (
                     <CameraView 
                       key={`${mon.id}-ch-${idx}`} 
                       id={camId || ''} 
                       name={connectedCam ? connectedCam.name : `CH ${idx + 1}`} 
                       label={`${mon.name} - CH${idx + 1}`} 
                     />
                   );
                 })}
               </div>
             </div>
           ))}
         </div>
      )}
      
      {!has360System && Object.values(monitors).length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 mt-10">
           <div className="text-[10px] uppercase font-mono text-text-dim">NO DISPLAYS ACTIVE</div>
           <div className="text-[8px] uppercase font-mono text-text-dim mt-2 max-w-[150px]">Equip a 360 System or add a Monitor from the Equipment Configuration.</div>
        </div>
      )}
    </aside>
  );
}
