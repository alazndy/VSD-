/// <reference lib="webworker" />

// We load OpenCV.js from a CDN
importScripts('https://docs.opencv.org/4.8.0/opencv.js');

declare var cv: any;

self.onmessage = function (e) {
  const { type, payload, id } = e.data;

  if (type === 'INIT') {
    // Wait for OpenCV to be ready
    if (cv.getBuildInformation) {
      self.postMessage({ type: 'INIT_DONE' });
    } else {
      cv['onRuntimeInitialized'] = () => {
        self.postMessage({ type: 'INIT_DONE' });
      };
    }
  } else if (type === 'CALCULATE_EXTRINSICS') {
    const { cameras } = payload;
    
    try {
      const results: Record<string, any> = {};
      
      // 4x4 Transformation Matrix from WebGL (Y-up, Z-back) to OpenCV (Y-down, Z-forward)
      // [ 1,  0,  0,  0]
      // [ 0, -1,  0,  0]
      // [ 0,  0, -1,  0]
      // [ 0,  0,  0,  1]
      const T_webgl_to_cv = [
        [1, 0, 0, 0],
        [0, -1, 0, 0],
        [0, 0, -1, 0],
        [0, 0, 0, 1]
      ];
      
      for (const [camId, cam] of Object.entries(cameras) as [string, any][]) {
        // 1. Axis Transformation (Three.js to OpenCV) using 4x4 matrix
        const pos = [cam.position[0], cam.position[1], cam.position[2], 1];
        const translatedPos = [
          T_webgl_to_cv[0][0]*pos[0] + T_webgl_to_cv[0][1]*pos[1] + T_webgl_to_cv[0][2]*pos[2] + T_webgl_to_cv[0][3]*pos[3],
          T_webgl_to_cv[1][0]*pos[0] + T_webgl_to_cv[1][1]*pos[1] + T_webgl_to_cv[1][2]*pos[2] + T_webgl_to_cv[1][3]*pos[3],
          T_webgl_to_cv[2][0]*pos[0] + T_webgl_to_cv[2][1]*pos[1] + T_webgl_to_cv[2][2]*pos[2] + T_webgl_to_cv[2][3]*pos[3]
        ];
        
        // 2. Rodrigues Conversion
        // We expect cam.rotationMatrix to be a 9-element array (3x3 matrix in column-major or row-major)
        // Let's assume row-major from Three.js
        let rvec = [0, 0, 0];
        
        if (cv && cv.Mat && cam.rotationMatrix) {
          // Transform the rotation matrix as well
          // R_cv = T_rot * R_gl * T_rot^-1
          // Since T_rot is its own inverse for this specific reflection:
          const R_gl = cam.rotationMatrix;
          const R_cv = [
            R_gl[0], -R_gl[1], -R_gl[2],
            -R_gl[3], R_gl[4], R_gl[5],
            -R_gl[6], R_gl[7], R_gl[8]
          ];

          const R = cv.matFromArray(3, 3, cv.CV_64F, R_cv);
          const rvecMat = new cv.Mat();
          cv.Rodrigues(R, rvecMat);
          
          rvec = [
            rvecMat.doublePtr(0, 0)[0],
            rvecMat.doublePtr(1, 0)[0],
            rvecMat.doublePtr(2, 0)[0]
          ];
          
          R.delete();
          rvecMat.delete();
        }
        
        results[camId] = {
          translate: translatedPos,
          rotate: rvec,
          K: [
            [500, 0, 320],
            [0, 500, 240],
            [0, 0, 1]
          ],
          OutTrigle: [0, 0, 0, 0] // Placeholder
        };
      }
      
      self.postMessage({ type: 'CALCULATION_DONE', id, payload: results });
    } catch (error) {
      self.postMessage({ type: 'ERROR', id, error: String(error) });
    }
  }
};
