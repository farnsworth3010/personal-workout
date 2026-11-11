import * as React from 'react'
import { cn } from 'cn'
import { XIcon } from 'lucide-react'
import { Dialog as SheetPrimitive } from 'radix-ui'

function Sheet(props: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger(props: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose(props: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

const preventDismiss = (event: Event) => event.preventDefault()

// A bottom sheet on phones and a centred dialog from 900px, as in the prototypes.
function SheetContent({
  className,
  children,
  title,
  description,
  dismissible = true,
  onEscapeKeyDown,
  onInteractOutside,
  ...props
}: Omit<React.ComponentProps<typeof SheetPrimitive.Content>, 'title'> & {
  title: React.ReactNode
  description?: React.ReactNode
  dismissible?: boolean
}) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay
        data-slot="sheet-overlay"
        className="fixed inset-0 z-50 bg-scrim duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
      />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        // Radix warns about a dialog without a description unless this is explicitly undefined.
        {...(description === undefined && { 'aria-describedby': undefined })}
        // The sheet takes focus itself, so the close button shows no ring after a tap.
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          ;(event.currentTarget as HTMLElement | null)?.focus()
        }}
        onEscapeKeyDown={dismissible ? onEscapeKeyDown : preventDismiss}
        onInteractOutside={dismissible ? onInteractOutside : preventDismiss}
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col gap-3 overflow-hidden rounded-t-[16px] border border-border bg-surface px-4 pt-5 pb-[calc(24px+env(safe-area-inset-bottom))] text-foreground outline-none',
          'duration-200 data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-bottom-10 data-closed:animate-out data-closed:fade-out-0 data-closed:slide-out-to-bottom-10',
          'min-[900px]:inset-x-auto min-[900px]:top-1/2 min-[900px]:bottom-auto min-[900px]:left-1/2 min-[900px]:w-full min-[900px]:max-w-[520px] min-[900px]:-translate-x-1/2 min-[900px]:-translate-y-1/2 min-[900px]:rounded-lg min-[900px]:p-7 min-[900px]:data-open:slide-in-from-bottom-4 min-[900px]:data-closed:slide-out-to-bottom-4',
          className,
        )}
        {...props}
      >
        <SheetPrimitive.Title className="pr-11 text-[22px] leading-[1.15] font-extrabold tracking-[-0.02em] uppercase">
          {title}
        </SheetPrimitive.Title>
        {description !== undefined && (
          <SheetPrimitive.Description className="-mt-1.5 text-sm text-muted-foreground">
            {description}
          </SheetPrimitive.Description>
        )}
        {/* Only the body scrolls, so the title and the close button stay put; gap comes from the sheet. */}
        <div
          data-slot="sheet-body"
          className="-m-1 flex min-h-0 flex-1 flex-col gap-[inherit] overflow-y-auto p-1"
        >
          {children}
        </div>
        {dismissible && (
          <SheetPrimitive.Close
            aria-label="Закрыть"
            className="absolute top-1.5 right-1.5 flex size-11 items-center justify-center rounded-lg text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <XIcon className="size-6" />
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  )
}

export { Sheet, SheetClose, SheetContent, SheetTrigger }
