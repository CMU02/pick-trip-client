import { getContentFetchErrorMessage } from "@/lib/content";
import { getContents } from "@/services/contentService";
import { REGIONS } from "@/types/region";

import { ForYouClient } from "./_components/ForYouClient";

export default async function ForYouPage() {
  const startDate = new Date().toISOString().split("T")[0];

  let contents: Awaited<ReturnType<typeof getContents>>["contents"] = [];
  let error: string | null = null;

  try {
    const res = await getContents({
      regions: [...REGIONS],
      startDate,
      nights: 0,
    });
    contents = res.contents;
  } catch (err) {
    error = getContentFetchErrorMessage(err);
  }

  if (error) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-14">
        <p className="py-16 text-center text-sm text-destructive">{error}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-14">
      <ForYouClient recommendedPool={contents} />
    </main>
  );
}
