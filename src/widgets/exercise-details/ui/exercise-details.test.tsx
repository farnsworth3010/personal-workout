import { QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { catalogQuery, type Exercise } from '@/entities/exercise'
import { createQueryClient } from '@/shared/api'

import { ExerciseDetails, ExerciseDetailsPanel } from './exercise-details'

const bench: Exercise = {
  id: 'Bench',
  name: 'Barbell Bench Press',
  kind: 'strength',
  primaryMuscles: ['chest'],
  secondaryMuscles: ['triceps', 'shoulders'],
  equipment: 'barbell',
  instructions: ['Lie on the bench.', 'Lower the bar to the chest.'],
  images: ['Bench/0.jpg', 'Bench/1.jpg'],
}

function withCatalog(children: ReactNode) {
  const client = createQueryClient()
  client.setQueryData(catalogQuery.queryKey, [bench])

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

let reducedMotion = false

beforeEach(() => {
  reducedMotion = false
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: reducedMotion, media: query }))
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
  document.documentElement.removeAttribute('data-motion-off')
})

const endPhoto = () => screen.getByAltText('Barbell Bench Press: конец движения')

describe('ExerciseDetails', () => {
  it('shows photos, muscles, equipment and numbered steps in a dialog', () => {
    render(
      withCatalog(
        <ExerciseDetails
          exerciseId="Bench"
          homeEquipment={[]}
          open
          onOpenChange={() => undefined}
        />,
      ),
    )

    const dialog = screen.getByRole('dialog', { name: /Barbell Bench Press/ })
    expect(within(dialog).getByText('зал')).toBeInTheDocument()
    expect(within(dialog).getByAltText('Barbell Bench Press: начало движения')).toHaveAttribute(
      'src',
      '/catalog/images/Bench/0.jpg',
    )
    expect(within(dialog).getByAltText('Barbell Bench Press: конец движения')).toBeInTheDocument()
    expect(within(dialog).getByText(/грудь · трицепс, плечи/)).toBeInTheDocument()
    expect(within(dialog).getByText(/штанга · силовое/)).toBeInTheDocument()
    expect(
      within(dialog)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(bench.instructions)
  })

  it('drops the gym mark when the equipment is at home and shows the action after the steps', () => {
    render(
      withCatalog(
        <ExerciseDetailsPanel exerciseId="Bench" homeEquipment={['barbell']}>
          <button type="button">Добавить в набор</button>
        </ExerciseDetailsPanel>,
      ),
    )

    const steps = screen.getByRole('list')
    const action = screen.getByRole('button', { name: 'Добавить в набор' })
    expect(steps.compareDocumentPosition(action) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    expect(
      screen.getByRole('heading', { level: 2, name: 'Barbell Bench Press' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('зал')).not.toBeInTheDocument()
  })

  it('plays the two photos as a loop and stops on a tap that shows the other position', () => {
    vi.useFakeTimers()
    render(withCatalog(<ExerciseDetailsPanel exerciseId="Bench" homeEquipment={[]} />))
    expect(endPhoto()).toHaveClass('opacity-0')

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(endPhoto()).not.toHaveClass('opacity-0')

    fireEvent.click(screen.getByRole('button', { name: 'Показать начало движения' }))
    expect(endPhoto()).toHaveClass('opacity-0')
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(endPhoto()).toHaveClass('opacity-0')
  })

  it.each([
    [
      'the animations switch is off',
      () => document.documentElement.setAttribute('data-motion-off', ''),
    ],
    ['the system asks for reduced motion', () => (reducedMotion = true)],
  ])('stays on the start photo when %s, and a tap still shows the end', (_, setUp) => {
    setUp()
    vi.useFakeTimers()
    render(withCatalog(<ExerciseDetailsPanel exerciseId="Bench" homeEquipment={[]} />))

    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(endPhoto()).toHaveClass('opacity-0')

    fireEvent.click(screen.getByRole('button', { name: 'Показать конец движения' }))
    expect(endPhoto()).not.toHaveClass('opacity-0')
  })
})
