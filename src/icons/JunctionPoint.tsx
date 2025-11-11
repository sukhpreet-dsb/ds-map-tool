export const JunctionPoint = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
    <rect x="5" y="5" width="14" height="14" fill="red" stroke="black" strokeWidth="1" />
    <circle cx="12" cy="12" r="2" fill="black" />
  </svg>
);
