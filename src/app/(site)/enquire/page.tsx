import type { Metadata } from "next"
import { Mail, MapPin, Phone } from "lucide-react"
import { FeatureNotIncluded } from "@/components/site/no-site-access"
import { Reveal } from "@/components/site/reveal"
import { glassSurface } from "@/components/glass"
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
    <div className="relative flex-1 overflow-hidden">
      <Reveal className="relative mx-auto grid max-w-7xl gap-14 px-6 py-16 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:px-12 lg:py-24">
        <div className="flex flex-col justify-center">
          <p className="font-heading text-xs font-semibold tracking-[0.3em] text-glass-accent-text uppercase">Tell us what you need</p>
          <h1 className="mt-4 font-heading text-[2.5rem] leading-[0.9] font-bold tracking-tighter text-white uppercase md:text-[4.5rem]">
            Let&apos;s find your <span className="text-glass-accent-text">space</span>
          </h1>
          <p className="mt-8 max-w-lg text-sm leading-relaxed text-glass-text-3">
            Ready-to-move space or something built to spec: share the area, location, budget and timeline, and our team will
            come back with options matched by the Nexus engine.
          </p>
          <address className="mt-12 flex flex-col gap-6 not-italic">
            {ROWS.map((r) => (
              <div key={r.label} className="flex items-start gap-4">
                <span className="gl-accent flex size-10 shrink-0 items-center justify-center rounded-[14px] border">
                  <r.icon aria-hidden className="size-4" />
                </span>
                <div>
                  <p className="mb-1 text-xs font-bold tracking-widest text-glass-text-3 uppercase">{r.label}</p>
                  {r.href ? (
                    <a href={r.href} className="gl-focus rounded-sm text-sm font-medium text-foreground hover:text-glass-accent-text">
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
        <div className={`${glassSurface({ level: "strong" })} relative overflow-hidden rounded-tl-[24px] rounded-tr-[5rem] rounded-br-[24px] rounded-bl-[5rem] p-6 sm:rounded-tr-[8rem] sm:rounded-bl-[8rem] sm:p-12`}>
          <EnquiryForm className="relative" />
        </div>
      </Reveal>
    </div>
  )
}
