import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="grid min-h-[60svh] place-items-center text-center">
      <div>
        <p className="font-mono text-xs text-muted">404</p>
        <h1 className="mt-2 text-2xl font-semibold">Олдсонгүй</h1>
        <Link href="/admin" className="mt-6 inline-block text-sm text-muted underline hover:text-fg">
          Хянах самбар руу буцах
        </Link>
      </div>
    </div>
  );
}
