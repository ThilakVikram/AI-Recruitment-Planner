export function Alert({ kind = "error", children }: { kind?: "error" | "info" | "success"; children: React.ReactNode }) {
  const styles = {
    error: "border-fit-not/40 bg-fit-not/10 text-fit-not",
    info: "border-primary/40 bg-primary/10 text-primary-strong",
    success: "border-fit-strong/40 bg-fit-strong/10 text-fit-strong",
  }[kind];
  return (
    <div role={kind === "error" ? "alert" : "status"} className={`rounded-lg border px-3 py-2 text-sm ${styles}`}>
      {children}
    </div>
  );
}
