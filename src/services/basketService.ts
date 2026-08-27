import { apiClient } from "@/services/apiClient";
import type {
  AddBasketItemRequest,
  BasketItemResponse,
  BasketResponse,
  UpdateBasketConditionsRequest,
} from "@/types/basket";

function authHeaders(accessToken?: string) {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
}

// 프론트는 duration을 UI 개념인 "박 수"(당일치기=0)로 다루지만, 백엔드는
// "일수"(당일치기=1, 최소 1)로 정의한다(.agents/docs/domain-model.md). 서비스
// 경계에서만 변환해 나머지 화면 코드는 계속 박 수 기준으로 다루게 한다.
export async function updateBasketConditions(
  request: UpdateBasketConditionsRequest,
  accessToken?: string,
): Promise<BasketResponse> {
  const { data } = await apiClient.put<BasketResponse>(
    "/api/v1/baskets/conditions",
    { ...request, duration: request.duration + 1 },
    { headers: authHeaders(accessToken) },
  );
  return {
    ...data,
    conditions: { ...data.conditions, duration: data.conditions.duration - 1 },
  };
}

export async function addBasketItem(
  request: AddBasketItemRequest,
  accessToken?: string,
): Promise<BasketItemResponse> {
  const { data } = await apiClient.post<BasketItemResponse>(
    "/api/v1/baskets/items",
    request,
    { headers: authHeaders(accessToken) },
  );
  return data;
}

// 지금 서버에 저장된 바구니(조건 + 항목)를 그대로 읽어온다. generate 직전에
// 로컬 바구니와 비교해 서버 바구니를 로컬 상태로 맞추는(reconcile) 용도.
export async function getBasket(accessToken?: string): Promise<BasketResponse> {
  const { data } = await apiClient.get<BasketResponse>("/api/v1/baskets", {
    headers: authHeaders(accessToken),
  });
  return data;
}

// 서버 바구니 항목 하나를 지운다. 로컬(클라이언트) 바구니가 유일한
// "진짜" 상태이고, 서버 바구니는 generate 직전에만 맞춰주는 일회용
// 스냅샷이라 로컬에 없는 항목은 여기로 정리한다.
export async function removeBasketItem(
  itemId: string,
  accessToken?: string,
): Promise<void> {
  await apiClient.delete(`/api/v1/baskets/items/${itemId}`, {
    headers: authHeaders(accessToken),
  });
}
