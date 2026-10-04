"use client"

import { useEffect, useState } from "react"
import { Show, SignInButton, useUser } from "@clerk/nextjs"
import { CheckCircle2 } from "lucide-react"
import { Button, Input, Textarea } from "@/components/ui"
import { FormRow } from "@/components/common"
import { ApiError, browserApi, errorMessage } from "@/core/api"
import { getSessionId, lastSearchId, newIdempotencyKey } from "@/core/session/visitor-session"
import { profileApi } from "@/features/users"
import { enquirySubmitApi } from "../api/enquiries.api"

const MESSAGE_MIN = 10

/**
 * The enquiry form (D-100…D-102, D-105). Sign-in is the only gate (D-018):
 * the email comes from the account, phone + company are prefilled from the
 * profile and saved back by the backend. The last search's id and the
 * anonymous session go along so the enquiry converts that search.
 */
export function EnquiryForm({ listingShortId, listingName }: { listingShortId?: string; listingName?: string }) {
  return (
    <div className="glass flex flex-col gap-4 rounded-3xl p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-2xl tracking-tight">{listingName ? "Enquire about this warehouse" : "Tell us what you need"}</h2>
        <p className="text-xs text-muted-foreground">
          {listingName
            ? "Our team will get back to you with availability, pricing and a site visit."
            : "Describe the space you're looking for and our team will find options for you."}
        </p>
      </div>
      <Show when="signed-out">
        <div className="flex flex-col items-start gap-3 rounded-2xl bg-muted/50 p-4">
          <p className="text-sm">Sign in to send an enquiry — it takes a few seconds with Google or an email code.</p>
          <SignInButton mode="modal">
            <Button>Sign in to enquire</Button>
          </SignInButton>
        </div>
      </Show>
      <Show when="signed-in">
        <SignedInForm listingShortId={listingShortId} />
      </Show>
    </div>
  )
}

function SignedInForm({ listingShortId }: { listingShortId?: string }) {
  const { user } = useUser()
  const [name, setName] = useState("")
  const [company, setCompany] = useState("")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")
  const [idempotencyKey] = useState(newIdempotencyKey)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)

  useEffect(() => {
    let live = true
    profileApi(browserApi)
      .get()
      .then((p) => {
        if (!live) return
        setName((n) => n || p.name)
        setCompany((c) => c || p.company)
        setPhone((v) => v || p.phone)
      })
      .catch(() => {})
    return () => {
      live = false
    }
  }, [])

  const [userFor, setUserFor] = useState<string | null>(null)
  if (user?.fullName && userFor !== user.id) {
    setUserFor(user.id)
    setName((n) => n || user.fullName || "")
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (message.trim().length < MESSAGE_MIN) {
      setError(`Tell us a little more (at least ${MESSAGE_MIN} characters).`)
      return
    }
    setPending(true)
    try {
      await enquirySubmitApi(browserApi).submit({
        name,
        company,
        phone,
        message,
        listingShortId,
        searchId: lastSearchId(),
        sessionId: getSessionId(),
        idempotencyKey,
      })
      setSent(true)
    } catch (err) {
      if (err instanceof ApiError && err.code === "listing_gone") setError("This listing has just been removed. Try a similar one from the search.")
      else setError(errorMessage(err))
    } finally {
      setPending(false)
    }
  }

  if (sent) {
    return (
      <div className="flex items-start gap-3 rounded-2xl bg-green-500/10 p-4 text-sm">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-600" />
        <div>
          <p className="font-medium">Thanks — we&apos;ve got your enquiry.</p>
          <p className="text-muted-foreground">Our team will reach out on {user?.primaryEmailAddress?.emailAddress ?? "your email"} or by phone soon.</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <FormRow label="Your name" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
        </FormRow>
        <FormRow label="Company">
          <Input value={company} onChange={(e) => setCompany(e.target.value)} autoComplete="organization" />
        </FormRow>
      </div>
      <FormRow label="Phone" required hint="We'll call you on this number.">
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} required inputMode="tel" autoComplete="tel" placeholder="+91 98xxxxxxxx" />
      </FormRow>
      <FormRow label="What do you need?" required>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          maxLength={4000}
          placeholder="Space needed, move-in date, lease length, special requirements…"
        />
      </FormRow>
      <p className="text-xs text-muted-foreground">
        We&apos;ll reply to {user?.primaryEmailAddress?.emailAddress}.
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Sending…" : "Send enquiry"}
      </Button>
    </form>
  )
}
