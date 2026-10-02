"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button, Input } from "@/components/ui"
import { FormRow, LoadingRows } from "@/components/common"
import { browserApi, errorMessage } from "@/core/api"
import { profileApi } from "../api/users.api"
import type { Profile } from "../entities/users.entity"

const api = profileApi(browserApi)

/** The visitor's phone + company (prefilled on enquiries, D-100). */
export function ProfileForm() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [phone, setPhone] = useState("")
  const [company, setCompany] = useState("")
  const [pending, setPending] = useState(false)

  useEffect(() => {
    api.get().then(
      (p) => {
        setProfile(p)
        setPhone(p.phone)
        setCompany(p.company)
      },
      (err) => toast.error(errorMessage(err)),
    )
  }, [])

  if (!profile) return <LoadingRows rows={3} />

  return (
    <form
      className="flex max-w-md flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault()
        setPending(true)
        try {
          const p = await api.update({ phone, company })
          setProfile(p)
          toast.success("Profile saved")
        } catch (err) {
          toast.error(errorMessage(err))
        } finally {
          setPending(false)
        }
      }}
    >
      <FormRow label="Email">
        <Input value={profile.email} disabled />
      </FormRow>
      <FormRow label="Phone" hint="Used when you send an enquiry.">
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="+91 98xxxxxxxx" />
      </FormRow>
      <FormRow label="Company">
        <Input value={company} onChange={(e) => setCompany(e.target.value)} />
      </FormRow>
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  )
}
