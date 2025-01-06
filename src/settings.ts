export const ALWAYS_REGENERATE = false;
export const TEST_WALKWAYS = false;
export const SHOW_REGENERATE_BUTTON = false;
export const DEFAULT_PDF_SCALE_INDEX = 0;
export const LIVEBLOCKS_ENABLED = process.env.NODE_ENV === "production";

const WEBSOCKET_DEV_ENABLED = true;
export const WEBSOCKET_ENABLED =
  process.env.NODE_ENV === "production" || WEBSOCKET_DEV_ENABLED;
const LIVE_CURSORS_DEV_ENABLED = false;
export const LIVE_CURSORS_ENABLED = true;
// WEBSOCKET_ENABLED && LIVE_CURSORS_DEV_ENABLED;
