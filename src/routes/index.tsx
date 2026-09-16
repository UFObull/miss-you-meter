import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getMissCounts, incrementMiss, type MissCounts } from "@/lib/miss.functions";

export const Route = createFileRoute("/")({
  loader: () => getMissCounts(),
  head: () => ({
    meta: [
      { title: "Liam 💛 Hope — Who Misses Who More?" },
      {
        name: "description",
        content:
          "A cute little counter for Liam & Hope. Tap your button to say you're missing the other, and watch the numbers go up together in real time.",
      },
      { property: "og:title", content: "Liam 💛 Hope — Who Misses Who More?" },
      {
        property: "og:description",
        content:
          "Tap your button to say you're missing the other, and watch the numbers go up together in real time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MissPage,
});

type Side = "liam" | "hope";

function MissPage() {
  const initial = Route.useLoaderData();
  const [liam, setLiam] = useState(initial.liam_count);
  const [hope, setHope] = useState(initial.hope_count);
  const [popping, setPopping] = useState<Side | null>(null);
  const [hearts, setHearts] = useState<{ id: number; side: Side }[]>([]);
  const heartId = useRef(0);

  // Keep both phones in sync via realtime.
  useEffect(() => {
    const channel = supabase
      .channel("miss_counts_live")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "miss_counts" },
        (payload) => {
          const row = payload.new as MissCounts;
          setLiam(row.liam_count);
          setHope(row.hope_count);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const increment = useServerFn(incrementMiss);

  async function tap(side: Side) {
    // Optimistic bump + button pop + heart burst.
    if (side === "liam") setLiam((n) => n + 1);
    else setHope((n) => n + 1);

    setPopping(side);
    window.setTimeout(() => setPopping(null), 300);

    const id = heartId.current++;
    setHearts((h) => [...h, { id, side }]);
    window.setTimeout(
      () => setHearts((h) => h.filter((heart) => heart.id !== id)),
      1000,
    );

    try {
      const result = await increment({ data: { who: side } });
      setLiam(result.liam_count);
      setHope(result.hope_count);
    } catch {
      // Realtime will resync anyway; ignore the failed request.
    }
  }

  const winner =
    liam === hope
      ? "It's a tie — you're missing each other equally 💫"
      : liam > hope
        ? "Liam misses Hope more… for now 💛"
        : "Hope misses Liam more… for now 💛";

  return (
    <main className="min-h-screen w-full overflow-hidden bg-cream text-grape">
      {/* soft decorative blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-blush/40 blur-3xl" />
        <div className="absolute right-[-6rem] top-1/3 h-80 w-80 rounded-full bg-butter/40 blur-3xl" />
        <div className="absolute bottom-[-4rem] left-1/3 h-72 w-72 rounded-full bg-rose/20 blur-3xl" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-5 py-10">
        <header className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-rose">
            Liam & Hope
          </p>
          <h1 className="mt-2 text-4xl font-extrabold leading-tight sm:text-5xl">
            Who misses who more?
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base text-grape/70">
            Tap your button every time you're missing the other. The numbers
            stay in sync across both phones. 💛
          </p>
        </header>

        <p className="mt-6 rounded-full bg-white/70 px-5 py-2 text-center text-sm font-bold text-grape shadow-sm ring-1 ring-grape/5">
          {winner}
        </p>

        <div className="mt-10 grid w-full gap-6 sm:grid-cols-2">
          <CounterCard
            side="liam"
            name="Liam"
            target="Hope"
            count={liam}
            onTap={tap}
            popping={popping === "liam"}
            hearts={hearts.filter((h) => h.side === "liam")}
            accent="blush"
          />
          <CounterCard
            side="hope"
            name="Hope"
            target="Liam"
            count={hope}
            onTap={tap}
            popping={popping === "hope"}
            hearts={hearts.filter((h) => h.side === "hope")}
            accent="butter"
          />
        </div>

        <p className="mt-8 text-center text-xs text-grape/50">
          Open this page on both phones and miss away. 🥹
        </p>
      </div>
    </main>
  );
}

type CardProps = {
  side: Side;
  name: string;
  target: string;
  count: number;
  onTap: (side: Side) => void;
  popping: boolean;
  hearts: { id: number; side: Side }[];
  accent: "blush" | "butter";
};

function CounterCard({
  side,
  name,
  target,
  count,
  onTap,
  popping,
  hearts,
  accent,
}: CardProps) {
  const isBlush = accent === "blush";
  const btnClass = isBlush
    ? "bg-blush text-blush-foreground"
    : "bg-butter text-butter-foreground";

  return (
    <div className="relative flex flex-col items-center rounded-[2rem] bg-white/80 p-6 text-center shadow-[0_12px_40px_-12px_rgba(255,93,143,0.35)] ring-1 ring-grape/5 backdrop-blur">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-grape/60">
        {name} misses
      </p>
      <div className="my-1 text-6xl font-extrabold tabular-nums leading-none sm:text-7xl">
        {count.toLocaleString()}
      </div>
      <p className="text-sm font-semibold text-grape/60">
        {count === 1 ? "time" : "times"}
      </p>

      <button
        type="button"
        onClick={() => onTap(side)}
        className={`relative mt-5 w-full overflow-visible rounded-full px-6 py-4 text-lg font-extrabold shadow-md transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 ${btnClass} ${
          popping ? "animate-pop" : ""
        }`}
        aria-label={`I miss ${target}`}
      >
        I miss {target} 💛
        {/* heart burst */}
        {hearts.map((h) => (
          <span
            key={h.id}
            className="heart-particle text-2xl"
            style={
              {
                "--drift": `${(h.id % 5) * 14 - 28}px`,
                "--rot": `${(h.id % 7) * 12 - 36}deg`,
              } as React.CSSProperties
            }
          >
            {["💛", "🩷", "💖", "🤍", "✨"][h.id % 5]}
          </span>
        ))}
      </button>
    </div>
  );
}
