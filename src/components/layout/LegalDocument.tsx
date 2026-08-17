interface LegalSection {
  readonly title: string;
  readonly body: readonly string[];
}

interface LegalDocumentProps {
  title: string;
  effectiveDate: string;
  sections: readonly LegalSection[];
}

/** 이용약관, 개인정보처리방침처럼 조문 목록으로만 이루어진 정적 문서의 공통 골격. */
export function LegalDocument({
  title,
  effectiveDate,
  sections,
}: LegalDocumentProps) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-14">
      <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-foreground">
        {title}
      </h1>
      <p className="mt-2 text-[13px] text-muted-foreground">
        시행일: {effectiveDate}
      </p>

      <div className="mt-10 flex flex-col gap-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-[15px] font-bold text-foreground">
              {section.title}
            </h2>
            <div className="mt-2.5 flex flex-col gap-2">
              {section.body.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-[13.5px] leading-relaxed text-muted-foreground"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
