import { useStore } from '../store';
import { Loader2, Undo2, Redo2, Network } from 'lucide-react';
import { useState } from 'react';
import { calculateExtrinsics } from '../opencvHelper';
import jsPDF from 'jspdf';

export default function Header({ onOpenWiring }: { onOpenWiring?: () => void }) {
  const { systemType, vehicleSize, cameras, past, future, undo, redo } = useStore();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const results = await calculateExtrinsics(cameras);
      
      if (systemType === 'VBV-360-10000-AI') {
        let xmlData = `<?xml version="1.0" encoding="UTF-8"?>\n<Calibration>\n  <System>VBV-360-10000-AI</System>\n`;
        xmlData += `  <VehicleSize>\n    <Width>${(vehicleSize.width * 1000).toFixed(0)}</Width>\n    <Length>${(vehicleSize.length * 1000).toFixed(0)}</Length>\n  </VehicleSize>\n`;
        
        for (const [camId, data] of Object.entries(results)) {
          xmlData += `  <Camera id="${camId}">\n`;
          xmlData += `    <K>${data.K.flat().join(' ')}</K>\n`;
          xmlData += `    <Rotate>${data.rotate.join(' ')}</Rotate>\n`;
          xmlData += `    <Translate>${data.translate.join(' ')}</Translate>\n`;
          xmlData += `    <OutTrigle>${data.OutTrigle.join(' ')}</OutTrigle>\n`;
          xmlData += `  </Camera>\n`;
        }
        xmlData += `</Calibration>`;
        
        // Try File System Access API first
        if ('showSaveFilePicker' in window) {
          try {
            const handle = await (window as any).showSaveFilePicker({
              suggestedName: 'Calibration_Configure.xml',
              types: [{
                description: 'XML Files',
                accept: { 'text/xml': ['.xml'] },
              }],
            });
            const writable = await handle.createWritable();
            await writable.write(xmlData);
            await writable.close();
          } catch (err: any) {
            if (err.name !== 'AbortError') {
              console.error(err);
              fallbackDownload(xmlData, 'Calibration_Configure.xml', 'text/xml');
            }
          }
        } else {
          fallbackDownload(xmlData, 'Calibration_Configure.xml', 'text/xml');
        }
      } else {
        // BN360-300 PDF Report
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('Brigade BN360-300 Calibration Blueprint', 14, 22);
        
        doc.setFontSize(12);
        doc.text(`Vehicle Dimensions: W: ${(vehicleSize.width * 1000).toFixed(0)}mm, L: ${(vehicleSize.length * 1000).toFixed(0)}mm`, 14, 32);
        
        let y = 45;
        for (const [camId, cam] of Object.entries(cameras)) {
          doc.setFontSize(14);
          doc.text(`${cam.name.toUpperCase()} CAMERA`, 14, y);
          y += 8;
          
          doc.setFontSize(10);
          doc.text(`Position (X, Y, Z): ${cam.position[0].toFixed(3)}m, ${cam.position[1].toFixed(3)}m, ${cam.position[2].toFixed(3)}m`, 14, y);
          y += 6;
          doc.text(`Rotation (R, P, Y): ${(cam.rotation[0] * 180 / Math.PI).toFixed(1)}°, ${(cam.rotation[1] * 180 / Math.PI).toFixed(1)}°, ${(cam.rotation[2] * 180 / Math.PI).toFixed(1)}°`, 14, y);
          y += 6;
          doc.text(`FOV (H x V): ${cam.fovH}° x ${cam.fovV}°`, 14, y);
          y += 12;
        }
        
        doc.text('Note: Enter these values into the Brigade PC Calibration Tool.', 14, y + 10);
        
        doc.save('BN360_Calibration_Blueprint.pdf');
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Is OpenCV worker ready?');
    } finally {
      setIsExporting(false);
    }
  };

  const fallbackDownload = (data: string, filename: string, type: string) => {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  return (
    <header className="col-span-full bg-surface border-b border-border flex items-center justify-between px-4">
      <div className="font-mono font-bold tracking-[1px] text-accent">BRIGADE_VCE [v1.0.4]</div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 border border-border bg-bg rounded overflow-hidden">
          <button 
            disabled={past.length === 0}
            onClick={undo}
            className="p-1.5 hover:bg-accent/20 text-text-main disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <div className="w-[1px] h-4 bg-border"></div>
          <button 
            disabled={future.length === 0}
            onClick={redo}
            className="p-1.5 hover:bg-accent/20 text-text-main disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <button 
          onClick={onOpenWiring}
          className="border border-border hover:border-accent bg-bg px-2.5 py-1 text-[11px] rounded text-text transition-colors flex items-center gap-1.5"
        >
          <Network className="w-3.5 h-3.5" />
          LOGIC / WIRING
        </button>

        <span className="bg-accent/10 border border-accent px-2.5 py-1 text-[11px] rounded text-accent">
          SYSTEM: {systemType}
        </span>
        <button 
          onClick={handleExport}
          disabled={isExporting}
          className="bg-accent text-bg border-none px-3 py-1.5 font-bold uppercase text-[11px] cursor-pointer disabled:opacity-50 flex items-center gap-2"
        >
          {isExporting ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          {isExporting ? 'EXPORTING...' : (systemType === 'VBV-360-10000-AI' ? 'GENERATE CALIBRATION XML' : 'GENERATE PDF BLUEPRINT')}
        </button>
      </div>
    </header>
  );
}
