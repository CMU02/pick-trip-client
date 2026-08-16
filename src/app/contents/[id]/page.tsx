import { notFound } from "next/navigation";

import { getContentFetchErrorMessage } from "@/lib/content";
import { parseApiError } from "@/lib/errors";
import { getContentById } from "@/services/contentService";

import { ContentDetailView } from "./_components/ContentDetailView";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
};

export default async function ContentDetailPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const { from } = await searchParams;

  let content: Awaited<ReturnType<typeof getContentById>>;
  try {
    content = await getContentById(id);
  } catch (err) {
    // 백엔드가 "콘텐츠 없음"이라고 명시한 경우(CONTENT_NOT_FOUND)에만 진짜
    // 404로 처리한다. TourAPI 제공자 오류(CONTENT_PROVIDER_FAILED) 등 그 외
    // 오류까지 없는 콘텐츠처럼 보이면 안 되므로 별도 안내로 보여준다.
    if (parseApiError(err).code === "CONTENT_NOT_FOUND") {
      notFound();
    }
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-16 text-center">
        <p className="text-sm text-destructive">
          {getContentFetchErrorMessage(err)}
        </p>
      </main>
    );
  }

  return (
    <ContentDetailView
      content={content}
      showBasketAction={from !== "explore"}
      backHref={from === "explore" ? "/explore" : undefined}
    />
  );
}
