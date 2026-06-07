"use client";

import { useState } from "react";
import Image from "next/image";

type Props = {
  poster: string;
  label: string;
  /** Optional MP4 URL. */
  src?: string;
  /** Optional YouTube ID (preferred for "real people" content). */
  youtubeId?: string;
  /** Alt text for the poster image. */
  alt?: string;
  /** Optional credit line shown under the label. */
  credit?: string;
};

function youtubeThumb(id: string): string {
  return `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
}

export default function VideoEmbed({
  poster,
  label,
  src,
  youtubeId,
  alt = "",
  credit,
}: Props) {
  const [playing, setPlaying] = useState(false);

  // Prefer YouTube thumb if available and no custom poster set
  const effectivePoster = poster || (youtubeId ? youtubeThumb(youtubeId) : "");
  const hasMedia = Boolean(src || youtubeId);

  return (
    <figure className="relative w-full aspect-video overflow-hidden bg-bh-black border border-bh-steel/40 group">
      {playing && youtubeId ? (
        <iframe
          className="absolute inset-0 w-full h-full"
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
          title={label}
          loading="lazy"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : playing && src ? (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src={src}
          controls
          autoPlay
          poster={effectivePoster}
        />
      ) : (
        <>
          <Image
            src={effectivePoster}
            alt={alt}
            fill
            sizes="(min-width: 1024px) 800px, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          />
          {/* gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-black/25" />

          {/* play button */}
          <button
            type="button"
            onClick={() => {
              if (hasMedia) setPlaying(true);
            }}
            aria-label={hasMedia ? "Play video" : "Request walkthrough"}
            className="absolute inset-0 flex items-center justify-center cursor-pointer"
          >
            <span className="relative inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-bh-orange text-bh-white transition-transform duration-300 group-hover:scale-105">
              <span className="absolute inset-0 rounded-full bg-bh-orange/40 animate-ping" />
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
                className="relative ml-1"
              >
                <path d="M7 5v14l12-7z" />
              </svg>
            </span>
          </button>

          {/* label */}
          <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 text-bh-white">
            <p className="text-[11px] tracking-[0.2em] uppercase text-bh-steel/85 mb-1">
              {hasMedia ? "Watch" : "Walkthrough"}
            </p>
            <p className="text-[16px] md:text-[18px] tracking-[-0.01em] font-medium">
              {label}
            </p>
            {credit && (
              <p className="mt-1 text-[12px] tracking-[-0.005em] text-bh-steel/75">
                {credit}
              </p>
            )}
            {!hasMedia && !credit && (
              <p className="mt-1 text-[12px] tracking-[-0.005em] text-bh-steel/75">
                Available on request · email{" "}
                <a
                  href="mailto:info@buildhawk.com.au"
                  className="text-bh-orange hover:text-bh-white"
                >
                  info@buildhawk.com.au
                </a>
              </p>
            )}
          </div>
        </>
      )}
    </figure>
  );
}
