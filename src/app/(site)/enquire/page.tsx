import type { Metadata } from "next"
import { Mail, MapPin, Phone } from "lucide-react"
import { FeatureNotIncluded } from "@/components/site/no-site-access"
import { Reveal } from "@/components/site/reveal"
import { CONTACT } from "@/core/config/brand"
import { EnquiryForm } from "@/features/enquiries"
import { hasSiteFeature } from "@/features/users/lib/server-access"

export const metadata: Metadata = {
  title: "Contact",
  description: "Describe the warehouse space you need and our team will find options for you.",
}

const ROWS = [
  { label: "Our address", value: CONTACT.address, icon: MapPin },
  { label: "Phone", value: CONTACT.phone, href: `tel:${CONTACT.phone.replace(/\s/g, "")}`, icon: Phone },
  { label: "Email", value: CONTACT.email, href: `mailto:${CONTACT.email}`, icon: Mail },
]

export default async function EnquirePage() {
  if (!(await hasSiteFeature("enquiries"))) return <FeatureNotIncluded what="Enquiries" />
  return (
    <div className="relative flex-1 overflow-hidden bg-site-deep">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(255_255_255/2.5%)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/2.5%)_1px,transparent_1px)] bg-[size:48px_48px]"
      />
      <Reveal className="relative mx-auto grid max-w-7xl gap-14 px-6 py-16 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:px-12 lg:py-24">
        <div className="flex flex-col justify-center">
          <p className="font-heading text-xs font-semibold tracking-[0.3em] text-site-cyan uppercase">Tell us what you need</p>
          <h1 className="mt-4 font-heading text-[2.5rem] leading-[0.9] font-bold tracking-tighter text-white uppercase md:text-[4.5rem]">
            Let&apos;s find your <span className="text-site-teal">space</span>
          </h1>
          <p className="mt-8 max-w-lg text-sm leading-relaxed text-slate-400">
            Ready-to-move space or something built to spec: share the area, location, budget and timeline, and our team will
            come back with options matched by the Nexus engine.
          </p>
          <address className="mt-12 flex flex-col gap-6 not-italic">
            {ROWS.map((r) => (
              <div key={r.label} className="flex items-start gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-primary">
                  <r.icon aria-hidden className="size-4" />
                </span>
                <div>
                  <p className="mb-1 text-xs font-bold tracking-widest text-muted-foreground uppercase">{r.label}</p>
                  {r.href ? (
                    <a href={r.href} className="text-sm font-medium text-foreground hover:text-site-cyan">
                      {r.value}
                    </a>
                  ) : (
                    <p className="max-w-sm text-sm font-medium text-foreground">{r.value}</p>
                  )}
                </div>
              </div>
            ))}
          </address>
        </div>
        <div className="relative overflow-hidden rounded-tl-2xl rounded-tr-[5rem] rounded-br-2xl rounded-bl-[5rem] border border-white/10 bg-site-panel p-6 shadow-2xl sm:rounded-tr-[8rem] sm:rounded-bl-[8rem] sm:p-12">
          <div aria-hidden className="absolute top-0 right-0 -mt-20 -mr-20 size-64 rounded-full bg-cyan-400/5 blur-[100px]" />
          <EnquiryForm className="relative" />
        </div>
      </Reveal>
    </div>
  )
}
