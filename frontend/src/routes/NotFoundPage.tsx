import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-slate-50 text-center">
      <h1 className="text-4xl font-bold text-slate-900">404</h1>
      <p className="text-slate-600">The page you are looking for does not exist.</p>
      <Link
        to="/"
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        Back home
      </Link>
    </div>
  )
}
