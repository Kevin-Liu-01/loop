import type { SVGProps } from "react";

type LoopLogoProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

export function LoopLogo({ title = "Loop", ...props }: LoopLogoProps) {
  return (
    <svg fill="none" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" {...props}>
      <title>{title}</title>
      <path
        d="M60 18C36.804 18 18 36.804 18 60C18 83.196 36.804 102 60 102C83.196 102 102 83.196 102 60C102 36.804 83.196 18 60 18Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="12"
      />
      <path
        d="M48 34V78H80"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="12"
      />
    </svg>
  );
}
