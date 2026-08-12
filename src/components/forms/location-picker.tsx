"use client";

import { useEffect, useId, useRef, useState } from "react";

import { PlacePreview } from "@/components/maps/place-preview";
import { Input } from "@/components/ui/form-controls";

type AddressParts = {
  calle: string;
  numero: string;
  colonia: string;
  municipio: string;
  ciudad: string;
  estado: string;
  codigoPostal: string;
};

type Suggestion = {
  id: string;
  label: string;
  secondaryText: string;
  prediction: PlacePrediction;
};

type PlaceSelection = {
  placeId: string;
  address: string;
  latitude: number;
  longitude: number;
  googleMapsUri?: string;
};

type LocationDefaults = {
  address?: string;
  googlePlaceId?: string;
  latitude?: string;
  longitude?: string;
};

type GoogleMapsWindow = Window & {
  google?: {
    maps: {
      importLibrary: (name: "places") => Promise<PlacesLibrary>;
    };
  };
};

type PlacesLibrary = {
  AutocompleteSessionToken: new () => AutocompleteSessionToken;
  AutocompleteSuggestion: {
    fetchAutocompleteSuggestions: (request: AutocompleteRequest) => Promise<{ suggestions: AutocompleteSuggestion[] }>;
  };
};

type AutocompleteSessionToken = object;

type AutocompleteRequest = {
  input: string;
  includedRegionCodes: string[];
  language: string;
  region: string;
  sessionToken: AutocompleteSessionToken;
};

type AutocompleteSuggestion = {
  placePrediction?: PlacePrediction;
};

type PlacePrediction = {
  placeId: string;
  mainText?: { toString: () => string };
  secondaryText?: { toString: () => string };
  text: { toString: () => string };
  toPlace: () => Place;
};

type Place = {
  id?: string;
  formattedAddress?: string;
  googleMapsURI?: string;
  location?: { lat: () => number; lng: () => number } | { lat: number; lng: number };
  addressComponents?: AddressComponent[];
  fetchFields: (request: { fields: string[] }) => Promise<void>;
};

type AddressComponent = {
  longText?: string;
  shortText?: string;
  long_name?: string;
  short_name?: string;
  types: string[];
};

const emptyAddressParts: AddressParts = {
  calle: "",
  numero: "",
  colonia: "",
  municipio: "",
  ciudad: "",
  estado: "",
  codigoPostal: "",
};

let mapsLoader: Promise<PlacesLibrary> | null = null;

function loadPlacesLibrary(apiKey: string) {
  if (mapsLoader) return mapsLoader;

  mapsLoader = new Promise<PlacesLibrary>((resolve, reject) => {
    const googleWindow = window as GoogleMapsWindow;

    if (googleWindow.google?.maps.importLibrary) {
      googleWindow.google.maps.importLibrary("places").then(resolve).catch(reject);
      return;
    }

    const callbackName = `initGooglePlaces${Date.now()}`;
    const script = document.createElement("script");
    const params = new URLSearchParams({
      key: apiKey,
      v: "weekly",
      libraries: "places",
      loading: "async",
      language: "es",
      region: "MX",
      callback: callbackName,
    });

    (window as unknown as Record<string, () => void>)[callbackName] = () => {
      delete (window as unknown as Record<string, () => void>)[callbackName];
      googleWindow.google?.maps.importLibrary("places").then(resolve).catch(reject);
    };

    script.async = true;
    script.onerror = () => {
      delete (window as unknown as Record<string, () => void>)[callbackName];
      reject(new Error("Google Maps no pudo cargarse."));
    };
    script.src = `https://maps.googleapis.com/maps/api/js?${params}`;
    document.head.append(script);
  });

  return mapsLoader;
}

function componentText(component: AddressComponent | undefined, short = false) {
  if (!component) return "";
  return (short ? component.shortText ?? component.short_name : component.longText ?? component.long_name) ?? "";
}

function findComponent(components: AddressComponent[] | undefined, type: string) {
  return components?.find((component) => component.types.includes(type));
}

function addressPartsFromPlace(place: Place): AddressParts {
  const components = place.addressComponents ?? [];
  const municipality =
    findComponent(components, "administrative_area_level_2") ??
    findComponent(components, "locality") ??
    findComponent(components, "sublocality_level_1");
  const city =
    findComponent(components, "locality") ??
    findComponent(components, "postal_town") ??
    findComponent(components, "administrative_area_level_2");

  return {
    calle: componentText(findComponent(components, "route")),
    numero: componentText(findComponent(components, "street_number")),
    colonia:
      componentText(findComponent(components, "neighborhood")) ||
      componentText(findComponent(components, "sublocality_level_1")) ||
      componentText(findComponent(components, "sublocality")),
    municipio: componentText(municipality),
    ciudad: componentText(city),
    estado: componentText(findComponent(components, "administrative_area_level_1")),
    codigoPostal: componentText(findComponent(components, "postal_code")),
  };
}

