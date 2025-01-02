import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import { SAVED, SaveStatus } from "../../lib/features/statusSlice";

/**
 * A wrapper that asks for confirmation if not saved before navigating to url
 *
 * @param url
 * @param saveStatus
 * @param router
 */
export const leavePage = (
  url: string,
  saveStatus: SaveStatus,
  router: AppRouterInstance
) => {
  if (saveStatus === SAVED) {
    router.push(url);
    return;
  }

  const message = "You have unsaved changes. Are you sure you want to leave?";
  if (window.confirm(message)) {
    router.push(url);
  }
};
