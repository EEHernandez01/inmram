import { FormStatus } from "@/components/ui/form-status";

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
      <button
        className="rounded bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover"
        type="submit"
      >
        {submitLabel}
      </button>
    </form>
  );
}
