/** SVG icons reused across the ehans-mart template markup (paths copied verbatim). */

export function CloseIcon({ size = 10, fill = '#0B0802' }: { size?: number; fill?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 10 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9.85403 9.14653C9.90048 9.19298 9.93733 9.24813 9.96247 9.30883C9.98762 9.36953 10.0006 9.43458 10.0006 9.50028C10.0006 9.56598 9.98762 9.63103 9.96247 9.69173C9.93733 9.75242 9.90048 9.80757 9.85403 9.85403C9.80757 9.90048 9.75242 9.93733 9.69173 9.96247C9.63103 9.98762 9.56598 10.0006 9.50028 10.0006C9.43458 10.0006 9.36953 9.98762 9.30883 9.96247C9.24813 9.93733 9.19298 9.90048 9.14653 9.85403L5.00028 5.70715L0.854028 9.85403C0.760208 9.94785 0.63296 10.0006 0.500278 10.0006C0.367596 10.0006 0.240348 9.94785 0.146528 9.85403C0.0527077 9.76021 2.61548e-09 9.63296 0 9.50028C-2.61548e-09 9.3676 0.0527077 9.24035 0.146528 9.14653L4.2934 5.00028L0.146528 0.854028C0.0527077 0.760208 0 0.63296 0 0.500278C0 0.367596 0.0527077 0.240348 0.146528 0.146528C0.240348 0.0527077 0.367596 0 0.500278 0C0.63296 0 0.760208 0.0527077 0.854028 0.146528L5.00028 4.2934L9.14653 0.146528C9.24035 0.0527077 9.3676 -2.61548e-09 9.50028 0C9.63296 2.61548e-09 9.76021 0.0527077 9.85403 0.146528C9.94785 0.240348 10.0006 0.367596 10.0006 0.500278C10.0006 0.63296 9.94785 0.760208 9.85403 0.854028L5.70715 5.00028L9.85403 9.14653Z"
        fill={fill}
      ></path>
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M9.16667 15.8333C12.8486 15.8333 15.8333 12.8486 15.8333 9.16667C15.8333 5.48477 12.8486 2.5 9.16667 2.5C5.48477 2.5 2.5 5.48477 2.5 9.16667C2.5 12.8486 5.48477 15.8333 9.16667 15.8333Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
      <path
        d="M17.5 17.5L13.875 13.875"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
    </svg>
  );
}

export function BackArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M16 10H4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"></path>
      <path
        d="M8 6L4 10L8 14"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
    </svg>
  );
}

export function HeaderCartIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M2.5 3.5H4.6l1.6 7.7c.17.82.89 1.4 1.73 1.4h6.17c.82 0 1.53-.55 1.73-1.34l1.3-5.16H5.3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
      <circle cx="8.2" cy="15.6" r="1.1" fill="currentColor"></circle>
      <circle cx="14.1" cy="15.6" r="1.1" fill="currentColor"></circle>
    </svg>
  );
}

export function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 6 6 6-6 6"></path>
    </svg>
  );
}

export function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6"></path>
    </svg>
  );
}

export function StarIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="pdp-star-icon is-filled">
      <path
        d="M8 1.333l2.06 4.174 4.607.67-3.333 3.249.786 4.587L8 11.846l-4.12 2.167.787-4.587L1.333 6.177l4.607-.67L8 1.333Z"
        fill="currentColor"
      ></path>
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg width="12" height="13" viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M11.375 2H0.375C0.275544 2 0.180161 2.03951 0.109835 2.10983C0.0395088 2.18016 0 2.27554 0 2.375C0 2.47446 0.0395088 2.56984 0.109835 2.64017C0.180161 2.71049 0.275544 2.75 0.375 2.75H1V11.875C1 12.1071 1.09219 12.3296 1.25628 12.4937C1.42038 12.6578 1.64294 12.75 1.875 12.75H9.875C10.1071 12.75 10.3296 12.6578 10.4937 12.4937C10.6578 12.3296 10.75 12.1071 10.75 11.875V2.75H11.375C11.4745 2.75 11.5698 2.71049 11.6402 2.64017C11.7105 2.56984 11.75 2.47446 11.75 2.375C11.75 2.27554 11.7105 2.18016 11.6402 2.10983C11.5698 2.03951 11.4745 2 11.375 2ZM10 11.875C10 11.9082 9.98683 11.9399 9.96339 11.9634C9.93995 11.9868 9.90815 12 9.875 12H1.875C1.84185 12 1.81005 11.9868 1.78661 11.9634C1.76317 11.9399 1.75 11.9082 1.75 11.875V2.75H10V11.875ZM3 0.375C3 0.275544 3.03951 0.180161 3.10984 0.109835C3.18016 0.0395088 3.27554 0 3.375 0H8.375C8.47446 0 8.56984 0.0395088 8.64017 0.109835C8.71049 0.180161 8.75 0.275544 8.75 0.375C8.75 0.474456 8.71049 0.569839 8.64017 0.640165C8.56984 0.710491 8.47446 0.75 8.375 0.75H3.375C3.27554 0.75 3.18016 0.710491 3.10984 0.640165C3.03951 0.569839 3 0.474456 3 0.375Z"
        fill="black"
      />
    </svg>
  );
}
