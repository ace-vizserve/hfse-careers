import { Skeleton } from "@/components/ui/skeleton";

/** The primitive paints with a theme token; these pages use the palette. */
const TONE = "bg-[#E3E6F0]";

function Bar({ className }: { className?: string }) {
  return <Skeleton className={`${TONE} ${className ?? ""}`} />;
}

/** The navy bar and, on the listings route, the search row beneath it. */
export function ChromeSkeleton({ withSearchRow = false }: { withSearchRow?: boolean }) {
  return (
    <>
      <div className="flex h-[76px] items-center gap-4 bg-[#1B2A8F] px-4 sm:px-6 lg:gap-10 lg:px-10 sm:h-[104px]">
        <Bar className="h-[40px] w-[120px] bg-white/20 sm:h-[58px] sm:w-[160px]" />
        <div className="ml-auto flex items-center gap-3">
          <Bar className="size-[14px] rounded-full bg-white/20" />
          <Bar className="size-[14px] rounded-full bg-white/20" />
          <Bar className="size-[14px] rounded-full bg-white/20" />
        </div>
      </div>

      {withSearchRow && (
        <div className="mx-auto w-full max-w-[1680px] px-4 sm:px-6 lg:px-10">
          <div className="flex h-[68px] items-center gap-2 sm:h-[92px] sm:gap-4">
            <Bar className="h-[42px] flex-1 rounded-[7px] sm:h-[46px] md:w-[520px] md:flex-none" />
            <Bar className="h-[42px] w-[52px] rounded-[7px] sm:h-[46px] md:w-[190px]" />
          </div>
        </div>
      )}
    </>
  );
}

/** One resting result card in the listings rail. */
function ResultCardSkeleton() {
  return (
    <div className="rounded-[10px] border border-[#E4E7F1] bg-white px-5 py-[18px]">
      <div className="mb-4 flex items-start gap-4">
        <Bar className="size-12 flex-shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Bar className="h-4 w-3/4" />
          <Bar className="h-3 w-1/3" />
        </div>
        <Bar className="h-7 w-[90px] rounded-md" />
      </div>
      <div className="flex gap-2">
        <Bar className="h-7 w-[104px] rounded-md" />
        <Bar className="h-7 w-[84px] rounded-md" />
      </div>
    </div>
  );
}

