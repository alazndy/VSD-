import { useEffect } from 'react';
import { useStore, SystemType } from '../store';
import { Upload, Camera, Move, RotateCw, Radar, Zap, Volume2 } from 'lucide-react';
import { setUploadedModel } from './VehicleModel';
import { initWorker } from '../opencvHelper';

export default function Sidebar() {
  const { 
    systemType, setSystemType, 
    has360System, setHas360System, 
    vehicleSize, 
    cameras, sensors, monitors,
    selectedObjectId, setSelectedObjectId, 
    gizmoMode, setGizmoMode, 
    addCamera, addMonitor, addSensor,
    removeCamera, removeMonitor, removeSensor,
    updateCamera, updateSensor
  } = useStore();

  const selectedCamera = selectedObjectId ? cameras[selectedObjectId] : null;
  const selectedSensor = selectedObjectId ? sensors[selectedObjectId] : null;
  const selectedObject = selectedCamera || selectedSensor;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (extension === 'stl' || extension === 'obj' || extension === 'fbx') {
      setUploadedModel(url, extension as 'stl' | 'obj' | 'fbx');
    } else {
      alert('Please upload an STL, OBJ, or FBX file.');
    }
  };

  return (
    <aside className="bg-surface border-r border-border p-4 flex flex-col gap-5 overflow-y-auto">
      {/* Equipment Configuration */}
      <div>
        <div className="text-[10px] uppercase tracking-[1px] text-text-dim mb-3 border-b border-border pb-1">Equipment Configuration</div>
        
        <label className="flex items-center gap-2 mb-3 cursor-pointer">
          <input 
            type="checkbox" 
            checked={has360System}
            onChange={(e) => {
              useStore.getState().saveSnapshot();
              setHas360System(e.target.checked);
            }}
            className="accent-accent"
          />
          <span className="text-xs font-mono text-text-main">Equip 360 Surround View</span>
        </label>

        <div className="flex gap-2">
           <button 
             className="flex-1 bg-bg hover:bg-accent/20 text-accent border border-border hover:border-accent p-1.5 text-[10px] font-mono transition-colors"
             onClick={() => {
               useStore.getState().saveSnapshot();
               const id = 'cam_' + Date.now();
               addCamera({
                 id,
                 name: 'Custom Cam ' + (Object.keys(cameras).length + 1),
                 position: [0, 3, -6],
                 rotation: [0, 0, 0],
                 fovH: 120,
                 fovV: 80,
                 blocked: false
               });
             }}
           >+ ADD CAMERA</button>
           <div className="flex-1 flex flex-col gap-1">
             <button 
               className="w-full bg-bg hover:bg-accent/20 text-accent border border-border hover:border-accent p-1.5 text-[9px] font-mono transition-colors"
               onClick={() => {
                 useStore.getState().saveSnapshot();
                 const id = 'mon_' + Date.now();
                 addMonitor({
                   id,
                   name: '7" Monitor ' + (Object.keys(monitors).length + 1),
                   type: 'MON-7-3CH',
                   cameraIds: [null, null, null]
                 });
               }}
             >+ 7" (3CH)</button>
             <button 
               className="w-full bg-bg hover:bg-accent/20 text-accent border border-border hover:border-accent p-1.5 text-[9px] font-mono transition-colors"
               onClick={() => {
                 useStore.getState().saveSnapshot();
                 const id = 'mon_' + Date.now();
                 addMonitor({
                   id,
                   name: '10.4" Monitor ' + (Object.keys(monitors).length + 1),
                   type: 'MON-10.4-4CH',
                   cameraIds: [null, null, null, null]
                 });
               }}
             >+ 10.4" (4CH)</button>
           </div>
        </div>

        <div className="flex gap-2 mt-2">
           <button 
             className="flex-1 bg-bg hover:bg-accent/20 text-accent border border-border hover:border-accent p-1.5 text-[9px] font-mono transition-colors flex flex-col items-center gap-1"
             onClick={() => {
               useStore.getState().saveSnapshot();
               const id = 'sensor_' + Date.now();
               addSensor({
                 id,
                 name: 'UDS-CAN-ECU ' + (Object.keys(sensors).filter(k => sensors[k].type === 'ultrasonic').length + 1),
                 type: 'ultrasonic',
                 position: [0, 0.5, -2.5],
                 rotation: [0, Math.PI, 0],
                 range: 2.5,
                 minRange: 0.3,
                 maxWidth: null,
                 widthH: 120 * Math.PI / 180, // 120 deg
                 widthV: 60 * Math.PI / 180, // 60 deg
                 resolution: 0.1,
                 odsEnabled: false,
                 isActive: true,
                 detectedDistance: null
               });
             }}
           >
             <Zap className="w-3 h-3" />
             <span>UDS-CAN-ECU</span>
           </button>
           <button 
             className="flex-1 bg-bg hover:bg-accent/20 text-accent border border-border hover:border-accent p-1.5 text-[9px] font-mono transition-colors flex flex-col items-center gap-1"
             onClick={() => {
               useStore.getState().saveSnapshot();
               const id = 'sensor_' + Date.now();
               addSensor({
                 id,
                 name: 'BS-9100 ' + (Object.keys(sensors).filter(k => sensors[k].type === 'radar').length + 1),
                 type: 'radar',
                 position: [0, 1, -2.5],
                 rotation: [0, Math.PI, 0],
                 range: 60,
                 minRange: 0.3,
                 maxWidth: 16,
                 widthH: 140 * Math.PI / 180,
                 widthV: 16 * Math.PI / 180,
                 resolution: 0.25,
                 odsEnabled: false,
                 isActive: true,
                 detectedDistance: null
               });
             }}
           >
             <Radar className="w-3 h-3" />
             <span>RADAR</span>
           </button>
        </div>

        <button 
          className="w-full mt-2 bg-accent/10 hover:bg-accent/20 text-accent border border-accent/30 p-2 text-[10px] font-mono transition-colors flex items-center justify-center gap-2"
          onClick={() => {
            useStore.getState().saveSnapshot();
            const now = Date.now();
            const positions: [number, number, number][] = [[-1, 0.5, 2.5], [-0.3, 0.5, 2.5], [0.3, 0.5, 2.5], [1, 0.5, 2.5]];
            positions.forEach((pos, i) => {
              addSensor({
                id: `uds_${now}_${i}`,
                name: `UDS-CAN-ECU CH${i+1}`,
                type: 'ultrasonic',
                position: pos,
                rotation: [0, 0, 0], // Facing rear
                range: 2.5,
                minRange: 0.3,
                maxWidth: null,
                widthH: 120 * Math.PI / 180,
                widthV: 60 * Math.PI / 180,
                resolution: 0.1,
                odsEnabled: false,
                isActive: true,
                detectedDistance: null
              });
            });
          }}
        >
          <Zap className="w-3 h-3" />
          <span>ADD UDS-CAN-ECU (4-CH SET)</span>
        </button>
      </div>

      {has360System && (
        <div>
          <div className="text-[10px] uppercase tracking-[1px] text-text-dim mb-3 border-b border-border pb-1">360 Calibration</div>
          
          <div className="text-[9px] text-text-dim mb-1 uppercase tracking-widest">Target System Format:</div>
          <select 
            className="w-full bg-bg border border-border text-accent p-1.5 text-xs font-mono outline-none mb-3"
            value={systemType}
            onChange={(e) => {
              useStore.getState().saveSnapshot();
              setSystemType(e.target.value as SystemType);
            }}
          >
            <option value="VBV-360-10000-AI">VBV-360-10000-AI</option>
            <option value="BN360-300">BN360-300</option>
          </select>

          <button 
            className="w-full bg-accent text-bg hover:bg-accent/80 font-bold p-1.5 text-[10px] font-mono transition-colors flex items-center justify-center gap-2"
            onClick={() => {
              alert(`Starting OpenCV Calibration Process for ${systemType}...\n\nExtracting extrinsic parameters from 4 surround cameras. The generated configuration file will be formatted for the ${systemType} ECU.`);
            }}
          >
            <RotateCw className="w-3 h-3" /> GENERATE CALIBRATION
          </button>
        </div>
      )}

      {/* Asset Pipeline */}
      <div>
        <div className="text-[10px] uppercase tracking-[1px] text-text-dim mb-3 border-b border-border pb-1">Vehicle Model</div>
        <label className="flex items-center justify-center gap-2 w-full bg-bg hover:bg-border cursor-pointer transition-colors p-2 border border-dashed border-border text-text-main text-xs font-mono">
          <Upload className="w-3 h-3" />
          <span>UPLOAD STL/OBJ/FBX</span>
          <input type="file" accept=".stl,.obj,.fbx" className="hidden" onChange={handleFileUpload} />
        </label>
        
        {vehicleSize.length > 0 && (
          <div className="flex flex-col gap-2 mt-3">
            <div className="mt-2 border-t border-border pt-2 flex flex-col gap-2">
              <div className="text-[9px] uppercase text-text-dim mb-1">Calibrate Dimensions</div>
              
              <div className="flex gap-2 items-center">
                <span className="text-text-dim text-xs font-mono w-10">W (m)</span>
                <input 
                  type="number" 
                  step="0.01"
                  id="calibrate-width"
                  key={`w-${vehicleSize.width}`}
                  className="w-full bg-bg border border-border text-xs px-2 py-1 focus:border-accent outline-none font-mono text-text-main"
                  defaultValue={vehicleSize.width.toFixed(2)}
                />
              </div>

              <div className="flex gap-2 items-center">
                <span className="text-text-dim text-xs font-mono w-10">L (m)</span>
                <input 
                  type="number" 
                  step="0.01"
                  id="calibrate-length"
                  key={`l-${vehicleSize.length}`}
                  className="w-full bg-bg border border-border text-xs px-2 py-1 focus:border-accent outline-none font-mono text-text-main"
                  defaultValue={vehicleSize.length.toFixed(2)}
                />
              </div>

              <div className="flex gap-2 items-center">
                <span className="text-text-dim text-xs font-mono w-10">H (m)</span>
                <input 
                  type="number" 
                  step="0.01"
                  id="calibrate-height"
                  key={`h-${vehicleSize.height}`}
                  className="w-full bg-bg border border-border text-xs px-2 py-1 focus:border-accent outline-none font-mono text-text-main"
                  defaultValue={vehicleSize.height.toFixed(2)}
                />
              </div>

              <button 
                className="w-full mt-2 bg-bg hover:bg-accent/20 text-accent border border-border hover:border-accent px-2 py-1.5 text-[10px] font-mono transition-colors"
                onClick={() => {
                   const store = useStore.getState();
                   const wText = (document.getElementById('calibrate-width') as HTMLInputElement).value;
                   const lText = (document.getElementById('calibrate-length') as HTMLInputElement).value;
                   const hText = (document.getElementById('calibrate-height') as HTMLInputElement).value;
                   
                   const targetW = parseFloat(wText);
                   const targetL = parseFloat(lText);
                   const targetH = parseFloat(hText);

                   if (!isNaN(targetW) && !isNaN(targetL) && !isNaN(targetH) && 
                       targetW > 0 && targetL > 0 && targetH > 0 && 
                       vehicleSize.width > 0 && vehicleSize.length > 0 && vehicleSize.height > 0) {
                      
                      store.saveSnapshot();

                      const ratioW = targetW / vehicleSize.width;
                      const ratioH = targetH / vehicleSize.height;
                      const ratioL = targetL / vehicleSize.length;
                      
                      const currentScale = store.modelScale;
                      store.setModelScale([
                        currentScale[0] * ratioW,
                        currentScale[1] * ratioH,
                        currentScale[2] * ratioL
                      ]);
                   }
                }}
              >
                APPLY DIMENSIONS
              </button>
            </div>

            <div className="mt-2 border-t border-border pt-2 flex flex-col gap-2">
              <div className="text-[9px] uppercase text-text-dim mb-1">Rotate Model (Degrees)</div>
              
              <div className="flex gap-2 items-center">
                <span className="text-text-dim text-xs font-mono w-10">X</span>
                <input 
                  type="number" 
                  step="90"
                  id="rotate-x"
                  className="w-full bg-bg border border-border text-xs px-2 py-1 focus:border-accent outline-none font-mono text-text-main"
                  defaultValue={useStore.getState().modelRotation[0]}
                />
              </div>

              <div className="flex gap-2 items-center">
                <span className="text-text-dim text-xs font-mono w-10">Y</span>
                <input 
                  type="number" 
                  step="90"
                  id="rotate-y"
                  className="w-full bg-bg border border-border text-xs px-2 py-1 focus:border-accent outline-none font-mono text-text-main"
                  defaultValue={useStore.getState().modelRotation[1]}
                />
              </div>

              <div className="flex gap-2 items-center">
                <span className="text-text-dim text-xs font-mono w-10">Z</span>
                <input 
                  type="number" 
                  step="90"
                  id="rotate-z"
                  className="w-full bg-bg border border-border text-xs px-2 py-1 focus:border-accent outline-none font-mono text-text-main"
                  defaultValue={useStore.getState().modelRotation[2]}
                />
              </div>
              
              <button 
                className="w-full mt-2 bg-bg hover:bg-accent/20 text-accent border border-border hover:border-accent px-2 py-1.5 text-[10px] font-mono transition-colors"
                onClick={() => {
                   const store = useStore.getState();
                   const xText = (document.getElementById('rotate-x') as HTMLInputElement).value;
                   const yText = (document.getElementById('rotate-y') as HTMLInputElement).value;
                   const zText = (document.getElementById('rotate-z') as HTMLInputElement).value;
                   
                   const targetX = parseFloat(xText);
                   const targetY = parseFloat(yText);
                   const targetZ = parseFloat(zText);

                   if (!isNaN(targetX) && !isNaN(targetY) && !isNaN(targetZ)) {
                      store.saveSnapshot();
                      store.setModelRotation([targetX, targetY, targetZ]);
                   }
                }}
              >
                APPLY ROTATION
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Camera & Sensor List */}
      <div>
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[1px] text-text-dim mb-3 border-b border-border pb-1">
          <span>Installed Equipment</span>
        </div>
        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
          {Object.values(cameras).map((cam, index) => (
            <div 
              key={cam.id} 
              className={`p-2 border text-xs font-mono flex items-center justify-between cursor-pointer transition-colors ${selectedObjectId === cam.id ? 'bg-accent/10 border-accent text-accent' : 'bg-bg border-border text-text-main hover:border-text-dim'}`}
              onClick={() => setSelectedObjectId(cam.id)}
            >
              <div className="flex items-center gap-2">
                <Camera className="w-3 h-3" />
                <span>{cam.name.toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-2">
                {cam.blocked && (
                  <span className="text-[9px] bg-red-900/50 text-red-400 px-1 py-0.5 rounded border border-red-500/50">BLOCKED</span>
                )}
                {!['front', 'rear', 'left', 'right'].includes(cam.id) && (
                  <button 
                    className="text-text-dim hover:text-red-400 opacity-60 hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (selectedObjectId === cam.id) setSelectedObjectId(null);
                      removeCamera(cam.id);
                    }}
                  >✕</button>
                )}
              </div>
            </div>
          ))}

          {Object.values(sensors).map((sensor) => (
            <div 
              key={sensor.id} 
              className={`p-2 border text-xs font-mono flex items-center justify-between cursor-pointer transition-colors ${selectedObjectId === sensor.id ? 'bg-accent/10 border-accent text-accent' : 'bg-bg border-border text-text-main hover:border-text-dim'}`}
              onClick={() => setSelectedObjectId(sensor.id)}
            >
              <div className="flex items-center gap-2">
                {sensor.type === 'radar' ? <Radar className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                <span>{sensor.name.toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-2">
                {sensor.odsEnabled ? (
                  <span className="text-[9px] bg-accent/20 text-accent px-1 py-0.5 rounded border border-accent/50">ODS</span>
                ) : (
                  <Volume2 className="w-3 h-3 text-text-dim opacity-40" />
                )}
                <button 
                  className="text-text-dim hover:text-red-400 opacity-60 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (selectedObjectId === sensor.id) setSelectedObjectId(null);
                    removeSensor(sensor.id);
                  }}
                >✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {Object.values(monitors).length > 0 && (
         <div>
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[1px] text-text-dim mb-3 border-b border-border pb-1">
            <span>Linked Monitors</span>
          </div>
          <div className="flex flex-col gap-2">
            {Object.values(monitors).map(mon => (
              <div key={mon.id} className="p-2 border border-border bg-bg text-xs font-mono group hover:border-accent/50 transition-colors">
                <div className="flex justify-between items-center mb-2 text-text-main">
                  <div className="flex flex-col">
                    <span className="text-accent">{mon.name.toUpperCase()}</span>
                    <span className="text-[8px] opacity-40 italic">{mon.type === 'MON-7-3CH' ? '7 INCH / 3 CHANNEL' : '10.4 INCH / 4 CHANNEL AHD'}</span>
                  </div>
                  <button 
                    className="text-text-dim hover:text-red-400 opacity-60 hover:opacity-100"
                    onClick={() => {
                      useStore.getState().saveSnapshot();
                      removeMonitor(mon.id);
                    }}
                  >✕</button>
                </div>
                
                <div className="flex flex-col gap-2">
                  {mon.cameraIds.map((camId, chIndex) => (
                    <div key={chIndex} className="flex flex-col gap-1">
                      <div className="text-[8px] text-text-dim uppercase tracking-widest flex justify-between">
                        <span>Channel {chIndex + 1}</span>
                        {camId && <span className="text-accent/60">ACTIVE</span>}
                      </div>
                      <select 
                        className="w-full bg-surface border border-border focus:border-accent text-text-main p-1.5 text-[10px] font-mono outline-none cursor-pointer"
                        value={camId || ''}
                        onChange={(e) => {
                          useStore.getState().saveSnapshot();
                          const newCameraIds = [...mon.cameraIds];
                          newCameraIds[chIndex] = e.target.value || null;
                          useStore.getState().updateMonitor(mon.id, { cameraIds: newCameraIds });
                        }}
                      >
                        <option value="">-- NO SIGNAL (DISCONNECTED) --</option>
                        {Object.values(cameras).map(c => (
                           <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
         </div>
      )}

      {/* Calibration Mat Status */}
      {has360System && (
        <div>
          <div className="text-[10px] uppercase tracking-[1px] text-text-dim mb-3 border-b border-border pb-1">Calibration Mats</div>
          <div className="p-2 border border-warning bg-warning/10 text-warning text-xs font-mono">
            ⚠️ MAT_02 (REAR-LEFT) NOT FULLY VISIBLE.<br/>
            ACTION: SHIFT MAT X-AXIS +15cm.
          </div>
        </div>
      )}

      {/* Selected Object Details */}
      {selectedObjectId && selectedObject && (
        <div className="mt-auto pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-3">
             <div className="text-[10px] uppercase tracking-[1px] text-accent font-bold">
               {selectedSensor ? 'Sensor Config' : 'Camera Config'}: {selectedObject.name.toUpperCase()}
             </div>
             <button 
               className="text-[10px] text-text-dim hover:text-text-main"
               onClick={() => setSelectedObjectId(null)}
             >CLOSE</button>
          </div>
          
          <div className="flex gap-2 mb-3">
            <button
              className={`flex-1 py-1 flex items-center justify-center gap-1 text-[10px] font-mono border transition-colors ${gizmoMode === 'translate' ? 'bg-accent/20 text-accent border-accent' : 'bg-bg text-text-dim border-border hover:border-text-dim'}`}
              onClick={() => setGizmoMode('translate')}
            >
              <Move className="w-3 h-3" /> MOVE
            </button>
            <button
              className={`flex-1 py-1 flex items-center justify-center gap-1 text-[10px] font-mono border transition-colors ${gizmoMode === 'rotate' ? 'bg-accent/20 text-accent border-accent' : 'bg-bg text-text-dim border-border hover:border-text-dim'}`}
              onClick={() => setGizmoMode('rotate')}
            >
              <RotateCw className="w-3 h-3" /> ROTATE
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center p-2 bg-bg border border-border">
                <span className="text-[9px] text-text-dim mb-1 uppercase tracking-tighter">X-Pos</span>
                <span className="font-mono text-[10px]">{selectedObject.position[0].toFixed(2)}</span>
              </div>
              <div className="flex flex-col items-center p-2 bg-bg border border-border">
                <span className="text-[9px] text-text-dim mb-1 uppercase tracking-tighter">Y-Pos</span>
                <span className="font-mono text-[10px]">{selectedObject.position[1].toFixed(2)}</span>
              </div>
              <div className="flex flex-col items-center p-2 bg-bg border border-border">
                <span className="text-[9px] text-text-dim mb-1 uppercase tracking-tighter">Z-Pos</span>
                <span className="font-mono text-[10px]">{selectedObject.position[2].toFixed(2)}</span>
              </div>
            </div>

            {selectedSensor && (
              <div className="bg-bg border border-border p-3 flex flex-col gap-3">
                <div className="text-[10px] text-accent font-bold border-b border-border pb-1">TECHNICAL SPECS</div>
                <div className="flex justify-between text-[9px] font-mono opacity-60">
                   <span>RESOLUTION:</span>
                   <span>{selectedSensor.resolution}m</span>
                </div>
                <div className="flex justify-between text-[9px] font-mono opacity-60">
                   <span>MIN RANGE:</span>
                   <span>{selectedSensor.minRange}m</span>
                </div>

                <div className="flex flex-col gap-2 border-t border-border pt-2">
                   <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={selectedSensor.isActive}
                      onChange={(e) => {
                        useStore.getState().saveSnapshot();
                        updateSensor(selectedObjectId, { isActive: e.target.checked });
                      }}
                      className="accent-accent"
                    />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono text-text-main">ACTIVE (POWER ON)</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={selectedSensor.odsEnabled}
                      onChange={(e) => {
                        useStore.getState().saveSnapshot();
                        updateSensor(selectedObjectId, { odsEnabled: e.target.checked });
                      }}
                      className="accent-accent"
                    />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono text-text-main">ENABLE ODS MODULE</span>
                      <span className="text-[8px] text-text-dim uppercase">Visual Alerts on Monitor</span>
                    </div>
                  </label>
                </div>

                <div className="flex flex-col gap-1 border-t border-border pt-2">
                  <div className="flex justify-between text-[10px] font-mono text-accent font-bold mb-1">
                    <span>SIMULATE DISTANCE</span>
                    <span>{selectedSensor.detectedDistance !== null 
                      ? (Math.round(selectedSensor.detectedDistance / selectedSensor.resolution) * selectedSensor.resolution).toFixed(2) + 'm'
                      : 'OFF'}</span>
                  </div>
                  <input 
                    type="range" min={selectedSensor.minRange} max={selectedSensor.range} step={0.01}
                    value={selectedSensor.detectedDistance || 0}
                    onChange={(e) => updateSensor(selectedObjectId, { detectedDistance: parseFloat(e.target.value) })}
                    className="w-full accent-red-500 h-1.5"
                  />
                  <button 
                    className="text-[8px] uppercase text-text-dim hover:text-accent mt-1 self-end"
                    onClick={() => updateSensor(selectedObjectId, { detectedDistance: null })}
                  >Reset Observation</button>
                </div>

                <div className="flex flex-col gap-1 border-t border-border pt-2">
                  <div className="flex justify-between text-[9px] font-mono text-text-dim">
                    <span>MAX RANGE (m)</span>
                    <span className="text-text-main">{selectedSensor.range.toFixed(1)}m</span>
                  </div>
                  <input 
                    type="range" min={0.5} max={selectedSensor.type === 'radar' ? 100 : 5} step={0.5}
                    value={selectedSensor.range}
                    onChange={(e) => updateSensor(selectedObjectId, { range: parseFloat(e.target.value) })}
                    className="w-full accent-accent h-1"
                  />
                </div>

                {selectedSensor.maxWidth !== null && (
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[9px] font-mono text-text-dim">
                      <span>MAX CAP WIDTH (m)</span>
                      <span className="text-text-main">{selectedSensor.maxWidth.toFixed(1)}m</span>
                    </div>
                    <input 
                      type="range" min={1} max={30} step={0.5}
                      value={selectedSensor.maxWidth}
                      onChange={(e) => updateSensor(selectedObjectId, { maxWidth: parseFloat(e.target.value) })}
                      className="w-full accent-accent h-1"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[9px] font-mono text-text-dim">
                    <span>HORIZ. BEAM WIDTH</span>
                    <span className="text-text-main">{(selectedSensor.widthH * 180 / Math.PI).toFixed(0)}°</span>
                  </div>
                  <input 
                    type="range" min={0.1} max={Math.PI} step={0.01}
                    value={selectedSensor.widthH}
                    onChange={(e) => updateSensor(selectedObjectId, { widthH: parseFloat(e.target.value) })}
                    className="w-full accent-accent h-1"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[9px] font-mono text-text-dim">
                    <span>VERT. BEAM WIDTH</span>
                    <span className="text-text-main">{(selectedSensor.widthV * 180 / Math.PI).toFixed(0)}°</span>
                  </div>
                  <input 
                    type="range" min={0.1} max={Math.PI / 2} step={0.01}
                    value={selectedSensor.widthV}
                    onChange={(e) => updateSensor(selectedObjectId, { widthV: parseFloat(e.target.value) })}
                    className="w-full accent-accent h-1"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 p-3 bg-bg border border-border">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[10px] font-mono text-text-dim">
                  <span>PITCH (X)</span>
                  <span className="text-accent">{(selectedObject.rotation[0] * 180 / Math.PI).toFixed(0)}°</span>
                </div>
                <input 
                  type="range" min={-Math.PI} max={Math.PI} step={0.01}
                  value={selectedObject.rotation[0]}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (selectedCamera) updateCamera(selectedObjectId, { rotation: [val, selectedObject.rotation[1], selectedObject.rotation[2]] });
                    if (selectedSensor) updateSensor(selectedObjectId, { rotation: [val, selectedObject.rotation[1], selectedObject.rotation[2]] });
                  }}
                  className="w-full accent-accent h-1"
                />
              </div>
              
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[10px] font-mono text-text-dim">
                  <span>YAW (Y)</span>
                  <span className="text-accent">{(selectedObject.rotation[1] * 180 / Math.PI).toFixed(0)}°</span>
                </div>
                <input 
                  type="range" min={-Math.PI} max={Math.PI} step={0.01}
                  value={selectedObject.rotation[1]}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (selectedCamera) updateCamera(selectedObjectId, { rotation: [selectedObject.rotation[0], val, selectedObject.rotation[2]] });
                    if (selectedSensor) updateSensor(selectedObjectId, { rotation: [selectedObject.rotation[0], val, selectedObject.rotation[2]] });
                  }}
                  className="w-full accent-accent h-1"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[10px] font-mono text-text-dim">
                  <span>ROLL (Z)</span>
                  <span className="text-accent">{(selectedObject.rotation[2] * 180 / Math.PI).toFixed(0)}°</span>
                </div>
                <input 
                  type="range" min={-Math.PI} max={Math.PI} step={0.01}
                  value={selectedObject.rotation[2]}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (selectedCamera) updateCamera(selectedObjectId, { rotation: [selectedObject.rotation[0], selectedObject.rotation[1], val] });
                    if (selectedSensor) updateSensor(selectedObjectId, { rotation: [selectedObject.rotation[0], selectedObject.rotation[1], val] });
                  }}
                  className="w-full accent-accent h-1"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
