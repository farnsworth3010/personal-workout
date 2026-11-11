import { signInWithGoogle } from '@/shared/api'
import { Button } from '@/shared/ui'

// login.html: the title high up, the button low where the thumb reaches it.
export function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col justify-between gap-12 px-6 pt-[18vh] pb-[calc(32px+env(safe-area-inset-bottom))] min-[900px]:max-w-[560px] min-[900px]:justify-center min-[900px]:gap-14 min-[900px]:px-8 min-[900px]:py-0">
      <div>
        <h1 className="text-[56px] leading-[0.95] font-extrabold tracking-[-0.02em] uppercase after:mt-5 after:block after:h-1 after:w-16 after:rounded-full after:bg-primary after:content-[''] min-[900px]:text-[96px]">
          Personal Workout
        </h1>
        <p className="mt-5 text-[17px] leading-[1.45] text-muted-foreground min-[900px]:text-xl">
          Тренировки дома и в зале: план на неделю, подходы и прогресс в одном месте.
        </p>
      </div>

      <Button
        className="h-auto min-h-16 rounded-lg border-0 text-lg font-bold uppercase"
        onClick={signInWithGoogle}
      >
        Войти через Google
      </Button>
    </main>
  )
}
