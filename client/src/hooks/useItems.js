// 서버 API 와 React 상태를 잇는 훅
// - 마운트 시 GET /api/items
// - mutation 들은 "낙관적 업데이트"로 UI 를 즉시 반영하고, 서버 응답을 받아 다시 동기화한다.
// - 실패하면 직전 상태로 롤백한다.

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  listItems,
  createItem as apiCreateItem,
  updateItem as apiUpdateItem,
  deleteItem as apiDeleteItem,
  updateStock as apiUpdateStock,
} from '../api/itemsApi';

// 낙관적 업데이트용 임시 ID. 서버 응답을 받으면 진짜 _id 로 교체한다.
function makeTempId() {
  return `temp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// 서버의 status 표기('충분/부족/소진')를 클라이언트 표기('넉넉해요/부족해요/소진')로 변환.
// 클라이언트 ItemCard 가 기존 라벨을 기대하기 때문에 한 곳에서 통일.
function toClientStatus(serverStatus) {
  if (serverStatus === '충분') return '넉넉해요';
  if (serverStatus === '부족') return '부족해요';
  return '소진';
}

function clampThreshold(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return 1;
  return Math.min(99, Math.max(1, Math.round(n)));
}

function normalizeItem(serverItem) {
  if (!serverItem) return null;
  const th = clampThreshold(serverItem.lowStockThreshold ?? 1);
  return {
    ...serverItem,
    lowStockThreshold: th,
    notes: serverItem.notes || '',
    status: toClientStatus(serverItem.status),
  };
}

function statusFromQuantity(quantity, lowStockThreshold = 1) {
  const q = Number(quantity) || 0;
  const t = clampThreshold(lowStockThreshold);
  if (q <= 0) return '소진';
  if (q <= t) return '부족해요';
  return '넉넉해요';
}

export default function useItems() {
  const [items, setItems] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listItems();
      if (!isMountedRef.current) return;
      setItems(data.map(normalizeItem));
      setError(null);
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // 새 품목 추가 (낙관적 업데이트)
  const addItem = useCallback(async ({
    name,
    categoryId,
    unit,
    quantity,
    image,
    imagePublicId,
    lowStockThreshold,
    notes,
  }) => {
    const tempId = makeTempId();
    const th = clampThreshold(lowStockThreshold ?? 1);
    const optimistic = {
      id: tempId,
      name,
      categoryId,
      unit: unit || '개',
      quantity,
      lowStockThreshold: th,
      notes: notes ? String(notes).slice(0, 500) : '',
      status: statusFromQuantity(quantity, th),
      image: image || null,
      imagePublicId: imagePublicId || null,
    };
    setItems((prev) => [...prev, optimistic]);

    try {
      const created = await apiCreateItem({
        name,
        categoryId,
        unit,
        quantity,
        image,
        imagePublicId,
        lowStockThreshold: th,
        notes: optimistic.notes,
      });
      const next = normalizeItem(created);
      setItems((prev) => prev.map((it) => (it.id === tempId ? next : it)));
      return next;
    } catch (err) {
      setItems((prev) => prev.filter((it) => it.id !== tempId));
      throw err;
    }
  }, []);

  // 품목 정보 수정 (이름/카테고리/이미지/수량 통합)
  const editItem = useCallback(async (id, payload) => {
    let snapshot = null;
    setItems((prev) => {
      snapshot = prev;
      return prev.map((it) => {
        if (it.id !== id) return it;
        const th =
          payload.lowStockThreshold !== undefined
            ? clampThreshold(payload.lowStockThreshold)
            : clampThreshold(it.lowStockThreshold ?? 1);
        const nextQuantity =
          payload.quantity !== undefined ? payload.quantity : it.quantity;
        return {
          ...it,
          ...payload,
          lowStockThreshold: th,
          notes:
            payload.notes !== undefined ? String(payload.notes).slice(0, 500) : it.notes,
          status:
            payload.quantity !== undefined || payload.lowStockThreshold !== undefined
              ? statusFromQuantity(nextQuantity, th)
              : it.status,
        };
      });
    });

    try {
      const updated = await apiUpdateItem(id, payload);
      const next = normalizeItem(updated);
      setItems((prev) => prev.map((it) => (it.id === id ? next : it)));
      return next;
    } catch (err) {
      if (snapshot) setItems(snapshot);
      throw err;
    }
  }, []);

  // 수량만 변경 (스피너용 빠른 경로)
  const changeQuantity = useCallback(async (id, nextQuantity) => {
    let snapshot = null;
    setItems((prev) => {
      snapshot = prev;
      return prev.map((it) => {
        if (it.id !== id) return it;
        const th = clampThreshold(it.lowStockThreshold ?? 1);
        return {
          ...it,
          quantity: nextQuantity,
          status: statusFromQuantity(nextQuantity, th),
        };
      });
    });

    try {
      const updated = await apiUpdateStock(id, nextQuantity);
      const next = normalizeItem(updated);
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...next } : it)));
    } catch (err) {
      if (snapshot) setItems(snapshot);
      throw err;
    }
  }, []);

  // 품목 삭제
  const removeItem = useCallback(async (id) => {
    let snapshot = null;
    setItems((prev) => {
      snapshot = prev;
      return prev.filter((it) => it.id !== id);
    });
    try {
      await apiDeleteItem(id);
    } catch (err) {
      if (snapshot) setItems(snapshot);
      throw err;
    }
  }, []);

  return {
    items,
    isLoading,
    error,
    refresh,
    addItem,
    editItem,
    changeQuantity,
    removeItem,
  };
}
