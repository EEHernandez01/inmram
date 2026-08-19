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

function monthFromBanxicoDate(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  return `${match[3]}-${match[2]}`;
}

function banxicoDate(date: Date) {
  return `${String(date.getUTCDate()).padStart(2, "0")}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${date.getUTCFullYear()}`;
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

    const [year, monthNumber] = month.split("-").map(Number);
    const start = new Date(Date.UTC(year - 1, monthNumber - 1, 1));
    const end = new Date(Date.UTC(year, monthNumber, 0));
    const historyResponse = await fetch(
      `https://www.banxico.org.mx/SieAPIRest/service/v1/series/${inpcSeries}/datos/${banxicoDate(start)}/${banxicoDate(end)}`,
      { headers: { "Bmx-Token": token }, cache: "no-store" },
    );
    const historyBody = historyResponse.ok ? await historyResponse.json() as BanxicoResponse : null;
    const previousMonth = `${year - 1}-${String(monthNumber).padStart(2, "0")}`;
    const previous = historyBody?.bmx?.series?.[0]?.datos?.find((item) => monthFromBanxicoDate(item.fecha ?? "") === previousMonth);
    const previousValue = previous?.dato ? Number(previous.dato.replace(/,/g, "")) : null;
    const annualPercent = previousValue && Number.isFinite(previousValue) ? ((value / previousValue) - 1) * 100 : null;
    return { month, value: value.toFixed(8), annualPercent };
  } catch {
    return null;
  }
}
