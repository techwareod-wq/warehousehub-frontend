import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  return (
    <div className="dark flex min-h-screen flex-1 items-center justify-center bg-background px-4 py-12">
      <SignUp />
    </div>
  )
}
