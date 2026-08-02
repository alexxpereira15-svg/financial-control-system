import { redirect } from 'next/navigation'

export default function HomePage() {
  // Al entrar a '/', redirige al dashboard 
  // (El middleware mandará a /login si no hay sesión iniciada)
  redirect('/dashboard')
}