function formatAddress(parts: AddressParts, fallback = "") {
  const street = [parts.calle, parts.numero].filter(Boolean).join(" ");
  const address = [
    street,
    parts.colonia,
    parts.municipio,
    parts.ciudad,
    parts.estado,
    parts.codigoPostal ? `C.P. ${parts.codigoPostal}` : "",
    "Mexico",
  ].filter(Boolean).join(", ");

  return address || fallback;
}

function coordinates(location: Place["location"]) {
  if (!location) return null;
  const latitude = typeof location.lat === "function" ? location.lat() : location.lat;
  const longitude = typeof location.lng === "function" ? location.lng() : location.lng;
  return { latitude: Number(latitude.toFixed(6)), longitude: Number(longitude.toFixed(6)) };
}

export function LocationPicker({ defaults, enabled }: { defaults?: LocationDefaults; enabled: boolean }) {
  const listId = useId();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";
  const [completeAddress, setCompleteAddress] = useState(defaults?.address ?? "");
  const [addressParts, setAddressParts] = useState<AddressParts>(() => ({
    ...emptyAddressParts,
    calle: defaults?.address ?? "",
  }));
  const [selection, setSelection] = useState<PlaceSelection | null>(() => {
    if (!defaults?.googlePlaceId || !defaults.latitude || !defaults.longitude) return null;
    return {
      placeId: defaults.googlePlaceId,
      address: defaults.address ?? "Ubicacion guardada",
      latitude: Number(defaults.latitude),
      longitude: Number(defaults.longitude),
    };
  });
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [searchEnabled, setSearchEnabled] = useState(false);
  const requestId = useRef(0);
  const sessionToken = useRef<AutocompleteSessionToken | null>(null);
  const skipNextSearch = useRef(false);

  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }

    const trimmedQuery = completeAddress.trim();
    if (!searchEnabled || !enabled || !apiKey || trimmedQuery.length < 3 || selection?.address === trimmedQuery) return;

    let cancelled = false;
    const currentRequestId = ++requestId.current;
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setMessage("");

      try {
        const { AutocompleteSessionToken, AutocompleteSuggestion } = await loadPlacesLibrary(apiKey);
        sessionToken.current ??= new AutocompleteSessionToken();
        const data = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: trimmedQuery,
          includedRegionCodes: ["mx"],
          language: "es-MX",
          region: "mx",
          sessionToken: sessionToken.current,
        });

        if (cancelled || currentRequestId !== requestId.current) return;
        const nextSuggestions = data.suggestions.flatMap((suggestion) => {
          if (!suggestion.placePrediction) return [];
          const prediction = suggestion.placePrediction;
          return [{
            id: prediction.placeId,
            label: prediction.mainText?.toString() ?? prediction.text.toString(),
            secondaryText: prediction.secondaryText?.toString() ?? "",
            prediction,
          }];
        }).slice(0, 5);

        setSuggestions(nextSuggestions);
        setActiveIndex(-1);
        if (nextSuggestions.length === 0) {
          setMessage("No hay resultados para esta busqueda. Puedes capturar la direccion manualmente.");
        }
      } catch {
        if (cancelled) return;
        setSuggestions([]);
        setMessage("No fue posible conectar con Google Maps. El formulario sigue disponible para captura manual.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [apiKey, completeAddress, enabled, searchEnabled, selection?.address]);

  async function chooseSuggestion(suggestion: Suggestion) {
    setLoading(true);
    setSuggestions([]);
    setMessage("");

    try {
      const place = suggestion.prediction.toPlace();
      await place.fetchFields({
        fields: ["id", "formattedAddress", "location", "addressComponents", "googleMapsURI"],
      });
      const nextParts = addressPartsFromPlace(place);
      const nextAddress = formatAddress(nextParts, place.formattedAddress);
      const nextCoordinates = coordinates(place.location);
      if (!nextCoordinates) throw new Error("El lugar no tiene coordenadas.");

      setAddressParts(nextParts);
      setSelection({
        placeId: place.id ?? suggestion.id,
        address: nextAddress,
        latitude: nextCoordinates.latitude,
        longitude: nextCoordinates.longitude,
        googleMapsUri: place.googleMapsURI,
      });
      setCompleteAddress(nextAddress);
      setActiveIndex(-1);
      sessionToken.current = null;
    } catch {
      setMessage("No pudimos cargar esa direccion. Intenta con otra opcion o captura los datos manualmente.");
    } finally {
      setLoading(false);
    }
  }

  function updateCompleteAddress(value: string) {
    setSearchEnabled(true);
    setAddressParts({ ...emptyAddressParts, calle: value });
    setCompleteAddress(value);
    setSelection(null);
    setSuggestions([]);
    setActiveIndex(-1);
    setMessage(value.trim().length > 0 && value.trim().length < 3 ? "Escribe al menos 3 caracteres para buscar sugerencias." : "");
  }

  function updateAddressPart(key: keyof AddressParts, value: string) {
    const nextParts = { ...addressParts, [key]: value };
    setAddressParts(nextParts);
    skipNextSearch.current = true;
    setCompleteAddress(formatAddress(nextParts, completeAddress));
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (suggestions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => current < 0 ? 0 : Math.min(current + 1, suggestions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      void chooseSuggestion(suggestions[activeIndex]);
    } else if (event.key === "Escape") {
      setSuggestions([]);
      setActiveIndex(-1);
    }
  }

  return (
    <div className="space-y-4 sm:col-span-2">
      <label className="block space-y-2 text-sm font-semibold text-ink">
        <span>Direccion</span>
        <div className="relative">
          <Input
            aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
            aria-autocomplete="list"
            aria-controls={listId}
            aria-expanded={suggestions.length > 0}
            autoComplete="street-address"
            maxLength={500}
            name="direccion"
            onClick={() => setSearchEnabled(true)}
            onChange={(event) => updateCompleteAddress(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ej. Av. Insurgentes 300, CDMX"
            required
            role="combobox"
            value={completeAddress}
          />
          {loading ? <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-normal text-ink-secondary">Buscando...</span> : null}
          {suggestions.length > 0 ? (
            <div className="absolute z-20 mt-1 max-h-80 w-full overflow-y-auto rounded border border-border bg-surface shadow-lg" id={listId} role="listbox">
              {suggestions.map((suggestion, index) => (
                <button
                  aria-selected={activeIndex === index}
                  className={`block w-full px-4 py-3 text-left hover:bg-bg ${activeIndex === index ? "bg-bg" : ""}`}
                  id={`${listId}-${index}`}
                  key={suggestion.id}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => void chooseSuggestion(suggestion)}
                  role="option"
                  type="button"
                >
                  <span className="block text-sm font-semibold text-ink">{suggestion.label}</span>
                  {suggestion.secondaryText ? <span className="mt-0.5 block text-xs font-normal text-ink-secondary">{suggestion.secondaryText}</span> : null}
                </button>
              ))}
              <div className="border-t border-border px-4 py-2 text-right text-[11px] font-semibold text-ink-secondary">Google Maps</div>
            </div>
          ) : null}
        </div>
        <span className="block text-xs font-normal text-ink-secondary">
          {enabled && apiKey ? "Escribe al menos 3 caracteres y elige una sugerencia de Mexico." : "Puedes capturar la direccion manualmente. Configura NEXT_PUBLIC_GOOGLE_MAPS_API_KEY para activar sugerencias."}
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block space-y-2 text-sm font-semibold text-ink">
          <span>Calle</span>
          <Input autoComplete="address-line1" maxLength={250} onChange={(event) => updateAddressPart("calle", event.target.value)} required value={addressParts.calle} />
        </label>
        <label className="block space-y-2 text-sm font-semibold text-ink">
          <span>Numero exterior</span>
          <Input autoComplete="address-line2" maxLength={50} onChange={(event) => updateAddressPart("numero", event.target.value)} value={addressParts.numero} />
        </label>
        <label className="block space-y-2 text-sm font-semibold text-ink">
          <span>Colonia</span>
          <Input maxLength={150} onChange={(event) => updateAddressPart("colonia", event.target.value)} value={addressParts.colonia} />
        </label>
        <label className="block space-y-2 text-sm font-semibold text-ink">
          <span>Municipio o alcaldia</span>
          <Input autoComplete="address-level2" maxLength={150} onChange={(event) => updateAddressPart("municipio", event.target.value)} value={addressParts.municipio} />
        </label>
        <label className="block space-y-2 text-sm font-semibold text-ink">
          <span>Ciudad</span>
          <Input autoComplete="address-level2" maxLength={150} onChange={(event) => updateAddressPart("ciudad", event.target.value)} value={addressParts.ciudad} />
        </label>
        <label className="block space-y-2 text-sm font-semibold text-ink">
          <span>Estado</span>
          <Input autoComplete="address-level1" maxLength={150} onChange={(event) => updateAddressPart("estado", event.target.value)} value={addressParts.estado} />
        </label>
        <label className="block space-y-2 text-sm font-semibold text-ink">
          <span>Codigo postal</span>
          <Input autoComplete="postal-code" inputMode="numeric" maxLength={10} onChange={(event) => updateAddressPart("codigoPostal", event.target.value)} value={addressParts.codigoPostal} />
        </label>
      </div>

      <input name="googlePlaceId" type="hidden" value={selection?.placeId ?? ""} />
      <input name="latitud" type="hidden" value={selection?.latitude ?? ""} />
      <input name="longitud" type="hidden" value={selection?.longitude ?? ""} />

      {message ? <p aria-live="polite" className="text-xs text-ink-secondary">{message}</p> : null}
      {selection ? <PlacePreview key={selection.placeId} {...selection} /> : null}
    </div>
  );
}
