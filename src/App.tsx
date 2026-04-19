/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { View } from '@react-three/drei';
import Sidebar from './components/Sidebar';
import Scene from './components/Scene';
import CameraViews from './components/CameraViews';
import Header from './components/Header';
import Footer from './components/Footer';
import KeyboardManager from './components/KeyboardManager';
import WiringDiagram from './components/WiringDiagram';
import { initWorker } from './opencvHelper';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showWiring, setShowWiring] = useState(false);

  useEffect(() => {
    initWorker();
  }, []);

  return (
    <div ref={containerRef} className="h-screen w-screen overflow-hidden bg-bg text-text-main font-sans grid grid-rows-[48px_1fr_32px] grid-cols-[280px_1fr_240px]">
      <KeyboardManager />
      <Header onOpenWiring={() => setShowWiring(true)} />
      <Sidebar />
      <main className="relative flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,#1a1a20_0%,#0f0f11_100%)]">
        <Scene />
        <div className="absolute bottom-5 left-5 text-text-dim text-[10px] font-mono pointer-events-none">
            RAYCAST_ENGINE: ACTIVE<br/>
            SURFACE_NORMAL_ALIGN: ENABLED<br/>
            COORDINATE_SYSTEM: RH (THREE.JS)
        </div>
      </main>
      <CameraViews />
      <Footer />
      
      {showWiring && <WiringDiagram onClose={() => setShowWiring(false)} />}
      
      <Canvas
        eventSource={containerRef}
        className="pointer-events-none"
        style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 100 }}
      >
        <View.Port />
      </Canvas>
    </div>
  );
}
