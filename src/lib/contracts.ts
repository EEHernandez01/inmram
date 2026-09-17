export function isCancellationDateAllowed({
  cancellationDate,
  endDate,
  startDate,
  today,
}: {
  cancellationDate: Date;
  endDate: Date;
  startDate: Date;
  today: Date;
}) {
  const time = cancellationDate.getTime();
  return time >= startDate.getTime() && time <= endDate.getTime() && time <= today.getTime();
}

export function hasValidPagareDetails({
  amount,
  issueDate,
  paymentPlace,
  dueDate,
}: {
  amount?: string | null;
  issueDate?: string | null;
  paymentPlace?: string | null;
  dueDate?: string | null;
}) {
  return Boolean(amount && issueDate && dueDate && paymentPlace?.trim() && dueDate >= issueDate);
}
