import React from "react";
import { Check } from "lucide-react";

type ColorPalettePickerProps = {
  palette: string[];
  value?: string | null;
  onChange?: (hex: string) => void;
};

export default function ColorPalettePicker({ palette, value, onChange }: ColorPalettePickerProps) {
  if (!palette?.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {palette.map((hex) => {
        const selected = value && hex.toLowerCase() === value.toLowerCase();
        return (
          <button
            key={hex}
            type="button"
            onClick={() => onChange?.(hex)}
            className={`relative h-9 w-9 rounded-full ring-offset-background transition focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${selected ? 'ring-2 ring-primary' : 'ring-0'}`}
            aria-label={`Choisir la couleur ${hex}`}
            aria-pressed={selected}
            title={hex}
            style={{ backgroundColor: hex }}
          >
            {selected && (
              <span className="absolute inset-0 grid place-items-center">
                <Check className="h-4 w-4 text-primary-foreground" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
