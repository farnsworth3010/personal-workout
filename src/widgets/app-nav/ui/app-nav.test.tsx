import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import { AppNav } from './app-nav'

const brandName = 'Personal Workout — на главную'

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppNav />
    </MemoryRouter>,
  )

  const nav = within(screen.getByRole('navigation', { name: 'Разделы' }))
  const brand = nav.getByRole('link', { name: brandName })

  return nav.getAllByRole('link').filter((link) => link !== brand)
}

const current = (links: HTMLElement[]) =>
  links.filter((link) => link.getAttribute('aria-current') === 'page').map((l) => l.textContent)

describe('AppNav', () => {
  it('lists the five destinations in the order of the prototypes', () => {
    const links = renderAt('/')

    expect(links.map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Сегодня', '/'],
      ['Наборы', '/templates'],
      ['Упражнения', '/exercises'],
      ['Статистика', '/stats'],
      ['Профиль', '/settings'],
    ])
  })

  it('marks only the active destination', () => {
    expect(current(renderAt('/'))).toEqual(['Сегодня'])
  })

  it('keeps the section active on its nested routes', () => {
    expect(current(renderAt('/templates/abc'))).toEqual(['Наборы'])
  })

  it('keeps Статистика current on a finished workout', () => {
    expect(current(renderAt('/workouts/w1'))).toEqual(['Статистика'])
  })

  it('marks nothing on a route outside the navigation', () => {
    expect(current(renderAt('/dev/ui'))).toEqual([])
  })

  it('links the app name to the home page', () => {
    renderAt('/stats')

    const brand = screen.getByRole('link', { name: brandName })
    expect(brand).toHaveAttribute('href', '/')
    expect(brand).not.toHaveAttribute('aria-current')
  })
})
