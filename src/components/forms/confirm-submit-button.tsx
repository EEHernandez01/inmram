"use client";

export function ConfirmSubmitButton({
  children,
  message,
}: {
  children: React.ReactNode;
  message: string;
}) {
  return (
    <button
      className="text-sm font-semibold text-brand hover:text-brand-hover"
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
      type="submit"
    >
      {children}
    </button>
  );
}
