
'use client';

import { cn } from "@/lib/utils";

interface ColorSwatchProps {
  colorHex: string;
  className?: string;
  title?: string;
}

export const ColorSwatch = ({ colorHex, className, title }: ColorSwatchProps) => {
  const colors = colorHex.split('/').map(c => c.trim());

  if (colors.length === 2) {
    return (
      <div
        className={cn(
            "h-6 w-6 rounded-full border",
            className
        )}
        title={title}
        style={{
          background: `linear-gradient(to right, ${colors[0]} 50%, ${colors[1]} 50%)`,
        }}
      >
        <span className="sr-only">{title}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "h-6 w-6 rounded-full border",
        className
      )}
      title={title}
      style={{ backgroundColor: colors[0] }}
    >
      <span className="sr-only">{title}</span>
    </div>
  );
};

    