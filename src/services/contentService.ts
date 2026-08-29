import { splitPageSizeAcrossRegions } from "@/lib/content";
import {
  CONTENT_IMAGE_OVERRIDES,
  overrideContentImage,
  overrideContentName,
} from "@/lib/contentOverrides";
import type {
  Content,
  ContentCategory,
  ContentDetail,
  ContentsResponse,
} from "@/types/content";
import type { Region } from "@/types/region";

import { apiClient } from "./apiClient";

export interface GetContentsParams {
  regions: string[];
  startDate: string;
  nights: number;
  companions?: string[];
  // "더보기" 페이지네이션용. 둘 다 없으면 백엔드 기본값(0페이지, 지역당 20개)을 쓴다.
  page?: number;
  size?: number;
}

// 백엔드 /api/v1/contents 목록 응답의 실제 필드 구조.
interface RawContentItem {
  contentId: string;
  title: string;
  address: string;
  firstImage: string;
  category?: ContentCategory;
  summary?: string | null;
  indoor?: boolean;
}

interface RawContentsResponse {
  totalCount: number;
  items: RawContentItem[];
}

function toContent(item: RawContentItem, region: Region): Content {
  return {
    id: item.contentId,
    name: overrideContentName(item.contentId, item.title),
    region,
    category: item.category,
    imageUrl: overrideContentImage(item.contentId, item.firstImage || null),
    address: item.address,
    summary: item.summary ?? undefined,
    indoor: item.indoor,
  };
}

// 백엔드가 region을 한 번에 하나만 받으므로, 선택된 지역마다 따로 호출해 합친다.
// size가 주어지면 지역별로 쪼개(splitPageSizeAcrossRegions) 한 페이지 합계가
// 정확히 size가 되게 한다 — 모든 지역에 같은 size를 주면 size × 지역 수개가 온다.
export async function getContents(
  params: GetContentsParams,
): Promise<ContentsResponse> {
  const regionSizes =
    params.size !== undefined
      ? splitPageSizeAcrossRegions(params.size, params.regions.length)
      : undefined;

  const responses = await Promise.all(
    params.regions.map((region, i) => {
      const query = new URLSearchParams({
        region,
        startDate: params.startDate,
        nights: String(params.nights),
      });

      if (params.companions && params.companions.length > 0) {
        query.set("companions", params.companions.join(","));
      }
      if (params.page !== undefined) query.set("page", String(params.page));
      if (regionSizes) query.set("size", String(regionSizes[i]));

      return apiClient
        .get<RawContentsResponse>(`/api/v1/contents?${query.toString()}`)
        .then((res) => res.data);
    }),
  );

  const contents = responses.flatMap((res, i) =>
    res.items.map((item) => toContent(item, params.regions[i] as Region)),
  );
  const total = responses.reduce((sum, res) => sum + res.totalCount, 0);

  return { contents, total };
}

// 백엔드 /api/v1/contents/{id} 상세 응답의 실제 필드 구조.
interface RawContentDetail {
  contentId: string;
  title: string;
  address: string;
  summary: string;
  useTime: string | null;
  restDate: string | null;
  parking: string | null;
  stayDuration: string | null;
  reservationRequired: boolean | null;
  dataSource: string | null;
  images: { imageUrl: string; title: string }[];
  category?: ContentCategory;
  indoor?: boolean;
  region: Region;
  latitude: number;
  longitude: number;
}

function toParkingAvailable(parking: string | null): boolean | null {
  if (!parking) return null;
  return !parking.includes("불가");
}

function toContentDetail(raw: RawContentDetail): ContentDetail {
  const images = raw.images.map((i) => i.imageUrl);
  // 이미지 오버라이드가 있으면 대표 이미지로 쓰고(카드와 통일), 원본 갤러리는
  // 중복만 빼고 뒤에 붙인다. 없으면 기존대로 images[0]를 대표로 쓴다.
  const override = CONTENT_IMAGE_OVERRIDES[raw.contentId];
  const imageUrl = override ?? images[0] ?? null;
  return {
    id: raw.contentId,
    name: overrideContentName(raw.contentId, raw.title),
    region: raw.region,
    category: raw.category,
    imageUrl,
    address: raw.address,
    summary: raw.summary,
    indoor: raw.indoor,
    operatingHours: raw.useTime,
    closedDay: raw.restDate,
    parking: toParkingAvailable(raw.parking),
    stayDuration: raw.stayDuration,
    reservationRequired: raw.reservationRequired,
    dataSource: raw.dataSource,
    // ContentDetailView가 [imageUrl, ...imageUrls]로 갤러리를 합치므로 중복을 피해 나머지만 담는다.
    imageUrls: override
      ? images.filter((url) => url !== imageUrl)
      : images.slice(1),
    // 좌표는 계약 그대로 통과시킨다. 0/무효 판정은 지도 레이어(geo.ts)에서 한다.
    latitude: raw.latitude,
    longitude: raw.longitude,
  };
}

export async function getContentById(id: string): Promise<ContentDetail> {
  const { data } = await apiClient.get<RawContentDetail>(
    `/api/v1/contents/${id}`,
  );
  return toContentDetail(data);
}
