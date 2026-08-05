"use client";

export function PlacePreview({
  address,
  googleMapsUri,
  latitude,
  longitude,
}: {
  address: string;
  googleMapsUri?: string;
  latitude: number;
  longitude: number;
}) {
  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(`${latitude},${longitude}`)}&z=17&output=embed`;
  const mapsLink = googleMapsUri ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}`;

  return (
    <div className="overflow-hidden rounded-card border border-border bg-bg">
      <div className="relative min-h-64 bg-border/40">
        <iframe
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={mapUrl}
          title={`Mapa de ${address}`}
        />
      </div>
      <div className="border-t border-border bg-surface px-4 py-3 text-xs text-ink-secondary">
        <a className="font-semibold text-brand hover:text-brand-hover" href={mapsLink} rel="noreferrer" target="_blank">
          Ver en Google Maps
        </a>
      </div>
    </div>
  );
}
