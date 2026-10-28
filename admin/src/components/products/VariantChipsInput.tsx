import React, { useState } from 'react';
import { X } from 'lucide-react';

export interface VariantChipsInputProps {
  label: string;
  placeholder?: string;
  values: string[];
  onChange: (values: string[]) => void;
  presets?: { label: string; items: string[] }[];
  clearOptionLabel?: string;
}

export const VariantChipsInput: React.FC<VariantChipsInputProps> = ({
  label,
  placeholder = 'Add value and press Enter...',
  values,
  onChange,
  presets,
  clearOptionLabel,
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || values.includes(trimmed)) return;
    onChange([...values, trimmed]);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAdd(inputValue);
    }
  };

  const handleRemove = (itemToRemove: string) => {
    onChange(values.filter((v) => v !== itemToRemove));
  };

  const handleApplyPreset = (items: string[]) => {
    // Merge without duplicates
    const set = new Set([...values, ...items]);
    onChange(Array.from(set));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </label>

        {/* Quick Presets Bar */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {presets?.map((p) => (
            <button
              type="button"
              key={p.label}
              onClick={() => handleApplyPreset(p.items)}
              className="text-[11px] px-2 py-0.5 rounded border border-input hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              + {p.label}
            </button>
          ))}
          {clearOptionLabel && values.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-[11px] px-2 py-0.5 rounded border border-destructive/30 hover:bg-destructive/10 text-destructive transition-colors"
            >
              {clearOptionLabel}
            </button>
          )}
        </div>
      </div>

      {/* Chips Container */}
      <div className="min-h-[42px] p-1.5 rounded-md border border-input bg-transparent flex flex-wrap gap-1.5 items-center">
        {values.map((val) => (
          <span
            key={val}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground border shadow-sm"
          >
            <span>{val}</span>
            <button
              type="button"
              onClick={() => handleRemove(val)}
              className="text-muted-foreground hover:text-foreground p-0.5 rounded-full"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        <input
          type="text"
          placeholder={values.length === 0 ? placeholder : 'Add more...'}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (inputValue.trim()) handleAdd(inputValue);
          }}
          className="flex-1 min-w-[120px] bg-transparent text-xs outline-none placeholder:text-muted-foreground p-1"
        />
      </div>
    </div>
  );
};
