"use client";
import Link from "next/link";

import { useState } from "react";
import Image from "next/image";

type Voice = {
  youtubeId: string;
  title: string;
  channel: string;
  topic: string;
};

const voices: Voice[] = [
  {
    youtubeId: "bFloySBOcp8",
    title: "How to start a House Build in Australia",
    channel: "CourtneyBraz · Pre-construction guide",
    topic: "Pre-construction",
  },
  {
    youtubeId: "o9X5uA-pVWA",
    title: "Construction Contract Variations and Claims",
    channel: "Peter Mallett · 32-min talk",
    topic: "Variation control",
  },
  {
    youtubeId: "cbCZbaIoBm4",
    title: "How To Estimate Jobs For Contractors",
    channel: "Will Spaulding · Estimating 101",
    topic: "Estimating",
  },
];

function youtubeThumb(id: string): string {
  return `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
}

export default function Voices() {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <section className="relative bg-bh-cloud py-16 md:py-36">
      <div className="mx-auto max-w-[1480px] px-6 md:px-10">
        <div className="grid grid-cols-12 gap-6 md:gap-8 mb-12 md:mb-16 items-end">
          <div className="col-span-12 md:col-span-7">
            <p className="text-[11px] tracking-[0.2em] uppercase text-bh-graphite mb-4">
              Voices from the trade
            </p>
            <h2 className="font-medium tracking-[-0.03em] leading-[1.05] text-[36px] md:text-[52px] lg:text-[64px] text-bh-black">
              Real builders.
              <br />
              <span className="text-bh-graphite">Real conversations.</span>
            </h2>
          </div>
          <div className="col-span-12 md:col-span-5 md:text-right">
            <p className="text-[14px] tracking-[-0.005em] text-bh-graphite max-w-md md:ml-auto">
              Curated talks and walkthroughs from the people who actually
              estimate, administer and run residential construction. Watch any
              clip in place.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {voices.map((v) => {
            const isActive = activeId === v.youtubeId;
            return (
              <article
                key={v.youtubeId}
                className="bg-bh-white border border-bh-steel/40 hover:border-bh-graphite/60 transition-colors flex flex-col"
              >
                <figure className="relative aspect-video bg-bh-black overflow-hidden group">
                  {isActive ? (
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${v.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                      title={v.title}
                      loading="lazy"
                      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : (
                    <>
                      <Image
                        src={youtubeThumb(v.youtubeId)}
                        alt=""
                        fill
                        sizes="(min-width: 768px) 33vw, 100vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                      <button
                        type="button"
                        onClick={() => setActiveId(v.youtubeId)}
                        aria-label={`Play: ${v.title}`}
                        className="absolute inset-0 flex items-center justify-center cursor-pointer"
                      >
                        <span className="relative inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-bh-orange text-bh-white transition-transform duration-300 group-hover:scale-105">
                          <span className="absolute inset-0 rounded-full bg-bh-orange/40 animate-ping" />
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            aria-hidden
                            className="relative ml-1"
                          >
                            <path d="M7 5v14l12-7z" />
                          </svg>
                        </span>
                      </button>
                      <span className="absolute top-4 left-4 inline-flex items-center h-6 px-2.5 rounded-full bg-bh-black/70 backdrop-blur-sm text-bh-white text-[10px] tracking-[0.18em] uppercase">
                        {v.topic}
                      </span>
                    </>
                  )}
                </figure>
                <div className="p-5 md:p-6 flex flex-col flex-1">
                  <h3 className="text-[17px] md:text-[18px] font-medium tracking-[-0.01em] leading-[1.3] text-bh-black">
                    {v.title}
                  </h3>
                  <p className="mt-2 text-[13px] tracking-[-0.005em] text-bh-graphite">
                    {v.channel}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        <p className="mt-8 text-[12px] tracking-[-0.005em] text-bh-graphite max-w-3xl">
          Videos embedded with permission via YouTube. Inclusion does not
          imply endorsement of BuildHawk or Hawktress by the original creators.
          For recommended viewing across the rest of the lifecycle, see our{" "}
          <Link href="/insights" className="text-bh-orange underline underline-offset-4 hover:text-bh-orange-700">
            insights archive
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
