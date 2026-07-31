import { notFound } from "next/navigation";

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
  } catch {
    notFound();
  }

  return (
    <ContentDetailView
      content={content}
      showBasketAction={from !== "explore"}
    />
  );
}
