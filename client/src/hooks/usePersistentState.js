import { useEffect, useRef, useState } from 'react';

function readFromStorage(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[usePersistentState] failed to read "${key}"`, err);
    return fallback;
  }
}

function writeToStorage(key, value) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[usePersistentState] failed to write "${key}"`, err);
  }
}

export default function usePersistentState(key, initialValue) {
  const [state, setState] = useState(() =>
    readFromStorage(
      key,
      typeof initialValue === 'function' ? initialValue() : initialValue,
    ),
  );

  const keyRef = useRef(key);
  useEffect(() => {
    keyRef.current = key;
  }, [key]);

  useEffect(() => {
    writeToStorage(keyRef.current, state);
  }, [state]);

  return [state, setState];
}
