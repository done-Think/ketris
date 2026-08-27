import { AuthShell, LoginForm } from '@modules/auth'

export const metadata = { title: 'Ketris | Entrar' }

type LoginPageProps = {
  searchParams: { callbackUrl?: string | string[] }
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const requestedCallback = Array.isArray(searchParams.callbackUrl)
    ? searchParams.callbackUrl[0]
    : searchParams.callbackUrl
  const callbackUrl =
    requestedCallback?.startsWith('/') && !requestedCallback.startsWith('//')
      ? requestedCallback
      : '/dashboard'

  return (
    <AuthShell mobileVariant="card">
      <LoginForm callbackUrl={callbackUrl} />
    </AuthShell>
  )
}
