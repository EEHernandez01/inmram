import { Alert } from "@/components/ui/alert";

export function FormStatus({ message }: { message?: string }) {
  if (!message) return null;

  return <Alert variant="danger">{message}</Alert>;
}
