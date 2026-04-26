'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const noop = () => {};

const BreadcrumbLabelsContext = createContext({
  labels: {},
  registerLabel: noop,
  unregisterLabel: noop,
});

export function BreadcrumbLabelsProvider({ children }) {
  const [labels, setLabels] = useState({});

  const registerLabel = useCallback((path, label) => {
    if (!path || !label) {
      return;
    }

    setLabels((prev) => (prev[path] === label ? prev : { ...prev, [path]: label }));
  }, []);

  const unregisterLabel = useCallback((path) => {
    if (!path) {
      return;
    }

    setLabels((prev) => {
      if (!(path in prev)) {
        return prev;
      }

      const next = { ...prev };
      delete next[path];
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      labels,
      registerLabel,
      unregisterLabel,
    }),
    [labels, registerLabel, unregisterLabel]
  );

  return <BreadcrumbLabelsContext.Provider value={value}>{children}</BreadcrumbLabelsContext.Provider>;
}

export function useBreadcrumbLabels() {
  return useContext(BreadcrumbLabelsContext);
}

export function useBreadcrumbLabel(path, label) {
  const { registerLabel, unregisterLabel } = useBreadcrumbLabels();

  useEffect(() => {
    if (!path || !label) {
      return undefined;
    }

    registerLabel(path, label);
    return () => unregisterLabel(path);
  }, [label, path, registerLabel, unregisterLabel]);
}
