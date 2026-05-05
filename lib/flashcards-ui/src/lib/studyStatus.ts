import { useCallback, useEffect, useState } from "react";

export type StudyStatus = "known" | "learning";

const STORAGE_KEY = "lexo.studyStatus.v1";

type StatusMap = Record<number, StudyStatus>;

function readStorage(): StatusMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as StatusMap) : {};
  } catch {
    return {};
  }
}

function writeStorage(map: StatusMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

const listeners = new Set<(map: StatusMap) => void>();
let cache: StatusMap | null = null;

function getMap(): StatusMap {
  if (cache === null) cache = readStorage();
  return cache;
}

function emit(): void {
  const m = getMap();
  for (const fn of listeners) fn(m);
}

export function useStudyStatus(): {
  statusMap: StatusMap;
  setStatus: (id: number, status: StudyStatus | null) => void;
  countByStatus: (status: StudyStatus) => number;
  getStatus: (id: number) => StudyStatus | undefined;
  clearAll: () => void;
} {
  const [statusMap, setStatusMap] = useState<StatusMap>(() => getMap());

  useEffect(() => {
    const fn = (m: StatusMap) => setStatusMap({ ...m });
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);

  const setStatus = useCallback((id: number, status: StudyStatus | null) => {
    const m = { ...getMap() };
    if (status === null) {
      delete m[id];
    } else {
      m[id] = status;
    }
    cache = m;
    writeStorage(m);
    emit();
  }, []);

  const countByStatus = useCallback(
    (status: StudyStatus) =>
      Object.values(statusMap).filter((s) => s === status).length,
    [statusMap],
  );

  const getStatus = useCallback(
    (id: number) => statusMap[id],
    [statusMap],
  );

  const clearAll = useCallback(() => {
    cache = {};
    writeStorage({});
    emit();
  }, []);

  return { statusMap, setStatus, countByStatus, getStatus, clearAll };
}
