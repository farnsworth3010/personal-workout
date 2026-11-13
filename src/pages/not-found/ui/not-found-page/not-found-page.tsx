import { Link } from 'react-router'

import { Button, EmptyState, PageHeader } from '@/shared/ui'

export function NotFoundPage() {
  return (
    <>
      <PageHeader title="Страница не найдена" />
      <EmptyState title="Такой страницы нет" description="Возможно, ссылка устарела.">
        <Button asChild variant="outline" size="lg">
          <Link to="/">На главную</Link>
        </Button>
      </EmptyState>
    </>
  )
}
