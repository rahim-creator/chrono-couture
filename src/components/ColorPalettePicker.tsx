import React from "react";

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
            className={`relative h-8 w-8 rounded-full ring-offset-background transition focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${selected ? 'ring-2 ring-primary' : ''}`}
            aria-label={`Choisir la couleur ${hex}`}
            title={hex}
            style={{ backgroundColor: hex }}
          >
            {selected && (
              <span className="absolute -right-1 -top-1 inline-flex h-3 w-3 items-center justify-center rounded-full bg-primary"></span>
            )}
          </button>
        );
      })}
    </div>
  );
}
