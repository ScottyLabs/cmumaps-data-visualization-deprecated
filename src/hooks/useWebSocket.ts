import { useAuth, useUser } from "@clerk/nextjs";

import { useEffect, useRef } from "react";

import { useAppDispatch } from "../lib/hooks";
import { WEBSOCKET_JOIN } from "../lib/webSocketMiddleware";
import { WEBSOCKET_ENABLED } from "../settings";

const useWebSocket = (floorCode: string | null) => {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const dispatch = useAppDispatch();

  // Ref to prevent the calling twice in Strict Mode
  const hasMounted = useRef(false);

  // join WebSocket
  useEffect(() => {
    // Skip if Strict Mode is calling twice in development
    if (hasMounted.current || !WEBSOCKET_ENABLED || !user?.firstName) {
      return;
    }

    hasMounted.current = true;

    (async () => {
      const token = await getToken();
      const url = `${process.env.NEXT_PUBLIC_WEBSOCKET_URL}?userName=${user?.firstName || ""}&floorCode=${floorCode}&token=${token}`;
      dispatch({
        type: WEBSOCKET_JOIN,
        payload: { url, floorCode },
      });
    })();
    // No need to refresh the token when session changes since
    // only used to establish connection with the WebSocket
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, isLoaded, user?.firstName]);
};

export default useWebSocket;
