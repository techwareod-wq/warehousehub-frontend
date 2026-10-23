import { SignIn } from "@clerk/nextjs"
import { glassClerkAppearance } from "@/components/glass/clerk-appearance"

export default function SignInPage() {
  return (
    <div className="dark site gl-page flex min-h-screen flex-1 items-center justify-center px-4 py-12">
      <SignIn appearance={glassClerkAppearance} />
    </div>
  )
}
