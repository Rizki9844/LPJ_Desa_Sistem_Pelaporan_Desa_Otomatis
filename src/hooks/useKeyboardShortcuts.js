import { useEffect } from 'react';

/**
 * useKeyboardShortcuts — Global keyboard shortcuts for productivity.
 * @param {Object} shortcuts - Map of key combos to handlers
 * 
 * Usage:
 *   useKeyboardShortcuts({
 *     'ctrl+s': handleSave,
 *     'escape': handleClose,
 *   });
 */
export default function useKeyboardShortcuts(shortcuts = {}) {
    useEffect(() => {
        function handler(e) {
            const key = e.key.toLowerCase();
            const ctrl = e.ctrlKey || e.metaKey;
            const shift = e.shiftKey;

            let combo = '';
            if (ctrl) combo += 'ctrl+';
            if (shift) combo += 'shift+';
            combo += key;

            if (shortcuts[combo]) {
                e.preventDefault();
                shortcuts[combo](e);
            }
        }

        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [shortcuts]);
}
