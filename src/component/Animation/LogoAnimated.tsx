import { useState } from "react";
import { motion } from "framer-motion";

const PictureBreakAndCombine = () => {
  const rows = 4; // Number of rows
  const cols = 4; // Number of columns
  const imageUrl =
    "https://firebasestorage.googleapis.com/v0/b/sroksre-442c0.appspot.com/o/sideImage%2Fgraduation.png?alt=media&token=011e65f0-b57f-4c47-a1bf-3f1b070de4e4"; // Replace with your image URL
  const [isBroken, setIsBroken] = useState(false);

  // Generate an array of pieces
  const pieces = Array.from({ length: rows * cols });

  return (
    <div
      onClick={() => setIsBroken((prev) => !prev)}
      className="relative w-[300px] h-[300px] overflow-hidden"
    >
      {pieces.map((_, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;

        return (
          <motion.div
            key={index}
            className="absolute"
            style={{
              width: `${100 / cols}%`,
              height: `${100 / rows}%`,
              top: `${(row * 100) / rows}%`,
              left: `${(col * 100) / cols}%`,
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: `${cols * 100}% ${rows * 100}%`,
              backgroundPosition: `${(col * 100) / (cols - 1)}% ${
                (row * 100) / (rows - 1)
              }%`,
            }}
            initial={{
              opacity: 1,
              x: 0,
              y: 0,
              scale: 1,
            }}
            animate={
              isBroken
                ? {
                    opacity: 1,
                    x: Math.random() * 300 - 150, // Random horizontal float
                    y: Math.random() * 300 - 150, // Random vertical float
                    scale: 1,
                  }
                : {
                    opacity: 1,
                    x: 0,
                    y: 0,
                    scale: 1, // Combine back to original
                  }
            }
            transition={{
              duration: isBroken ? 2 : 2, // Adjust duration for breaking or combining
              repeat: isBroken ? Infinity : 0, // Float when broken
              repeatType: "reverse", // Oscillating float effect
            }}
          />
        );
      })}
    </div>
  );
};

export default PictureBreakAndCombine;
