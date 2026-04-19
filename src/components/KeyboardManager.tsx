import { useEffect } from 'react';
import { useStore } from '../store';

export default function KeyboardManager() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events if the user is typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const state = useStore.getState();

      // Undo -> Ctrl/Cmd + Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          state.redo();
        } else {
          state.undo();
        }
        e.preventDefault();
        return;
      }
      
      // Redo -> Ctrl/Cmd + Y
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        state.redo();
        e.preventDefault();
        return;
      }

      switch (e.key.toLowerCase()) {
        case 't': // Move (Translate)
        case 'm': // Move (M key alternative)
        case 'w': // Move (W key unity standard)
          state.setGizmoMode('translate');
          break;
        case 'r': // Rotate
        case 'e': // Rotate (E key unity standard)
          state.setGizmoMode('rotate');
          break;
        case 'escape': // Deselect camera
          state.setSelectedObjectId(null);
          break;
        case '1':
          if (state.cameras.front) state.setSelectedObjectId('front');
          break;
        case '2':
          if (state.cameras.rear) state.setSelectedObjectId('rear');
          break;
        case '3':
          if (state.cameras.left) state.setSelectedObjectId('left');
          break;
        case '4':
          if (state.cameras.right) state.setSelectedObjectId('right');
          break;
        case 's': // Toggle system
          const newSystem = state.systemType === 'VBV-360-10000-AI' ? 'BN360-300' : 'VBV-360-10000-AI';
          state.setSystemType(newSystem);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return null;
}
