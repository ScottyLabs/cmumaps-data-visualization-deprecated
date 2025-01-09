import { useEffect } from "react";

import { useAppSelector } from "../lib/hooks";

/**
 * Note shortcutsDisabled is applied!
 */
const useKeyboardShortcuts = (
  handleKeyDown: (event: KeyboardEvent) => void
) => {
  const shortcutsDisabled = useAppSelector(
    (state) => state.status.shortcutsDisabled
  );

  useEffect(() => {
    if (shortcutsDisabled) {
      return;
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown, shortcutsDisabled]);
};

export default useKeyboardShortcuts;
