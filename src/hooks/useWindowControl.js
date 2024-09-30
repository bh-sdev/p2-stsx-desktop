import { useEffect, useRef, useState } from 'react';

const useWindowControl = (name, focusEvent = true) => {
  const [activeActions, setActiveActions] = useState(true);
  const [blockedAll, setBlockedAll] = useState(false);
  const [isBlockedAction, setIsBlockedAction] = useState(false);
  const [haveChanges, setHaveChanges] = useState(false);
  const [receivedData, setReceivedData] = useState(null);
  const broadcast = useRef(new BroadcastChannel(name));
  useEffect(() => {
    broadcast.current.postMessage({ new: true });
  }, []);

  useEffect(() => {
    const focus = () => {
      if (focusEvent) {
        setActiveActions(true);
        broadcast.current.postMessage({ name: window.name });
      }
    };
    const beforeunload = () => {
      broadcast.current.postMessage({ name: window.name, reset: true });
    };
    if (!blockedAll) {
      window.addEventListener('focus', focus);
      window.addEventListener('beforeunload', beforeunload);
    }
    broadcast.current.onmessage = (e) => {
      if (e.data.changed) {
        setHaveChanges(true);
      }
      if (e.data.customData) {
        setReceivedData(e.data.customData);
      }
      if (e.data.new && isBlockedAction) {
        broadcast.current.postMessage({ name: window.name, status: true });
      } else {
        if (e.data.name !== window.name) {
          if (e.data.reset !== undefined) {
            setBlockedAll(false);
            setActiveActions(true);
          } else {
            if (e.data.status !== undefined) {
              setBlockedAll(e.data.status);
            }
            setActiveActions(false);
          }
        }
      }
    };
    return () => {
      window.removeEventListener('focus', focus);
      window.removeEventListener('beforeunload', beforeunload);
    };
  }, [blockedAll, isBlockedAction]);

  const sendPost = (data) => {
    setIsBlockedAction(!!data?.status);
    broadcast.current.postMessage({ name: window.name, ...data });
  };

  return {
    blockedAll,
    activeActions,
    sendPost,
    setHaveChanges,
    haveChanges,
    receivedData,
    setReceivedData,
  };
};

export default useWindowControl;
