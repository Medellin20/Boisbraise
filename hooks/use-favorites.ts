'use client';

import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'renl_favorites';
const EMPTY_FAVORITES: string[] = [];
let favorites: string[] = EMPTY_FAVORITES;
let isLoaded = false;
const listeners = new Set<() => void>();

function readStorage() {
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
    favorites = Array.isArray(stored)
      ? Array.from(new Set(stored.filter((id): id is string => typeof id === 'string')))
      : EMPTY_FAVORITES;
  } catch {
    // Conserver les favoris en mémoire si le stockage est indisponible.
  }
  isLoaded = true;
}

function notify() {
  listeners.forEach((listener) => listener());
}

function handleStorage(event: StorageEvent) {
  if (event.key !== STORAGE_KEY && event.key !== null) return;
  readStorage();
  notify();
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) {
    readStorage();
    window.addEventListener('storage', handleStorage);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener('storage', handleStorage);
  };
}

function toggleFavorite(propertyId: string) {
  readStorage();
  favorites = favorites.includes(propertyId)
    ? favorites.filter((id) => id !== propertyId)
    : [...favorites, propertyId];
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // Les boutons restent synchronisés même sans localStorage.
  }
  notify();
}

/** Favoris partagés entre les boutons et synchronisés entre les onglets. */
export function useFavorites() {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => isLoaded ? favorites : null,
    () => null
  );
  const currentFavorites = snapshot ?? EMPTY_FAVORITES;
  const isFavorite = useCallback(
    (propertyId: string) => currentFavorites.includes(propertyId),
    [currentFavorites]
  );

  return { favorites: currentFavorites, isFavorite, toggleFavorite, isLoaded: snapshot !== null };
}
