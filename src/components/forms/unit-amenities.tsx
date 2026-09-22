"use client";

import { useState } from "react";

import { Input } from "@/components/ui/form-controls";
import { unitAmenities, type UnitAmenityDetails } from "@/lib/unit-amenities";

export function UnitAmenities({ defaults, details }: { defaults?: string[]; details?: UnitAmenityDetails }) {
  const [selected, setSelected] = useState(() => new Set(defaults ?? []));
  const isSelected = (amenity: string) => selected.has(amenity);

  function toggleAmenity(amenity: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(amenity);
      else next.delete(amenity);
      return next;
    });
  }

  return (
    <fieldset>
      <legend className="text-sm font-semibold text-ink">Amenidades</legend>
      <p className="mt-2 text-xs text-ink-secondary">Selecciona las amenidades disponibles en la unidad.</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-normal sm:grid-cols-3">
        {unitAmenities.map((item) => (
          <label className="flex items-center gap-2 rounded-lg bg-bg px-3 py-2" key={item}>
            <input checked={isSelected(item)} name="amenidades" onChange={(event) => toggleAmenity(item, event.target.checked)} type="checkbox" value={item} />
            {item}
          </label>
        ))}
      </div>
      {isSelected("Roof garden") || isSelected("Balcón") || isSelected("Estacionamiento") ? (
        <div className="mt-4 grid gap-4 rounded-xl border border-brand/10 bg-bg/50 p-4 sm:grid-cols-3">
          {isSelected("Roof garden") ? <label className="block space-y-2 text-sm font-semibold text-ink">Metros cuadrados de roof garden<Input defaultValue={details?.roofGardenMetrosCuadrados} inputMode="decimal" max="99999999.99" min="0.01" name="roofGardenMetrosCuadrados" placeholder="0.00" required step="0.01" /></label> : null}
          {isSelected("Balcón") ? <label className="block space-y-2 text-sm font-semibold text-ink">Metros cuadrados de balcón<Input defaultValue={details?.balconMetrosCuadrados} inputMode="decimal" max="99999999.99" min="0.01" name="balconMetrosCuadrados" placeholder="0.00" required step="0.01" /></label> : null}
          {isSelected("Estacionamiento") ? <label className="block space-y-2 text-sm font-semibold text-ink">Cajones de estacionamiento<Input defaultValue={details?.cajonesEstacionamiento} max={1000} min={1} name="cajonesEstacionamiento" placeholder="0" required step={1} type="number" /></label> : null}
        </div>
      ) : null}
    </fieldset>
  );
}
