export function TaiwanFlag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 40"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="대만국기"
    >
      <rect width="60" height="40" fill="#fe0000" />
      <rect width="30" height="20" fill="#000095" />
      <g transform="translate(15 10)">
        <polygon
          points="0,-8.5 1.04,-3.86 4.25,-7.36 2.83,-2.83 7.36,-4.25 3.86,-1.04 8.5,0 3.86,1.04 7.36,4.25 2.83,2.83 4.25,7.36 1.04,3.86 0,8.5 -1.04,3.86 -4.25,7.36 -2.83,2.83 -7.36,4.25 -3.86,1.04 -8.5,0 -3.86,-1.04 -7.36,-4.25 -2.83,-2.83 -4.25,-7.36 -1.04,-3.86"
          fill="#ffffff"
        />
        <circle r="3.8" fill="#000095" />
        <circle r="2.4" fill="#ffffff" />
      </g>
    </svg>
  );
}
