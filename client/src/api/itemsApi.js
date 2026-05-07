// 서버 API 클라이언트
// - 모든 호출은 /api/* 로 보내고, Vite dev 서버의 프록시로 백엔드(4000) 에 도달한다.
// - 서버 응답은 이미 평탄화된 형태({ id, name, categoryId, image, quantity, status, ... })
//   라서 그대로 클라이언트 상태로 사용할 수 있다.

const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : '/api';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function parseJsonOrThrow(res) {
  if (res.status === 204) return null;
  let body;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  if (!res.ok) {
    const message = body?.message || `요청 실패 (${res.status})`;
    throw new ApiError(message, res.status);
  }
  return body;
}

async function jsonRequest(method, path, payload) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
  return parseJsonOrThrow(res);
}

// 품목 목록 조회 (전체 또는 카테고리별)
export function listItems(categoryId) {
  const qs = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : '';
  return jsonRequest('GET', `/items${qs}`);
}

// 새 품목 생성
export function createItem(payload) {
  return jsonRequest('POST', '/items', payload);
}

// 품목 수정 (이름/카테고리/이미지/수량 등)
export function updateItem(id, payload) {
  return jsonRequest('PUT', `/items/${encodeURIComponent(id)}`, payload);
}

// 품목 삭제
export function deleteItem(id) {
  return jsonRequest('DELETE', `/items/${encodeURIComponent(id)}`);
}

// 수량만 빠르게 변경 (스피너용)
export function updateStock(itemId, quantity) {
  return jsonRequest('PUT', `/stocks/${encodeURIComponent(itemId)}`, {
    quantity,
  });
}

// 이미지 파일을 서버로 업로드 → 서버가 Cloudinary 로 보낸 뒤 { url, publicId } 반환
export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch(`${API_BASE}/uploads/image`, {
    method: 'POST',
    body: formData,
  });
  return parseJsonOrThrow(res);
}

export { ApiError };
