import { useState } from "react";
import { motion } from "framer-motion";

const LOGO_SIZE = 300;

const LogoSVG = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 300 300"
    width={LOGO_SIZE}
    height={LOGO_SIZE}
  >
    <defs>
      <linearGradient id="gt-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e1b4b" />
        <stop offset="100%" stopColor="#312e81" />
      </linearGradient>
      <linearGradient id="gt-cap" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#4338ca" />
      </linearGradient>
      <linearGradient id="gt-band" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#4f46e5" />
        <stop offset="100%" stopColor="#3730a3" />
      </linearGradient>
    </defs>

    {/* Background */}
    <rect width="300" height="300" fill="url(#gt-bg)" rx="24" />

    {/* Mortarboard flat top */}
    <polygon
      points="150,65 268,118 150,160 32,118"
      fill="url(#gt-cap)"
      stroke="#818cf8"
      strokeWidth="1.5"
    />
    <polygon
      points="150,70 220,103 150,130 80,103"
      fill="rgba(255,255,255,0.08)"
    />

    {/* Cap body */}
    <rect x="97" y="118" width="106" height="46" fill="url(#gt-band)" />
    <ellipse cx="150" cy="118" rx="53" ry="14" fill="#5b52e8" />
    <ellipse cx="150" cy="164" rx="53" ry="14" fill="#3730a3" />

    {/* Tassel */}
    <path
      d="M268,118 C282,128 278,150 272,170 L272,186"
      stroke="#fbbf24"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    <rect x="264" y="186" width="16" height="20" rx="4" fill="#fbbf24" />
    <line
      x1="266"
      y1="206"
      x2="263"
      y2="222"
      stroke="#fbbf24"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <line
      x1="272"
      y1="206"
      x2="272"
      y2="223"
      stroke="#fbbf24"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <line
      x1="278"
      y1="206"
      x2="281"
      y2="222"
      stroke="#fbbf24"
      strokeWidth="2.5"
      strokeLinecap="round"
    />

    {/* Star decorations */}
    <polygon
      points="52,52 55,45 58,52 65,52 60,57 62,64 55,60 48,64 50,57 45,52"
      fill="#fbbf24"
      opacity="0.85"
    />
    <polygon
      points="245,46 247,41 249,46 254,46 250,49 252,54 247,51 242,54 244,49 240,46"
      fill="#a5b4fc"
      opacity="0.7"
    />
    <polygon
      points="40,230 42,225 44,230 49,230 45,233 47,238 42,235 37,238 39,233 35,230"
      fill="#a5b4fc"
      opacity="0.6"
    />
    <polygon
      points="258,248 260,243 262,248 267,248 263,251 265,256 260,253 255,256 257,251 253,248"
      fill="#fbbf24"
      opacity="0.75"
    />

    {/* GT monogram */}
    <text
      x="150"
      y="143"
      fontFamily="Georgia, serif"
      fontSize="30"
      fontWeight="bold"
      fill="white"
      textAnchor="middle"
      opacity="0.92"
      letterSpacing="4"
    >
      GT
    </text>

    {/* Divider */}
    <line
      x1="90"
      y1="196"
      x2="210"
      y2="196"
      stroke="#6366f1"
      strokeWidth="1"
      opacity="0.7"
    />

    {/* Label */}
    <text
      x="150"
      y="216"
      fontFamily="Arial, sans-serif"
      fontSize="12"
      fontWeight="700"
      fill="#a5b4fc"
      textAnchor="middle"
      letterSpacing="3"
    >
      GRADUATE
    </text>
    <text
      x="150"
      y="234"
      fontFamily="Arial, sans-serif"
      fontSize="12"
      fontWeight="700"
      fill="#a5b4fc"
      textAnchor="middle"
      letterSpacing="3"
    >
      TRACER
    </text>

    {/* Bottom dots */}
    <circle cx="128" cy="252" r="3" fill="#6366f1" opacity="0.5" />
    <circle cx="140" cy="252" r="3" fill="#6366f1" opacity="0.7" />
    <circle cx="152" cy="252" r="5" fill="#6366f1" />
    <circle cx="164" cy="252" r="3" fill="#6366f1" opacity="0.7" />
    <circle cx="176" cy="252" r="3" fill="#6366f1" opacity="0.5" />
  </svg>
);

const PictureBreakAndCombine = () => {
  const rows = 4;
  const cols = 4;
  const tileW = LOGO_SIZE / cols;
  const tileH = LOGO_SIZE / rows;
  const [isBroken, setIsBroken] = useState(false);

  const pieces = Array.from({ length: rows * cols });

  return (
    <div
      onClick={() => setIsBroken((prev) => !prev)}
      className="relative cursor-pointer"
      style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
    >
      {pieces.map((_, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;

        return (
          <motion.div
            key={index}
            style={{
              position: "absolute",
              width: tileW,
              height: tileH,
              top: row * tileH,
              left: col * tileW,
              overflow: "hidden",
            }}
            animate={
              isBroken
                ? {
                    x: Math.random() * 300 - 150,
                    y: Math.random() * 300 - 150,
                  }
                : { x: 0, y: 0 }
            }
            transition={{
              duration: 2,
              repeat: isBroken ? Infinity : 0,
              repeatType: "reverse",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -(row * tileH),
                left: -(col * tileW),
              }}
            >
              <LogoSVG />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default PictureBreakAndCombine;
