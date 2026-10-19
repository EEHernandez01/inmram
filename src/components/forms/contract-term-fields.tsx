"use client";

import { useState } from "react";

import { Field, Input } from "@/components/ui/form-controls";

type ContractTermFieldsProps = {
  defaultEnd?: string;
  defaultPaymentDay?: number;
  defaultNextCollection?: string;
  defaultStart?: string;
  defaultTerm?: number;
};

function calculatedEndDate(start: string, term: string, paymentDay: string) {
  const months = Number(term);
  const dueDay = Number(paymentDay);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !Number.isInteger(months) || months < 1 || !Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) return "";

  const [year, month] = start.split("-").map(Number);
  const endMonth = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(Date.UTC(endMonth.getUTCFullYear(), endMonth.getUTCMonth() + 1, 0)).getUTCDate();
  const paymentDate = new Date(Date.UTC(endMonth.getUTCFullYear(), endMonth.getUTCMonth(), Math.min(dueDay, lastDay)));
  paymentDate.setUTCDate(paymentDate.getUTCDate() - 1);
  return paymentDate.toISOString().slice(0, 10);
}

function suggestedNextCollection(start: string, paymentDay: string) {
  const day = Number(paymentDay);
  if (!Number.isInteger(day) || day < 1 || day > 31) return "";
  const todayParts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const today = Object.fromEntries(todayParts.map((part) => [part.type, part.value]));
  const todayValue = new Date(Date.UTC(Number(today.year), Number(today.month) - 1, Number(today.day)));
  const [startYear, startMonth, startDay] = start.split("-").map(Number);
  const startValue = start ? new Date(Date.UTC(startYear, startMonth - 1, startDay)) : todayValue;
  const base = startValue > todayValue ? startValue : todayValue;
  let year = base.getFullYear(); let month = base.getMonth();
  if (day < base.getDate()) { month += 1; if (month > 11) { month = 0; year += 1; } }
  const due = new Date(Date.UTC(year, month, Math.min(day, new Date(Date.UTC(year, month + 1, 0)).getUTCDate())));
  return due.toISOString().slice(0, 10);
}

export function ContractTermFields({ defaultEnd = "", defaultNextCollection = "", defaultPaymentDay, defaultStart = "", defaultTerm }: ContractTermFieldsProps) {
  const [start, setStart] = useState(defaultStart);
  const [term, setTerm] = useState(defaultTerm?.toString() ?? "");
  const [paymentDay, setPaymentDay] = useState(defaultPaymentDay?.toString() ?? "");
  const [end, setEnd] = useState(defaultEnd);
  const [nextCollection, setNextCollection] = useState(defaultNextCollection || suggestedNextCollection(defaultStart, defaultPaymentDay?.toString() ?? ""));

  function updateCalculation(nextStart: string, nextTerm: string, nextPaymentDay: string) {
    const calculated = calculatedEndDate(nextStart, nextTerm, nextPaymentDay);
    if (calculated) setEnd(calculated);
  }

  return <><Field label="Fecha de inicio"><Input name="fechaInicio" onChange={(event) => { const value = event.target.value; setStart(value); updateCalculation(value, term, paymentDay); setNextCollection(suggestedNextCollection(value, paymentDay)); }} required type="date" value={start} /></Field><Field label="Plazo (meses)"><Input max={1200} min={1} name="plazoMeses" onChange={(event) => { const value = event.target.value; setTerm(value); updateCalculation(start, value, paymentDay); }} required type="number" value={term} /></Field><Field label="Día de pago" hint="Del 1 al 31 de cada mes."><Input max={31} min={1} name="diaPago" onChange={(event) => { const value = event.target.value; setPaymentDay(value); updateCalculation(start, term, value); setNextCollection(suggestedNextCollection(start, value)); }} required type="number" value={paymentDay} /></Field><Field label="Fecha de finalización"><Input name="fechaFin" onChange={(event) => setEnd(event.target.value)} required type="date" value={end} /></Field><Field hint="Editable. Los siguientes recibos usarán el día de pago pactado." label="Próximo cobro"><Input min={start || undefined} name="fechaProximoCobro" onChange={(event) => setNextCollection(event.target.value)} required type="date" value={nextCollection} /></Field></>;
}
