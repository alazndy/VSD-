# 🚚 Brigade Virtual Calibration Engine (VCE)

![React](https://img.shields.io/badge/React-19.0-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)
![Three.js](https://img.shields.io/badge/Three.js-Fiber-black?style=flat-square&logo=three.js)
![Zustand](https://img.shields.io/badge/State-Zustand-brown?style=flat-square)
![React Flow](https://img.shields.io/badge/Nodes-React%20Flow-ff0072?style=flat-square)
![OpenCV](https://img.shields.io/badge/Math-OpenCV.js-green?style=flat-square&logo=opencv)

**Brigade VCE** is an advanced, browser-based 3D simulation and configuration environment designed to plan, simulate, and calibrate Brigade Electronics equipment (such as 360° Surround View Cameras, Ultrasonic Sensors, Radars, and ECUs) on heavy commercial vehicles *before* actual physical installation.

## ✨ Key Features

*   **🏎️ 3D Vehicle Simulation:** Use the default procedural commercial box truck or upload your own exact vehicle models in **STL, OBJ, or FBX** formats. Accurately scale dimensions to match real-world specifications.
*   **📷 Surround View Calibration (360°):** Position 4 ultra-wide angle cameras (Front, Rear, Left, Right). The system auto-generates virtual calibration mats on the ground.
*   **🧮 OpenCV WebWorker Math:** Runs complex intrinsic/extrinsic extrinsic camera calibration algorithms entirely in the browser (via `opencv.js` web worker) to generate real-world rotation and translation matrices.
*   **📡 Sensor Coverage Simulation:** Map out the blind spots! Add custom Ultrasonics (UDS) and Radars (Backsense) to visualize horizontal and vertical beam angles, detecting constraints visually.
*   **⛓️ Logic & Wiring Node Editor:** A drag-and-drop React Flow interface. Visually wire physical triggers (Reverse Gear, Indicators) to ECUs, Cameras, and Buzzers/Alarms to map out the vehicle's electrical schematic.
*   **💾 State Management & History:** Powered by Zustand. Full support for Undo/Redo (`Ctrl+Z`, `Ctrl+Y`) across 3D positioning and 2D wiring changes.
*   **📑 Hardware-Ready Exports:**
    *   **VBV-360-10000-AI:** Exports a fully formatted `Calibration_Configure.xml` ready to be loaded via USB into the ECU.
    *   **BN360-300:** Generates high-quality PDF blueprints containing exact X/Y/Z mounting coordinates and angles for technicians.

## 🛠️ Tech Stack

*   **Frontend Framework:** React 19 + Vite
*   **Styling:** Tailwind CSS V4
*   **3D Engine:** Three.js + React Three Fiber (`@react-three/fiber`) + Drei (`@react-three/drei`)
*   **State Management:** Zustand
*   **Node/Wiring UI:** React Flow (`@xyflow/react`)
*   **Computer Vision:** OpenCV.js (via asynchronous Web Workers)
*   **PDF Generation:** jsPDF

## 🚀 Getting Started

### Prerequisites

Ensure you have Node.js (v18+) installed.

### Installation

1. Clone the repository and navigate into the folder.
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:3000`.

## 🕹️ Usage Guide

1. **Configure Vehicle:** From the right-hand sidebar, upload your 3D vehicle model or use the default box truck. Enter the correct Width/Length/Height dimensions (in meters) and apply to scale it accurately.
2. **Add Vision & Sensors:** 
   * Click **"Equip 360 Surround View"** to spawn the 4 main cameras and calibration mats.
   * Add Radars or UDS-CAN-ECU ultrasonics to cover blind spots.
3. **Positioning:** Use the 3D Gizmo (Translate / Rotate modes selectable from the sidebar) to position hardware safely away from obstacles on the vehicle body. Check individual camera feeds in the top-right corner.
4. **Wiring & Logic:** Click the **"LOGIC / WIRING"** button in the top header. Drag nodes to connect triggers (e.g., Reverse Gear) to Cameras and Monitors to establish electrical workflows.
5. **Generate File:** Select your target ECU hardware format (e.g., VBV-360-10000-AI) and click **"GENERATE CALIBRATION"**. The system mathematically calculates the matrices and downloads the ECU file.

## 📂 Project Structure

```text
src/
├── components/
│   ├── VehicleModel.tsx     # 3D Mesh loading & procedural generation
│   ├── Scene.tsx            # Main Three.js R3F Canvas & Lighting
│   ├── DraggableCamera.tsx  # 3D Gizmo logic for cameras
│   ├── DraggableSensor.tsx  # 3D Gizmo logic and beam cones for sensors
│   ├── WiringDiagram.tsx    # React Flow Logic UI
│   ├── CalibrationMats.tsx  # Floor targets based on vehicle size
│   └── Header/Sidebar/Footer# UI Overlays
├── store.ts                 # Zustand Global State (Sensors, Cameras, Wiring, Undo/Redo)
├── opencvHelper.ts          # WebWorker interface for heavy CV computation
├── cv.worker.ts             # WebWorker thread loading opencv.js for calibration
└── App.tsx                  # Application Entry Point & Layout Grid
```

## 📝 License & Notes

*   **OpenCV.js:** Loaded dynamically inside a Web Worker. Large initial fetch, but cached for subsequent uses.
*   **Three.js Coordinate System:** The project uses a Right-Handed (RH) coordinate system (Y is up, -Z is forward). Mat calculations invert these to align with typical camera calibration spaces where Z is depth.
