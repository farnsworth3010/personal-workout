import { Link } from 'react-router'

export const BackLink = () => (
  <Link
    to="/templates"
    className="inline-flex min-h-11 items-center self-start text-[15px] text-muted-foreground focus-ring"
  >
    ← Наборы
  </Link>
)
