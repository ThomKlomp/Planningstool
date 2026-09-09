import RegisterForm from "./register-form";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-8">
        <h1 className="font-display text-2xl text-ink">Account aanmaken</h1>
        <p className="mt-2 text-sm text-ink/60">
          Voor het starten van je eigen zaak zonder Google-account.
        </p>
        <RegisterForm />
      </div>
    </main>
  );
}
