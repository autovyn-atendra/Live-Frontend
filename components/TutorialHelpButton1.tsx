"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useCurrentUser } from "@/app/hooks/use-current-user";

interface TutorialHelpButtonProps {
  moduleKey: string;
  userId: string;
}

export default function TutorialHelpButton1({ moduleKey, userId }: TutorialHelpButtonProps) {
  const user = useCurrentUser();
  const [pressing, setPressing] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleClick = async () => {
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_URL}/Mobile/tutorial/open`,
        { user_id: userId, module_key: moduleKey },
        { headers: { compcode: user?.Comp_Code } }
      );
      const { youtube_url } = res.data;
      if (youtube_url) {
        try {
          const urlObj = new URL(youtube_url);
          let videoId = "";

          if (urlObj.hostname.includes("youtube.com")) {
            videoId = urlObj.searchParams.get("v") || "";
          } else if (urlObj.hostname.includes("youtu.be")) {
            videoId = urlObj.pathname.replace("/", "");
          }

          if (videoId) {
            const directUrl = `https://www.youtube.com/watch?v=${videoId}&autoplay=1&mute=1`;
            const newTab = window.open(directUrl, "_blank");
if (newTab) newTab.focus();
          } else {
            // window.open(youtube_url, "_blank");
            const newTab = window.open("", "_blank");

            if (newTab) {
              newTab.location.href = youtube_url;
            }
          }
        } catch (_) {
          window.open(youtube_url, "_blank");
        }
      }
    } catch (_) {
      // silent
    }
  };

  if (!mounted) return null;

  return (
    <>
      <style>{`

        /* ─────────────────────────────────────────────
           CSS custom property for rotating border
        ───────────────────────────────────────────── */
        @property --help-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }

        /* ─────────────────────────────────────────────
           Keyframes
        ───────────────────────────────────────────── */

        /* 1. Idle float — smooth 4-step up/down bob */
        @keyframes floatUpDown {
          0%   { transform: translateY(0px);  }
          25%  { transform: translateY(-5px); }
          50%  { transform: translateY(0px);  }
          75%  { transform: translateY(-5px); }
          100% { transform: translateY(0px);  }
        }

        /* 2. Drop-shadow glow pulse — light mode (red/orange) */
        @keyframes helpGlowLight {
          0%, 100% { filter: drop-shadow(0 0 5px  rgba(239,68,68,0.55));  }
          50%       { filter: drop-shadow(0 0 18px rgba(249,115,22,0.95)); }
        }
        /* 2b. Drop-shadow glow pulse — dark mode (purple/blue) */
        @keyframes helpGlowDark {
          0%, 100% { filter: drop-shadow(0 0 5px  rgba(124,58,237,0.65)); }
          50%       { filter: drop-shadow(0 0 18px rgba(37,99,235,1));     }
        }

        /* 3. Rotating conic-gradient border */
        @keyframes rotateBorder {
          to { --help-angle: 360deg; }
        }

        /* 4. Box-shadow glow pulse on button — light mode (red/orange) */
        @keyframes glowPulseLight {
          0%, 100% {
            box-shadow:
              0 0 8px  2px  rgba(239,68,68,0.5),
              0 4px 0 #b91c1c,
              0 6px 8px rgba(0,0,0,0.28);
          }
          50% {
            box-shadow:
              0 0 22px 7px  rgba(239,68,68,0.85),
              0 0 36px 11px rgba(249,115,22,0.5),
              0 4px 0 #b91c1c,
              0 6px 8px rgba(0,0,0,0.28);
          }
        }
        /* 4b. Box-shadow glow pulse on button — dark mode (purple/blue) */
        @keyframes glowPulseDark {
          0%, 100% {
            box-shadow:
              0 0 8px  2px  rgba(124,58,237,0.5),
              0 4px 0 #1e3a8a,
              0 6px 8px rgba(0,0,0,0.4);
          }
          50% {
            box-shadow:
              0 0 22px 7px  rgba(124,58,237,0.9),
              0 0 36px 11px rgba(37,99,235,0.55),
              0 4px 0 #1e3a8a,
              0 6px 8px rgba(0,0,0,0.4);
          }
        }

        /* 5. Shimmer sweep */
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }

        /* 6. Icon wiggle */
        @keyframes iconWiggle {
          0%, 100% { transform: rotate(0deg);   }
          25%       { transform: rotate(-15deg); }
          75%       { transform: rotate(15deg);  }
        }


        /* ─────────────────────────────────────────────
           Layer 1 — Outer wrapper
           Handles: float bob + drop-shadow glow
        ───────────────────────────────────────────── */
        .help-outer-wrap {
          display: inline-flex;
          animation:
            floatUpDown   2s ease-in-out infinite,
            helpGlowLight 2s ease-in-out infinite;
        }
        .dark .help-outer-wrap {
          animation:
            floatUpDown  2s ease-in-out infinite,
            helpGlowDark 2s ease-in-out infinite;
        }
        /* Pause float on hover; replace glow with static strong shadow */
        .help-outer-wrap:hover {
          animation: none;
          filter: drop-shadow(0 0 24px rgba(239,68,68,1));
        }
        .dark .help-outer-wrap:hover {
          animation: none;
          filter: drop-shadow(0 0 24px rgba(124,58,237,1));
        }


        /* ─────────────────────────────────────────────
           Layer 2 — Border rotation wrapper
           Handles: spinning conic-gradient border ring
        ───────────────────────────────────────────── */
        .help-border-wrap {
          display: inline-flex;
          border-radius: 54px;
          padding: 2px;
          background: conic-gradient(
            from var(--help-angle),
            #EF4444, #F97316, #FBBF24, #F97316, #EF4444
          );
          animation: rotateBorder 3s linear infinite;
        }
        .dark .help-border-wrap {
          background: conic-gradient(
            from var(--help-angle),
            #7C3AED, #2563EB, #EC4899, #F97316, #7C3AED
          );
        }


        /* ─────────────────────────────────────────────
           Layer 3 — Button
           Handles: gradient bg, box-shadow glow pulse,
                    shimmer ::before, press + hover transforms
        ───────────────────────────────────────────── */

        /* Light mode defaults */
        .help-btn {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #EF4444 0%, #F97316 100%);

          transform: translateY(0px) scale(1);
          transition: transform 0.1s ease, filter 0.1s ease;
        }
        .help-btn:hover {
          animation: none;
          transform: scale(1.08);
          filter: brightness(1.15);
          box-shadow:
            0 1px 0 #991b1b,
            0 4px 0 #b91c1c,
            0 14px 24px rgba(0,0,0,0.32);
        }
        .help-btn.pressing {
          animation: none;
          transform: translateY(4px) scale(0.95) !important;
          filter: brightness(0.92);
          box-shadow:
            0 0px 0 #991b1b,
            0 1px 0 #b91c1c,
            0 2px 4px rgba(0,0,0,0.2);
        }

        /* Dark mode overrides */
        .dark .help-btn {
          background: linear-gradient(135deg, #7C3AED 0%, #2563EB 100%);

        }
        .dark .help-btn:hover {
          animation: none;
          transform: scale(1.08);
          filter: brightness(1.15);
          box-shadow:
            0 1px 0 #5b21b6,
            0 4px 0 #1e3a8a,
            0 14px 24px rgba(0,0,0,0.55);
        }
        .dark .help-btn.pressing {
          animation: none;
          transform: translateY(4px) scale(0.95) !important;
          filter: brightness(0.88);
          box-shadow:
            0 0px 0 #5b21b6,
            0 1px 0 #1e3a8a,
            0 2px 4px rgba(0,0,0,0.35);
        }

        /* Shimmer sweep — runs on ::before overlay */
        .help-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50px;
          background: linear-gradient(
            90deg,
            transparent           0%,
            rgba(255,255,255,0.25) 50%,
            transparent           100%
          );
          background-size: 200% auto;
          animation: shimmer 2.5s linear infinite;
          pointer-events: none;
          z-index: 1;
        }

        /* Icon wiggle on button hover */
        .help-btn:hover .help-icon {
          animation: iconWiggle 0.4s ease-in-out;
        }

      `}</style>

      {/* Layer 1: float + glow */}
      <span className="help-outer-wrap ml-1">

        {/* Layer 2: rotating border ring */}
        <span className="help-border-wrap">

          {/* Layer 3: button */}
          <button
            onClick={handleClick}
            onMouseDown={() => setPressing(true)}
            onMouseUp={() => setPressing(false)}
            onMouseLeave={() => setPressing(false)}
            className={`help-btn${pressing ? " pressing" : ""}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              height: "38px",
              padding: "0 20px",
              borderRadius: "50px",
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "13px",
              color: "#ffffff",
              letterSpacing: "0.05em",
              textTransform: "capitalize",
              whiteSpace: "nowrap",
              zIndex: 0,
            }}
            title="Watch tutorial for this module"
          >
            {/* Clapperboard icon — wiggles on hover */}
            <svg
              className="help-icon"
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="none"
              style={{ flexShrink: 0, position: "relative", zIndex: 2 }}
            >
              <rect x="1.5" y="4" width="17" height="13" rx="2"
                fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="1.5"/>
              <rect x="1.5" y="1.5" width="17" height="3.5" rx="1.5"
                fill="rgba(255,255,255,0.35)" stroke="white" strokeWidth="1.2"/>
              <line x1="5"  y1="1.5" x2="5"  y2="5" stroke="white" strokeWidth="1.4"/>
              <line x1="10" y1="1.5" x2="10" y2="5" stroke="white" strokeWidth="1.4"/>
              <line x1="15" y1="1.5" x2="15" y2="5" stroke="white" strokeWidth="1.4"/>
              <polygon points="8,8.5 14,11 8,13.5" fill="white"/>
            </svg>

            {/* Text sits above shimmer layer */}
            <span style={{ position: "relative", zIndex: 2 }}>Help</span>
          </button>

        </span>
      </span>
    </>
  );
}
