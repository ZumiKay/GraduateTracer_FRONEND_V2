import React from "react";

export const DownArrow = (props?: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={props?.className || "h-7 w-7"}
      {...props}
    >
      <path
        fillRule="evenodd"
        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
};




export const ThemeIcon = ({ dark }: { dark: boolean }) => {
  return (
    <svg
      version="1.0"
      xmlns="http://www.w3.org/2000/svg"
      width="30.000000pt"
      height="30.000000pt"
      viewBox="0 0 64.000000 64.000000"
      preserveAspectRatio="xMidYMid meet"
    >
      <g
        transform="translate(0.000000,64.000000) scale(0.100000,-0.100000)"
        fill={dark ? "#ffffff" : "#000000"}
        stroke="none"
      >
        <path
          d="M250 571 c-71 -23 -131 -74 -166 -141 -25 -48 -26 -172 -1 -217 46
 -86 120 -140 206 -150 63 -7 78 10 64 72 -13 59 -7 90 28 124 34 35 65 41 124
 28 62 -14 79 1 72 65 -10 84 -64 160 -142 200 -43 22 -144 33 -185 19z m84
 -67 c19 -18 20 -28 6 -55 -19 -35 -80 -18 -80 22 0 21 26 49 45 49 7 0 21 -7
 29 -16z m144 -66 c7 -7 12 -21 12 -33 0 -29 -19 -45 -52 -45 -36 0 -56 36 -39
 69 13 23 59 29 79 9z m-268 -13 c15 -18 10 -45 -12 -59 -35 -22 -74 27 -48 59
 16 19 44 19 60 0z m-21 -134 c15 -27 -9 -56 -37 -47 -21 7 -31 44 -15 59 13
 13 42 7 52 -12z"
        />
      </g>
    </svg>
  );
};

export const MoonIcon = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      focusable="false"
      height="1em"
      role="presentation"
      viewBox="0 0 24 24"
      width="1em"
      {...props}
    >
      <path
        d="M21.53 15.93c-.16-.27-.61-.69-1.73-.49a8.46 8.46 0 01-1.88.13 8.409 8.409 0 01-5.91-2.82 8.068 8.068 0 01-1.44-8.66c.44-1.01.13-1.54-.09-1.76s-.77-.55-1.83-.11a10.318 10.318 0 00-6.32 10.21 10.475 10.475 0 007.04 8.99 10 10 0 002.89.55c.16.01.32.02.48.02a10.5 10.5 0 008.47-4.27c.67-.93.49-1.519.32-1.79z"
        fill="currentColor"
      />
    </svg>
  );
};

export const SunIcon = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      focusable="false"
      height="1em"
      role="presentation"
      viewBox="0 0 24 24"
      width="1em"
      {...props}
    >
      <g fill="currentColor">
        <path d="M19 12a7 7 0 11-7-7 7 7 0 017 7z" />
        <path d="M12 22.96a.969.969 0 01-1-.96v-.08a1 1 0 012 0 1.038 1.038 0 01-1 1.04zm7.14-2.82a1.024 1.024 0 01-.71-.29l-.13-.13a1 1 0 011.41-1.41l.13.13a1 1 0 010 1.41.984.984 0 01-.7.29zm-14.28 0a1.024 1.024 0 01-.71-.29 1 1 0 010-1.41l.13-.13a1 1 0 011.41 1.41l-.13.13a1 1 0 01-.7.29zM22 13h-.08a1 1 0 010-2 1.038 1.038 0 011.04 1 .969.969 0 01-.96 1zM2.08 13H2a1 1 0 010-2 1.038 1.038 0 011.04 1 .969.969 0 01-.96 1zm16.93-7.01a1.024 1.024 0 01-.71-.29 1 1 0 010-1.41l.13-.13a1 1 0 011.41 1.41l-.13.13a.984.984 0 01-.7.29zm-14.02 0a1.024 1.024 0 01-.71-.29l-.13-.14a1 1 0 011.41-1.41l.13.13a1 1 0 010 1.41.97.97 0 01-.7.3zM12 3.04a.969.969 0 01-1-.96V2a1 1 0 012 0 1.038 1.038 0 01-1 1.04z" />
      </g>
    </svg>
  );
};

export const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
      {...props}
    >
      {/* Trash can body */}
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c0-1 1-2 2-2v2" />

      {/* Vertical lines inside */}
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
};

