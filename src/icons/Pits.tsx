export const Pits = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
    <line x1="4" y1="12" x2="20" y2="12" stroke="red" strokeWidth="5" />
    <line x1="12" y1="4" x2="12" y2="20" stroke="red" strokeWidth="5" />
  </svg>
);
