// components/ui/LoadingButton.tsx
import { ButtonHTMLAttributes, useState } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  onClick?: () => Promise<any> | void;
  full?: boolean;
};

export default function LoadingButton({ onClick, full, children, className="", ...rest }: Props) {
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (loading) return;
    try {
      const r = onClick?.();
      if (r && typeof (r as any).then === "function") {
        setLoading(true);
        await r;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      {...rest}
      onClick={handle}
      disabled={loading || rest.disabled}
      aria-busy={loading ? "true" : "false"}
      className={[
        "px-4 py-2 rounded-lg border hover:bg-gray-50 dark:border-white/20",
        "disabled:opacity-60 disabled:cursor-not-allowed select-none",
        full ? "" : "",
        className,
      ].join(" ")}
    >
      {loading && (
        <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
          <path d="M22 12a10 10 0 0 1-10 10" fill="currentColor" />
        </svg>
      )}
      {children}
    </button>
  );
}