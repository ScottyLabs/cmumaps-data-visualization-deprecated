export const ALWAYS_REGENERATE = false;
export const TEST_WALKWAYS = false;
export const SHOW_REGENERATE_BUTTON = false;
export const DEFAULT_PDF_SCALE_INDEX = 0;
export const LIVEBLOCKS_ENABLED = process.env.NODE_ENV === "production";
const WEBSOCKET_DEV_ENABLED = false;
export const WEBSOCKET_ENABLED =
  process.env.NODE_ENV === "production" || WEBSOCKET_DEV_ENABLED;
const CURSOR_SHARING_DEV_ENABLED = false;
export const CURSOR_SHARING_ENABLED =
  WEBSOCKET_ENABLED && CURSOR_SHARING_DEV_ENABLED;
