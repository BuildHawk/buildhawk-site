import { ImageResponse } from "next/og";

export const alt =
  "BuildHawk · Powered by Hawktress™ · Precision Estimating. Disciplined Delivery.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const EMBLEM_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 255.21 195.97" width="320" height="246">
  <path fill="#ffffff" d="M248.58,87.27c3.72-19.49-12.19-23.39-32.82-20.97-31.46,3.7-73.92,22.12-74.65,22.43,37.44-30.15,74.53-41.23,74.53-41.23l-.93-2.64c1.88-.17,3.67-.3,5.39-.39-.21-3.19-2.51-6.4-7.61-9.54-22.92-14.12-56.85-13.31-76.88-11.21L103.04,1.14s90.09.96,121.13,28.03c4.71,4.11,5.89,9.36,4.48,15.3,44.14,2.28,19.93,42.8,19.93,42.8Z"/>
  <path fill="#ffffff" d="M196.99,45.97c-7.1-.99-11.61-7.08-11.05-13.62,0,0,10.61,7.32,17.82,7.94,0,0,.32,6.67-6.78,5.68Z"/>
  <path fill="#ffffff" d="M142.5,195.97s-22.79-4.71-49.8-35.01c23.57-.73,35.2-10.08,40.54-21.47-.12,16.69,1.16,42.49,9.26,56.48Z"/>
  <path fill="#ffffff" d="M116.32,195.97s-50.65-6.11-73.06-70.89c.3.36,10.15,11.87,33.33,24.66,0,0,8.47,18.82,39.73,46.22Z"/>
  <path fill="#ffffff" d="M74.84,183.99C-11.52,142.99,6,59.5,9.02,47.52v6.09c0,2.89.15,5.69.41,8.41v.02c1.21,12.22,4.95,23,9.64,32.11,4.02,7.8,8.71,14.39,13.22,19.77,6.87,41.52,41.93,69.58,42.54,70.07Z"/>
  <path fill="#ffffff" d="M25.05,151.5S.53,132.78,4.34,105.94c0,0,.33,18.55,20.71,45.55Z"/>
  <path fill="#de5123" d="M169.6,84.82s.01,3.97.02,10.11h-37.61c-.92-4.3-1.86-7-1.86-7-13.05,8.83-35.14,4.84-35.14,4.84,9.62,10.38,12.03,26.31.75,33.52-11.28,7.22-25.26,4.51-25.26,4.51,5.15,8.37,10.32,15.69,15.4,22.07,41.22.12,48.41-24.66,47.87-43.64h35.88c.05,22.78.08,53.28-.05,53.28l34.16-13.89v-73.15l-34.16,9.34Z"/>
  <path fill="#de5123" d="M134.06,71.73c-14.44,25.73-43.31,8.41-51.72,8.41-5.03,0-16.67-.35-25.2-.42v42.36s-17.12-11.93-28-33.1c-4.15-8.06-7.39-17.46-8.44-28.05-.23-2.38-.36-4.82-.36-7.32v-22.82s36.8-.17,36.8,0v31.35h18.6c31.67,0,34.27-40.89-5.24-40.89H26.01C14.28,21.24,0,11.73,0,0h74.84c31.85,0,48.24,11.12,54.11,24.53,8.4,19.16-4.71,42.99-24.9,45.68,0,0,9.89,7.42,30.01,1.52Z"/>
</svg>`;

const EMBLEM_DATA_URL = `data:image/svg+xml;base64,${Buffer.from(EMBLEM_SVG).toString("base64")}`;

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#111111",
          color: "#ffffff",
          fontFamily: "Inter, sans-serif",
          position: "relative",
        }}
      >
        {/* Subtle grid texture */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
            display: "flex",
          }}
        />

        {/* Emblem accent in corner */}
        <div
          style={{
            position: "absolute",
            right: -60,
            top: 60,
            opacity: 0.15,
            display: "flex",
          }}
        >
          <img src={EMBLEM_DATA_URL} alt="" width={520} height={400} />
        </div>

        {/* Top eyebrow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "60px 80px 0",
          }}
        >
          <span
            style={{
              display: "block",
              width: 28,
              height: 2,
              background: "#de5123",
            }}
          />
          <span
            style={{
              fontSize: 18,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "#de5123",
              fontWeight: 600,
            }}
          >
            BuildHawk · Powered by Hawktress™
          </span>
        </div>

        {/* Lockup */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 36,
            padding: "60px 80px 0",
          }}
        >
          <img src={EMBLEM_DATA_URL} alt="" width={140} height={108} />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <span
              style={{
                fontSize: 80,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                lineHeight: 1,
                color: "#ffffff",
              }}
            >
              BUILDHAWK
            </span>
            <span
              style={{
                fontSize: 18,
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.55)",
              }}
            >
              Powered by Hawktress™
            </span>
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            padding: "60px 80px 0",
          }}
        >
          <span
            style={{
              fontSize: 64,
              fontWeight: 500,
              letterSpacing: "-0.025em",
              lineHeight: 1.05,
              color: "#ffffff",
            }}
          >
            Precision Estimating.
          </span>
          <span
            style={{
              fontSize: 64,
              fontWeight: 500,
              letterSpacing: "-0.025em",
              lineHeight: 1.05,
              color: "#de5123",
            }}
          >
            Disciplined Delivery.
          </span>
        </div>

        {/* Bottom meta strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 80px 56px",
            marginTop: "auto",
            color: "rgba(255,255,255,0.55)",
            fontSize: 18,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          <span>Geelong, VIC · Australia + NZ</span>
          <span>buildhawk.com.au</span>
        </div>

        {/* Brand orange band */}
        <div
          style={{
            display: "flex",
            height: 12,
            background: "#de5123",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
