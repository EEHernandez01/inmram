"use client";

import { useState, type ComponentProps } from "react";

import { Input } from "@/components/ui/form-controls";
import { formatCurrencyInput, normalizeCurrencyInput } from "@/lib/format";

type MoneyInputProps = Omit<ComponentProps<typeof Input>, "defaultValue" | "onBlur" | "onFocus" | "type" | "value"> & {
  decimalPlaces?: number;
  defaultValue?: string | number | null;
};

export function MoneyInput({ decimalPlaces = 2, defaultValue, onChange, ...props }: MoneyInputProps) {
  const initialValue = defaultValue == null ? "" : String(defaultValue);
  const [value, setValue] = useState(() => formatCurrencyInput(initialValue, decimalPlaces));

  return (
    <Input
      {...props}
      inputMode="decimal"
      onBlur={(event) => setValue(formatCurrencyInput(event.currentTarget.value, decimalPlaces))}
      onChange={(event) => {
        const raw = normalizeCurrencyInput(event.currentTarget.value);
        const pattern = new RegExp(`^\\d{0,12}(?:\\.\\d{0,${decimalPlaces}})?$`);
        if (raw === "" || pattern.test(raw)) setValue(raw);
        onChange?.(event);
      }}
      onFocus={(event) => setValue(normalizeCurrencyInput(event.currentTarget.value))}
      type="text"
      value={value}
    />
  );
}
