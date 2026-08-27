import { useState, useCallback } from "react";

export function useHistory(initialState) {
  const [timeline, setTimeline] = useState({
    history: [initialState],
    index: 0,
  });

  const { history, index } = timeline;
  const state = history[index];

  const set = useCallback(
    (newState) => {
      setTimeline((prev) => {
        const trimmed = prev.history.slice(0, prev.index + 1);
        const currentState = prev.history[prev.index];
        const nextState =
          typeof newState === "function"
            ? newState(currentState)
            : newState;
        return { history: [...trimmed, nextState], index: prev.index + 1 };
      });
    },
    []
  );

  const undo = useCallback(() => {
    setTimeline((prev) => ({
      ...prev,
      index: Math.max(0, prev.index - 1),
    }));
  }, []);

  const redo = useCallback(() => {
    setTimeline((prev) => ({
      ...prev,
      index: Math.min(prev.history.length - 1, prev.index + 1),
    }));
  }, []);

  return {
    state,
    set,
    undo,
    redo,
    canUndo: index > 0,
    canRedo: index < history.length - 1,
  };
}