import "server-only";

type BanxicoResponse = {
  bmx?: {
    series?: Array<{
      datos?: Array<{ dato?: string; fecha?: string }>;
    }>;
  };
};

export type InpcSuggestion = {
  month: string;
  value: string;
  annualPercent: number | null;
};

const inpcSeries = "SP1";
// CP151: inflación anual del INPC general.
const annualInflationSeries = "SP30578";

function monthFromBanxicoDate(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  return `${match[3]}-${match[2]}`;
}

export async function obtenerSugerenciaInpc(): Promise<InpcSuggestion | null> {
  const token = process.env.BANXICO_SIE_TOKEN?.trim();
  if (!token) return null;

  try {
    const latestResponse = await fetch(
      `https://www.banxico.org.mx/SieAPIRest/service/v1/series/${inpcSeries}/datos/oportuno`,
      { headers: { "Bmx-Token": token }, cache: "no-store" },
    );
    if (!latestResponse.ok) return null;

    const latestBody = await latestResponse.json() as BanxicoResponse;
    const data = latestBody.bmx?.series?.[0]?.datos?.at(-1);
    if (!data?.dato || !data.fecha) return null;

    const month = monthFromBanxicoDate(data.fecha);
    const value = Number(data.dato.replace(/,/g, ""));
    if (!month || !Number.isFinite(value)) return null;

    const annualResponse = await fetch(
      `https://www.banxico.org.mx/SieAPIRest/service/v1/series/${annualInflationSeries}/datos/oportuno`,
      { headers: { "Bmx-Token": token }, cache: "no-store" },
    );
    const annualBody = annualResponse.ok ? await annualResponse.json() as BanxicoResponse : null;
    const annualData = annualBody?.bmx?.series?.[0]?.datos?.at(-1);
    const annualValue = annualData?.dato ? Number(annualData.dato.replace(/,/g, "")) : null;
    // Sólo mostramos el dato cuando corresponde al mismo mes que el nivel del INPC.
    const annualPercent = monthFromBanxicoDate(annualData?.fecha ?? "") === month && annualValue !== null && Number.isFinite(annualValue)
      ? annualValue
      : null;
    return { month, value: value.toFixed(8), annualPercent };
  } catch {
    return null;
  }
}