export const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      fill="none"
      focusable="false"
      height="1em"
      role="presentation"
      viewBox="0 0 24 24"
      width="1em"
      {...props}
    >
      <path
        d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M22 22L20 20"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
};

export const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="800px"
      height="800px"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13 9C13 8.44772 12.5523 8 12 8C11.4477 8 11 8.44772 11 9V11H9C8.44772 11 8 11.4477 8 12C8 12.5523 8.44772 13 9 13H11V15C11 15.5523 11.4477 16 12 16C12.5523 16 13 15.5523 13 15V13H15C15.5523 13 16 12.5523 16 12C16 11.4477 15.5523 11 15 11H13V9ZM7.25007 2.38782C8.54878 2.0992 10.1243 2 12 2C13.8757 2 15.4512 2.0992 16.7499 2.38782C18.06 2.67897 19.1488 3.176 19.9864 4.01358C20.824 4.85116 21.321 5.94002 21.6122 7.25007C21.9008 8.54878 22 10.1243 22 12C22 13.8757 21.9008 15.4512 21.6122 16.7499C21.321 18.06 20.824 19.1488 19.9864 19.9864C19.1488 20.824 18.06 21.321 16.7499 21.6122C15.4512 21.9008 13.8757 22 12 22C10.1243 22 8.54878 21.9008 7.25007 21.6122C5.94002 21.321 4.85116 20.824 4.01358 19.9864C3.176 19.1488 2.67897 18.06 2.38782 16.7499C2.0992 15.4512 2 13.8757 2 12C2 10.1243 2.0992 8.54878 2.38782 7.25007C2.67897 5.94002 3.176 4.85116 4.01358 4.01358C4.85116 3.176 5.94002 2.67897 7.25007 2.38782Z"
        fill="#ffffff"
        className="fill-white dark:fill-black"
      />
    </svg>
  );
};

export const ListIcon = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      version="1.0"
      xmlns="http://www.w3.org/2000/svg"
      width="64.000000pt"
      height="64.000000pt"
      viewBox="0 0 64.000000 64.000000"
      preserveAspectRatio="xMidYMid meet"
      {...props}
    >
      <g
        transform="translate(0.000000,64.000000) scale(0.100000,-0.100000)"
        fill={props.fill ?? "#000000"}
        stroke="none"
      >
        <path
          d="M12 528 c-18 -18 -15 -36 7 -48 15 -7 23 -6 35 6 9 8 16 19 16 23 0
11 -23 31 -35 31 -6 0 -16 -5 -23 -12z"
        />
        <path
          d="M162 508 c3 -23 3 -23 228 -25 124 -2 231 1 239 6 8 5 11 16 8 25 -6
14 -35 16 -242 16 l-236 0 3 -22z"
        />
        <path
          d="M4 335 c-10 -25 4 -45 30 -45 25 0 39 20 30 45 -4 8 -17 15 -30 15
-14 0 -27 -7 -30 -15z"
        />
        <path
          d="M160 321 c0 -10 7 -22 16 -25 9 -3 109 -6 223 -6 158 0 212 3 226 13
42 32 8 37 -231 37 -223 0 -234 -1 -234 -19z"
        />
        <path
          d="M14 156 c-10 -8 -15 -20 -11 -30 9 -24 36 -31 53 -14 29 29 -8 68
-42 44z"
        />
        <path
          d="M167 153 c-4 -3 -7 -15 -7 -25 0 -17 14 -18 235 -18 207 0 236 2 242
16 3 9 0 20 -8 25 -16 10 -452 12 -462 2z"
        />
      </g>
    </svg>
  );
};
export const DeleteIcon = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      version="1.0"
      xmlns="http://www.w3.org/2000/svg"
      width="64.000000pt"
      height="64.000000pt"
      viewBox="0 0 64.000000 64.000000"
      preserveAspectRatio="xMidYMid meet"
      {...props}
    >
      <g
        transform="translate(0.000000,64.000000) scale(0.100000,-0.100000)"
        fill={props.fill ? props.fill : "#000"}
        stroke="none"
      >
        <path
          d="M246 631 c-92 -24 -173 -90 -215 -176 -19 -41 -24 -66 -24 -135 -1
