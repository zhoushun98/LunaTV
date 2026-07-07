/* eslint-disable no-console, @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function */
'use client';

/**
 * 仅在浏览器端使用的数据存储工具，基于 localStorage 实现。
 * 收藏、播放记录、搜索历史、跳过片头/片尾配置都只存在访客本机浏览器里。
 */

import { SkipConfig } from './types';

function triggerGlobalError(message: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('globalError', {
        detail: { message },
      })
    );
  }
}

export interface PlayRecord {
  title: string;
  source_name: string;
  year: string;
  cover: string;
  index: number;
  total_episodes: number;
  play_time: number;
  total_time: number;
  save_time: number;
  search_title?: string;
}

export interface Favorite {
  title: string;
  source_name: string;
  year: string;
  cover: string;
  total_episodes: number;
  save_time: number;
  search_title?: string;
  origin?: 'vod' | 'live';
}

const PLAY_RECORDS_KEY = 'moontv_play_records';
const FAVORITES_KEY = 'moontv_favorites';
const SEARCH_HISTORY_KEY = 'moontv_search_history';
const SKIP_CONFIGS_KEY = 'moontv_skip_configs';

const SEARCH_HISTORY_LIMIT = 20;

export function generateStorageKey(source: string, id: string): string {
  return `${source}+${id}`;
}

// ---------------- 播放记录 ----------------

export async function getAllPlayRecords(): Promise<Record<string, PlayRecord>> {
  if (typeof window === 'undefined') return {};

  try {
    const raw = localStorage.getItem(PLAY_RECORDS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, PlayRecord>;
  } catch (err) {
    console.error('读取播放记录失败:', err);
    triggerGlobalError('读取播放记录失败');
    return {};
  }
}

export async function savePlayRecord(
  source: string,
  id: string,
  record: PlayRecord
): Promise<void> {
  if (typeof window === 'undefined') return;

  const key = generateStorageKey(source, id);
  try {
    const allRecords = await getAllPlayRecords();
    allRecords[key] = record;
    localStorage.setItem(PLAY_RECORDS_KEY, JSON.stringify(allRecords));
    window.dispatchEvent(
      new CustomEvent('playRecordsUpdated', { detail: allRecords })
    );
  } catch (err) {
    console.error('保存播放记录失败:', err);
    triggerGlobalError('保存播放记录失败');
    throw err;
  }
}

export async function deletePlayRecord(
  source: string,
  id: string
): Promise<void> {
  if (typeof window === 'undefined') return;

  const key = generateStorageKey(source, id);
  try {
    const allRecords = await getAllPlayRecords();
    delete allRecords[key];
    localStorage.setItem(PLAY_RECORDS_KEY, JSON.stringify(allRecords));
    window.dispatchEvent(
      new CustomEvent('playRecordsUpdated', { detail: allRecords })
    );
  } catch (err) {
    console.error('删除播放记录失败:', err);
    triggerGlobalError('删除播放记录失败');
    throw err;
  }
}

export async function clearAllPlayRecords(): Promise<void> {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PLAY_RECORDS_KEY);
  window.dispatchEvent(
    new CustomEvent('playRecordsUpdated', { detail: {} })
  );
}

// ---------------- 搜索历史 ----------------

export async function getSearchHistory(): Promise<string[]> {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as string[];
    return Array.isArray(arr) ? arr : [];
  } catch (err) {
    console.error('读取搜索历史失败:', err);
    triggerGlobalError('读取搜索历史失败');
    return [];
  }
}

export async function addSearchHistory(keyword: string): Promise<void> {
  if (typeof window === 'undefined') return;

  const trimmed = keyword.trim();
  if (!trimmed) return;

  try {
    const history = await getSearchHistory();
    const newHistory = [trimmed, ...history.filter((k) => k !== trimmed)];
    if (newHistory.length > SEARCH_HISTORY_LIMIT) {
      newHistory.length = SEARCH_HISTORY_LIMIT;
    }
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    window.dispatchEvent(
      new CustomEvent('searchHistoryUpdated', { detail: newHistory })
    );
  } catch (err) {
    console.error('保存搜索历史失败:', err);
    triggerGlobalError('保存搜索历史失败');
  }
}

export async function clearSearchHistory(): Promise<void> {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SEARCH_HISTORY_KEY);
  window.dispatchEvent(
    new CustomEvent('searchHistoryUpdated', { detail: [] })
  );
}

export async function deleteSearchHistory(keyword: string): Promise<void> {
  if (typeof window === 'undefined') return;

  const trimmed = keyword.trim();
  if (!trimmed) return;

  try {
    const history = await getSearchHistory();
    const newHistory = history.filter((k) => k !== trimmed);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    window.dispatchEvent(
      new CustomEvent('searchHistoryUpdated', { detail: newHistory })
    );
  } catch (err) {
    console.error('删除搜索历史失败:', err);
    triggerGlobalError('删除搜索历史失败');
  }
}

// ---------------- 收藏 ----------------