/** The listings split: results rail on the left, the detail pane beside it. */
export function JobsSkeleton() {
  return (
    <div className="min-h-dvh bg-[#EFF1F6]">
      <ChromeSkeleton withSearchRow />

      <div className="mx-auto flex max-w-[1680px] flex-col gap-6 px-4 pb-4 pt-4 sm:px-6 md:flex-row md:px-10 md:pb-8 md:pt-6">
        <div className="flex w-full flex-col overflow-hidden rounded-xl bg-white md:w-[41%]">
          <div className="flex items-center justify-between border-b border-[#ECEFF7] px-6 py-[18px]">
            <Bar className="h-3 w-[120px]" />
            <Bar className="h-6 w-8 rounded-md" />
          </div>

          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <ResultCardSkeleton key={i} />
            ))}
          </div>
        </div>

        <div className="hidden flex-1 flex-col gap-6 rounded-xl bg-white p-6 shadow-[0_1px_2px_rgba(16,22,43,0.05),0_8px_24px_rgba(16,22,43,0.07)] md:flex sm:p-8">
          <div className="flex items-start gap-5">
            <Bar className="size-16 flex-shrink-0 rounded-lg" />
            <div className="flex-1 space-y-3">
              <Bar className="h-7 w-2/3" />
              <Bar className="h-4 w-1/4" />
            </div>
          </div>

          <div className="flex gap-2">
            <Bar className="h-8 w-[110px] rounded-md" />
            <Bar className="h-8 w-[104px] rounded-md" />
          </div>

          <Bar className="h-11 w-[150px] rounded-[7px]" />

          <div className="space-y-2.5 border-t border-[#ECEFF7] pt-6">
            {[
              "w-full",
              "w-11/12",
              "w-full",
              "w-4/5",
              "w-full",
              "w-2/3",
              "w-full",
              "w-3/4",
            ].map((width, i) => (
              <Bar key={i} className={`h-3.5 ${width}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** The standalone job page: main column plus the salary/employer sidebar. */
export function JobDetailSkeleton() {
  return (
    <div className="flex min-h-dvh flex-col bg-[#EFF1F6]">
      <ChromeSkeleton withSearchRow />

      <div className="mx-auto w-full max-w-[1680px] px-4 pt-5 sm:px-6 lg:px-10 lg:pt-[30px]">
        <Bar className="h-5 w-[110px]" />
      </div>

      <div className="mx-auto w-full max-w-[1680px] px-4 pb-10 pt-3 sm:px-6 lg:px-10 lg:pb-14 lg:pt-4">
        <div className="flex flex-col items-start gap-5 lg:flex-row">
          <main className="flex w-full min-w-0 flex-1 flex-col gap-4">
            <section className="rounded-xl bg-white px-5 py-5 shadow-[0_1px_2px_rgba(16,22,43,0.05),0_8px_24px_rgba(16,22,43,0.07)] sm:px-7 sm:py-[26px]">
              <div className="flex gap-4">
                <Bar className="size-[60px] flex-shrink-0 rounded-xl" />
                <div className="flex-1 space-y-3">
                  <Bar className="h-7 w-2/3" />
                  <Bar className="h-4 w-1/3" />
                  <div className="flex gap-[7px] pt-1">
                    <Bar className="h-[26px] w-[96px] rounded-md" />
                    <Bar className="h-[26px] w-[78px] rounded-md" />
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-xl bg-white px-5 py-5 shadow-[0_1px_2px_rgba(16,22,43,0.05),0_8px_24px_rgba(16,22,43,0.07)] sm:px-7 sm:py-[26px]">
              <Bar className="h-5 w-[140px]" />
              <div className="mt-5 space-y-2.5 border-t border-[#ECEFF7] pt-4">
                {["w-1/3", "w-full", "w-11/12", "w-5/6", "w-1/4", "w-full", "w-4/5", "w-2/3"].map((width, i) => (
                  <Bar key={i} className={`h-3.5 ${width}`} />
                ))}
              </div>
            </section>

            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <section
                  key={i}
                  className="rounded-xl bg-white p-[22px] shadow-[0_1px_2px_rgba(16,22,43,0.05),0_6px_18px_rgba(16,22,43,0.06)]">
                  <div className="flex items-start gap-[14px]">
                    <Bar className="size-11 flex-shrink-0 rounded-[10px]" />
                    <div className="flex-1 space-y-2">
                      <Bar className="h-4 w-1/2" />
                      <Bar className="h-3 w-full" />
                      <Bar className="h-3 w-3/4" />
                    </div>
                  </div>
                </section>
              ))}
            </div>
          </main>

          <aside className="flex w-full flex-shrink-0 flex-col gap-4 lg:w-[420px]">
            <section className="rounded-xl bg-white p-6 shadow-[0_1px_2px_rgba(16,22,43,0.05),0_8px_24px_rgba(16,22,43,0.07)]">
              <Bar className="h-3 w-[60px]" />
              <Bar className="mt-[7px] h-7 w-[140px]" />
              <Bar className="mt-2 h-3 w-[70px]" />

              <Bar className="mt-5 h-[42px] w-full rounded-lg" />
              <Bar className="mt-[9px] h-[42px] w-full rounded-lg" />

              <div className="mt-5 space-y-3 border-t border-[#ECEFF7] pt-5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Bar className="h-3 w-[110px]" />
                    <Bar className="h-3 w-[80px]" />
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl bg-white p-[22px] shadow-[0_1px_2px_rgba(16,22,43,0.05),0_6px_18px_rgba(16,22,43,0.06)]">
              <div className="flex items-center gap-3">
                <Bar className="size-11 flex-shrink-0 rounded-[10px]" />
                <div className="flex-1 space-y-2">
                  <Bar className="h-4 w-2/3" />
                  <Bar className="h-3 w-1/3" />
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

/** The apply form: navy job bar, stepper band, then the first section card. */
export function ApplySkeleton() {
  return (
    <div className="min-h-screen bg-[#EFF1F6]">
      <div className="bg-[#1B2A8F] px-4 py-4 shadow-[0_1px_0_#E1E5F0] sm:px-[30px] sm:py-7">
        <div className="mx-auto flex max-w-[1060px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <Bar className="h-4 w-[110px] bg-white/20" />
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="flex-1 space-y-2 sm:text-right">
              <Bar className="h-5 w-[200px] bg-white/20 sm:ml-auto" />
              <Bar className="h-3 w-[150px] bg-white/20 sm:ml-auto" />
            </div>
            <Bar className="size-12 flex-shrink-0 rounded-[10px] bg-white/20 sm:size-14" />
          </div>
        </div>
      </div>

      <div className="border-t border-[#ECEFF7] bg-white px-4 py-3 shadow-[0_1px_0_#E1E5F0,0_3px_10px_rgba(16,22,43,0.04)] sm:px-[30px] sm:py-[18px]">
        <div className="mx-auto flex w-full max-w-[1060px] items-center gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`flex flex-1 items-center gap-[14px] ${i > 0 ? "hidden md:flex" : ""}`}>
              <Bar className="size-10 flex-shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Bar className="h-3.5 w-2/3" />
                <Bar className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[1120px] px-4 pb-8 pt-4 sm:px-[30px] sm:pb-10 sm:pt-[26px]">
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, card) => (
            <div
              key={card}
              className="rounded-xl bg-white px-4 py-5 shadow-[0_1px_2px_rgba(16,22,43,0.05),0_8px_24px_rgba(16,22,43,0.07)] sm:px-[26px] sm:py-6">
              <div className="flex items-center gap-[13px] border-b border-[#ECEFF7] pb-4">
                <Bar className="size-8 flex-shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Bar className="h-4 w-[180px]" />
                  <Bar className="h-3 w-[240px]" />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, field) => (
                  <div key={field} className="space-y-1.5">
                    <Bar className="h-3 w-[90px]" />
                    <Bar className="h-10 w-full rounded-[7px]" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
