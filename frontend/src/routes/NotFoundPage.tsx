import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Compass, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-soft text-brand-soft-fg">
        <Compass size={28} />
      </div>

      <p className="mt-8 text-6xl font-bold tracking-tight text-fg">404</p>
      <h1 className="mt-3 text-xl font-semibold tracking-tight text-fg">
        We couldn't find that page
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
        The link may be broken, or the page may have been moved or deleted.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          Go back
        </Button>
        <Link to="/dashboard">
          <Button>
            <LayoutDashboard size={16} />
            Go to dashboard
          </Button>
        </Link>
      </div>
    </div>
  )
}
