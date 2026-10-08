export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary font-display text-lg font-bold text-primary-ink">
            R
          </div>
          <h1 className="font-display text-xl font-semibold">Recruiter AI Co-Pilot</h1>
        </div>
        {children}
      </div>
    </main>
  );
}