export async function getAllFavorites(): Promise<Record<string, Favorite>> {
  if (typeof window === 'undefined') return {};

  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, Favorite>;
  } catch (err) {
    console.error('读取收藏失败:', err);
    triggerGlobalError('读取收藏失败');
    return {};
  }
}

export async function saveFavorite(
  source: string,
  id: string,
  favorite: Favorite
): Promise<void> {
  if (typeof window === 'undefined') return;

  const key = generateStorageKey(source, id);
  try {
    const allFavorites = await getAllFavorites();
    allFavorites[key] = favorite;
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(allFavorites));
    window.dispatchEvent(
      new CustomEvent('favoritesUpdated', { detail: allFavorites })
    );
  } catch (err) {
    console.error('保存收藏失败:', err);
    triggerGlobalError('保存收藏失败');
    throw err;
  }
}

export async function deleteFavorite(
  source: string,
  id: string
): Promise<void> {
  if (typeof window === 'undefined') return;

  const key = generateStorageKey(source, id);
  try {
    const allFavorites = await getAllFavorites();
    delete allFavorites[key];
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(allFavorites));
    window.dispatchEvent(
      new CustomEvent('favoritesUpdated', { detail: allFavorites })
    );
  } catch (err) {
    console.error('删除收藏失败:', err);
    triggerGlobalError('删除收藏失败');
    throw err;
  }
}

export async function isFavorited(
  source: string,
  id: string
): Promise<boolean> {
  const key = generateStorageKey(source, id);
  const allFavorites = await getAllFavorites();
  return !!allFavorites[key];
}

export async function clearAllFavorites(): Promise<void> {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(FAVORITES_KEY);
  window.dispatchEvent(
    new CustomEvent('favoritesUpdated', { detail: {} })
  );
}

// ---------------- 跳过片头片尾配置 ----------------

export async function getSkipConfig(
  source: string,
  id: string
): Promise<SkipConfig | null> {
  if (typeof window === 'undefined') return null;

  const key = generateStorageKey(source, id);
  try {
    const raw = localStorage.getItem(SKIP_CONFIGS_KEY);
    if (!raw) return null;
    const configs = JSON.parse(raw) as Record<string, SkipConfig>;
    return configs[key] || null;
  } catch (err) {
    console.error('读取跳过片头片尾配置失败:', err);
    triggerGlobalError('读取跳过片头片尾配置失败');
    return null;
  }
}

export async function saveSkipConfig(
  source: string,
  id: string,
  config: SkipConfig
): Promise<void> {
  if (typeof window === 'undefined') return;

  const key = generateStorageKey(source, id);
  try {
    const raw = localStorage.getItem(SKIP_CONFIGS_KEY);
    const configs = raw ? (JSON.parse(raw) as Record<string, SkipConfig>) : {};
    configs[key] = config;
    localStorage.setItem(SKIP_CONFIGS_KEY, JSON.stringify(configs));
    window.dispatchEvent(
      new CustomEvent('skipConfigsUpdated', { detail: configs })
    );
  } catch (err) {
    console.error('保存跳过片头片尾配置失败:', err);
    triggerGlobalError('保存跳过片头片尾配置失败');
    throw err;
  }
}

export async function getAllSkipConfigs(): Promise<Record<string, SkipConfig>> {
  if (typeof window === 'undefined') return {};

  try {
    const raw = localStorage.getItem(SKIP_CONFIGS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, SkipConfig>;
  } catch (err) {
    console.error('读取跳过片头片尾配置失败:', err);
    triggerGlobalError('读取跳过片头片尾配置失败');
    return {};
  }
}

export async function deleteSkipConfig(
  source: string,
  id: string
): Promise<void> {
  if (typeof window === 'undefined') return;

  const key = generateStorageKey(source, id);
  try {
    const raw = localStorage.getItem(SKIP_CONFIGS_KEY);
    if (raw) {
      const configs = JSON.parse(raw) as Record<string, SkipConfig>;
      delete configs[key];
      localStorage.setItem(SKIP_CONFIGS_KEY, JSON.stringify(configs));
      window.dispatchEvent(
        new CustomEvent('skipConfigsUpdated', { detail: configs })
      );
    }
  } catch (err) {
    console.error('删除跳过片头片尾配置失败:', err);
    triggerGlobalError('删除跳过片头片尾配置失败');
    throw err;
  }
}

// ---------------- 兼容旧调用（登出/预加载）----------------

export function clearUserCache(): void {}

export async function preloadUserData(): Promise<void> {}

// ---------------- React Hook 辅助 ----------------

export type CacheUpdateEvent =
  | 'playRecordsUpdated'
  | 'favoritesUpdated'
  | 'searchHistoryUpdated'
  | 'skipConfigsUpdated';

export function subscribeToDataUpdates<T>(
  eventType: CacheUpdateEvent,
  callback: (data: T) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleUpdate = (event: CustomEvent) => {
    callback(event.detail);
  };

  window.addEventListener(eventType, handleUpdate as EventListener);

  return () => {
    window.removeEventListener(eventType, handleUpdate as EventListener);
  };
}
