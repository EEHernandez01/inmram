import { FormStatus } from "@/components/ui/form-status";
import { Button } from "@/components/ui/button";

export type FoundationFormAction = (formData: FormData) => Promise<void>;

export function FoundationForm({
  action,
  children,
  submitLabel,
}: {
  action: FoundationFormAction;
  children: React.ReactNode;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-5">
      {children}
      <FormStatus message={undefined} />
      <Button type="submit">
        {submitLabel}
      </Button>
    </form>
  );
}
