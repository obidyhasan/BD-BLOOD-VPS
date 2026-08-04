"use client";

import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { SOCKET_URL, SOCKET_URLS } from "@/lib/backend";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { notificationsApi } from "@/redux/features/notifications/notificationsApi";

const getSocketBaseUrls = () => (SOCKET_URLS.length ? SOCKET_URLS : [SOCKET_URL]);

let sharedSocket: Socket | null = null;
let sharedSocketToken: string | null = null;
let sharedSocketUrlIndex = 0;

function teardownSharedSocket() {
  if (sharedSocket) {
    sharedSocket.removeAllListeners();
    sharedSocket.disconnect();
  }
  sharedSocket = null;
  sharedSocketToken = null;
}

export function useNotificationSocket(enabled = true) {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.accessToken);

  useEffect(() => {
    if (!enabled || !token) {
      // Logged out (or explicitly disabled): tear down any lingering
      // connection so it isn't left authenticated as a previous user.
      teardownSharedSocket();
      return;
    }

    const socketUrls = getSocketBaseUrls();

    const onNewNotification = () => {
      dispatch(notificationsApi.util.invalidateTags(["Notifications"]));
    };

    const bindSocketEvents = (socket: Socket) => {
      socket.on("connect_error", onConnectError);
      socket.on("notification:new", onNewNotification);
    };

    const unbindSocketEvents = (socket: Socket) => {
      socket.off("connect_error", onConnectError);
      socket.off("notification:new", onNewNotification);
    };

    function connectSocket() {
      const socketUrl = socketUrls[sharedSocketUrlIndex] ?? socketUrls[0];

      sharedSocket = io(socketUrl, {
        auth: { token },
        transports: ["websocket", "polling"],
        autoConnect: true,
      });
      sharedSocketToken = token;
      bindSocketEvents(sharedSocket);
    }

    function onConnectError() {
      if (socketUrls.length <= 1 || !sharedSocket) return;

      unbindSocketEvents(sharedSocket);
      sharedSocket.disconnect();
      sharedSocketUrlIndex = (sharedSocketUrlIndex + 1) % socketUrls.length;
      connectSocket();
    }

    if (!sharedSocket || sharedSocketToken !== token) {
      // No socket yet, or the token has changed since the current one was
      // established (e.g. a different account logged in in this tab).
      // Mutating `.auth` on an already-connected socket wouldn't cause the
      // server to re-validate it, since auth is only checked at the initial
      // handshake — so a real reconnect is required, not just an in-place
      // auth swap.
      teardownSharedSocket();
      connectSocket();
    } else {
      bindSocketEvents(sharedSocket);
      if (!sharedSocket.connected) {
        sharedSocket.connect();
      }
    }

    return () => {
      if (sharedSocket) {
        unbindSocketEvents(sharedSocket);
      }
    };
  }, [dispatch, enabled, token]);
}
