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
};

export type BanxicoInflationObservation = {
  month: string;
  percent: number;
};

export type BanxicoInflationHistory = {
  monthly: BanxicoInflationObservation[];
  annual: BanxicoInflationObservation[];
};

const inpcSeries = "SP1";
// CP151: inflación mensual y anual del INPC general.
const monthlyInflationSeries = "SP30577";
const annualInflationSeries = "SP30578";

function monthFromBanxicoDate(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  return `${match[3]}-${match[2]}`;
}

function observationsFromBanxico(response: BanxicoResponse, firstYear: number, lastYear: number): BanxicoInflationObservation[] {
  return (response.bmx?.series?.[0]?.datos ?? []).flatMap((item) => {
    const month = item.fecha ? monthFromBanxicoDate(item.fecha) : null;
    const percent = item.dato ? Number(item.dato.replace(/,/g, "")) : Number.NaN;
    const year = month ? Number(month.slice(0, 4)) : Number.NaN;
    return month && year >= firstYear && year <= lastYear && Number.isFinite(percent) ? [{ month, percent }] : [];
  }).sort((left, right) => left.month.localeCompare(right.month));
}

async function fetchSeriesRange(series: string, firstYear: number, lastYear: number, token: string) {
  const response = await fetch(
    "https://www.banxico.org.mx/SieAPIRest/service/v1/series/" + series + "/datos/" + firstYear + "-01-01/" + lastYear + "-12-31",
    { headers: { "Bmx-Token": token }, cache: "no-store" },
  );
  if (!response.ok) return null;
  return await response.json() as BanxicoResponse;
}

export async function obtenerInflacionHistoricaBanxico(firstYear: number, lastYear: number): Promise<BanxicoInflationHistory | null> {
  const token = process.env.BANXICO_SIE_TOKEN?.trim();
  if (!token || !Number.isInteger(firstYear) || !Number.isInteger(lastYear) || firstYear > lastYear) return null;

  try {
    const [monthlyResponse, annualResponse] = await Promise.all([
      fetchSeriesRange(monthlyInflationSeries, firstYear, lastYear, token),
      fetchSeriesRange(annualInflationSeries, firstYear, lastYear, token),
    ]);
    if (!monthlyResponse || !annualResponse) return null;
    return {
      monthly: observationsFromBanxico(monthlyResponse, firstYear, lastYear),
      annual: observationsFromBanxico(annualResponse, firstYear, lastYear),
    };
  } catch {
    return null;
  }
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

    return { month, value: value.toFixed(8) };
  } catch {
    return null;
  }
}
