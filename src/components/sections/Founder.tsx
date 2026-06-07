import Image from "next/image";
import Reveal from "@/components/motion/Reveal";

export default function Founder() {
  return (
    <section className="relative bg-bh-cloud py-16 md:py-36">
      <div className="mx-auto max-w-[1480px] px-6 md:px-10">
        <div className="grid grid-cols-12 gap-6 md:gap-10">
          {/* Photo column */}
          <Reveal as="div" className="col-span-12 md:col-span-5" duration={800}>
            <figure className="relative aspect-[4/5] overflow-hidden bg-bh-white border border-bh-steel/40">
              <Image
                src="/images/nathan-holloway-portrait.webp"
                alt="Nathan Holloway, Founder of BuildHawk and Hawktress, outside a Geelong West custom home"
                fill
                sizes="(min-width: 768px) 40vw, 100vw"
                className="object-cover object-[50%_30%]"
                priority
              />
            </figure>
            <figcaption className="mt-5 flex items-baseline justify-between gap-4">
              <div>
                <p className="text-[16px] font-medium tracking-[-0.01em] text-bh-black">
                  Nathan Holloway
                </p>
                <p className="text-[13px] tracking-[-0.005em] text-bh-graphite">
                  Founder · BuildHawk &amp; Hawktress
                </p>
              </div>
              <p className="text-[11px] tracking-[0.18em] uppercase text-bh-orange">
                Geelong, VIC
              </p>
            </figcaption>
          </Reveal>

          {/* Quote + story */}
          <Reveal as="div" className="col-span-12 md:col-span-7 flex flex-col" duration={800} delay={150}>
            <p className="text-[11px] tracking-[0.2em] uppercase text-bh-graphite mb-5">
              From the Director
            </p>
            <blockquote className="font-medium tracking-[-0.025em] leading-[1.15] text-[28px] md:text-[40px] lg:text-[48px] text-bh-black">
              Hawktress runs inside our own jobs.{" "}
              <span className="text-bh-orange">
                We open it to operators who run a tight book and want the same
                discipline behind every decision.
              </span>
            </blockquote>

            <div className="mt-10 space-y-5 max-w-2xl text-[16px] md:text-[17px] leading-[1.55] tracking-[-0.005em] text-bh-graphite">
              <p>
                Residential building is a precision craft. Most of it is
                still run on gut feel.
              </p>
              <p>
                Decisions get made on stale benchmarks and unverifiable
                quotes. Margin disappears quietly, stage by stage, and the
                people who allowed it are left carrying it.
              </p>
              <p>
                Hawktress is built on live Australian and New Zealand
                construction data, by people who estimate and administer
                real residential contracts. It exists because nothing in
                the market does what it does, and because the operators
                running the best builds in this country deserve the same
                operating standard the rest of the world takes for granted.
              </p>
              <p className="text-bh-black">
                We do not chase market share. We choose who we work with.
                Every builder, trade, and supplier inside Hawktress holds
                the same standard we hold ourselves.
              </p>
            </div>

            <div className="mt-10 pt-8 border-t border-bh-steel/60 grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <p className="text-[11px] tracking-[0.18em] uppercase text-bh-graphite mb-1">
                  Industry experience
                </p>
                <p className="text-[16px] tracking-[-0.01em] text-bh-black">
                  <span className="text-bh-orange font-medium">25 years</span>{" "}
                  residential
                </p>
              </div>
              <div>
                <p className="text-[11px] tracking-[0.18em] uppercase text-bh-graphite mb-1">
                  Office
                </p>
                <p className="text-[16px] tracking-[-0.01em] text-bh-black">
                  Geelong, VIC
                </p>
              </div>
              <div>
                <p className="text-[11px] tracking-[0.18em] uppercase text-bh-graphite mb-1">
                  Direct
                </p>
                <a
                  href="mailto:info@buildhawk.com.au"
                  className="text-[16px] tracking-[-0.01em] text-bh-black hover:text-bh-orange transition-colors"
                >
                  info@buildhawk.com.au
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
