export const CATEGORIES = [
  { id: 'cosmetics', label: '화장품', emoji: '💄' },
  { id: 'bathroom', label: '세면용품', emoji: '🧼' },
  { id: 'tissue', label: '휴지', emoji: '🧻' },
  { id: 'laundry', label: '세탁용품', emoji: '🧺' },
  { id: 'kitchen', label: '주방용품', emoji: '🍽️' },
];

// "전체" 가상 카테고리. 실제 품목에는 이 categoryId 가 들어가지 않고,
// 화면에서 모든 카테고리의 품목을 한 번에 보여줄 때만 사용한다.
export const ALL_CATEGORY_ID = 'all';
export const ALL_CATEGORY = { id: ALL_CATEGORY_ID, label: '전체', emoji: '🗂️' };

export function getCategoryById(id) {
  if (id === ALL_CATEGORY_ID) return ALL_CATEGORY;
  return CATEGORIES.find((c) => c.id === id);
}
