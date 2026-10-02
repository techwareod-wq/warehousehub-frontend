"use client"

import { Input } from "@/components/ui"
import { FormRow } from "@/components/common"
import type { RentAdmin } from "../entities/catalog.entity"
import { MoneyInput } from "./field-input"

const EMPTY: RentAdmin = { deposit: null, lockInMonths: 0, escalationPct: 0, escalationEveryMonths: 0, leaseTermMonths: 0, cam: null, rest: {} }

function Num({ value, onChange, disabled, suffix }: { value: number; onChange: (n: number) => void; disabled?: boolean; suffix: string }) {
  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        min={0}
        step="any"
        className="w-28"
        disabled={disabled}
        value={value || ""}
        onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
      />
      <span className="text-xs text-muted-foreground">{suffix}</span>
    </div>
  )
}

/** Admin-only commercial terms (never public). */
export function RentAdminForm({ value, onChange, disabled }: { value: RentAdmin | null; onChange: (r: RentAdmin) => void; disabled?: boolean }) {
  const r = value ?? EMPTY
  const set = (patch: Partial<RentAdmin>) => onChange({ ...r, ...patch })
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormRow label="Security deposit">
        <MoneyInput value={r.deposit} disabled={disabled} onChange={(deposit) => set({ deposit })} />
      </FormRow>
      <FormRow label="CAM / maintenance (monthly)">
        <MoneyInput value={r.cam} disabled={disabled} onChange={(cam) => set({ cam })} />
      </FormRow>
      <FormRow label="Lease term">
        <Num value={r.leaseTermMonths} disabled={disabled} suffix="months" onChange={(leaseTermMonths) => set({ leaseTermMonths })} />
      </FormRow>
      <FormRow label="Lock-in">
        <Num value={r.lockInMonths} disabled={disabled} suffix="months" onChange={(lockInMonths) => set({ lockInMonths })} />
      </FormRow>
      <FormRow label="Escalation">
        <Num value={r.escalationPct} disabled={disabled} suffix="%" onChange={(escalationPct) => set({ escalationPct })} />
      </FormRow>
      <FormRow label="Escalation every">
        <Num value={r.escalationEveryMonths} disabled={disabled} suffix="months" onChange={(escalationEveryMonths) => set({ escalationEveryMonths })} />
      </FormRow>
    </div>
  )
}