-78 2 -90 33 -148 38 -70 70 -100 145 -140 43 -22 64 -26 136 -26 72 0 93 4
136 26 75 40 107 70 145 140 31 58 34 70 33 148 0 72 -4 93 -26 136 -39 75
-70 107 -137 143 -65 34 -164 49 -226 32z m32 -233 l43 -42 43 42 c76 75 110
41 35 -35 l-42 -43 42 -43 c75 -76 41 -110 -35 -35 l-43 42 -43 -42 c-76 -75
-110 -41 -35 35 l42 43 -42 43 c-75 76 -41 110 35 35z"
        />
      </g>
    </svg>
  );
};

export const CopyIcon = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      version="1.0"
      xmlns="http://www.w3.org/2000/svg"
      width="64.000000pt"
      height="64.000000pt"
      viewBox="0 0 64.000000 64.000000"
      preserveAspectRatio="xMidYMid meet"
      {...props}
    >
      <g
        transform="translate(0.000000,64.000000) scale(0.100000,-0.100000)"
        fill="#000000"
        stroke="none"
      >
        <path
          d="M245 588 c-29 -17 -35 -28 -35 -75 l0 -43 101 0 c98 0 101 -1 130
-29 28 -29 29 -32 29 -130 l0 -101 55 0 c90 0 95 9 95 190 0 147 -1 152 -25
175 -23 24 -28 25 -177 25 -95 0 -161 -5 -173 -12z"
        />
        <path
          d="M37 412 c-14 -16 -17 -43 -17 -173 0 -118 3 -160 14 -175 13 -17 30
-19 181 -22 230 -5 215 -18 215 193 0 135 -3 166 -16 179 -13 13 -44 16 -188
16 -155 0 -175 -2 -189 -18z"
        />
      </g>
    </svg>
  );
};

export const ShowLinkedIcon = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      version="1.0"
      xmlns="http://www.w3.org/2000/svg"
      width="64.000000pt"
      height="64.000000pt"
      viewBox="0 0 64.000000 64.000000"
      preserveAspectRatio="xMidYMid meet"
      {...props}
    >
      <g
        transform="translate(0.000000,64.000000) scale(0.100000,-0.100000)"
        fill="#000000"
        stroke="none"
      >
        <path
          d="M180 560 c-47 -13 -92 -46 -120 -88 -22 -33 -25 -47 -25 -112 0 -65
3 -79 25 -112 28 -42 73 -75 120 -88 32 -9 68 -9 100 0 47 13 92 46 120 88
22 33 25 47 25 112 0 65 -3 79 -25 112 -28 42 -73 75 -120 88 -32 9 -68 9
-100 0z m90 -70 c42 -20 70 -60 70 -100 0 -40 -28 -80 -70 -100 -30 -14 -50
-14 -80 0 -42 20 -70 60 -70 100 0 40 28 80 70 100 30 14 50 14 80 0z"
        />
        <path
          d="M420 560 c-47 -13 -92 -46 -120 -88 -22 -33 -25 -47 -25 -112 0 -65
3 -79 25 -112 28 -42 73 -75 120 -88 32 -9 68 -9 100 0 47 13 92 46 120 88
22 33 25 47 25 112 0 65 -3 79 -25 112 -28 42 -73 75 -120 88 -32 9 -68 9
-100 0z m90 -70 c42 -20 70 -60 70 -100 0 -40 -28 -80 -70 -100 -30 -14 -50
-14 -80 0 -42 20 -70 60 -70 100 0 40 28 80 70 100 30 14 50 14 80 0z"
        />
        <path
          d="M290 390 c-11 -7 -20 -17 -20 -23 0 -6 9 -16 20 -23 18 -12 22 -12
40 0 11 7 20 17 20 23 0 6 -9 16 -20 23 -18 12 -22 12 -40 0z"
        />
        <path
          d="M350 350 c-11 -7 -20 -17 -20 -23 0 -6 9 -16 20 -23 18 -12 22 -12
40 0 11 7 20 17 20 23 0 6 -9 16 -20 23 -18 12 -22 12 -40 0z"
        />
        <path
          d="M230 350 c-11 -7 -20 -17 -20 -23 0 -6 9 -16 20 -23 18 -12 22 -12
40 0 11 7 20 17 20 23 0 6 -9 16 -20 23 -18 12 -22 12 -40 0z"
        />
      </g>
    </svg>
  );
};
