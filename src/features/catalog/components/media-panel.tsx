"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"
import { ArrowDown, ArrowUp, ExternalLink, FileText, ImagePlus, Star, Upload, X } from "lucide-react"
import { Badge, Button, Input } from "@/components/ui"
import { NativeSelect } from "@/components/common"
import { browserApi, errorMessage } from "@/core/api"
import { env } from "@/core/config/env"
import { cn } from "@/lib/utils"
import { catalogApi } from "../api/catalog.api"
import { DOC_TYPES, type Media, type MediaRef, type MediaVisibility } from "../entities/catalog.entity"

const api = catalogApi(browserApi)

function Thumb({ media }: { media: Media }) {
  const url = media.kind === "photo" && media.visibility === "public" && env.mediaBaseUrl ? `${env.mediaBaseUrl}/${media.key}` : ""
  return (
    <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={media.filename} className="size-full object-cover" />
      ) : media.kind === "photo" ? (
        <ImagePlus className="size-5 text-muted-foreground" />
      ) : (
        <FileText className="size-5 text-muted-foreground" />
      )}
    </div>
  )
}

async function openLink(id: string) {
  try {
    window.open(await api.mediaLink(id), "_blank", "noopener")
  } catch (err) {
    toast.error(errorMessage(err))
  }
}

/**
 * Photos and documents. Uploads go straight to S3 (presigned PUT) and are
 * then attached to the draft; cover, order and captions live in the draft and
 * go live on approval.
 */
export function MediaPanel({
  warehouseId,
  media,
  refs,
  editable,
  onRefsChange,
  onUploaded,
}: {
  warehouseId: string
  media: Media[]
  refs: MediaRef[]
  editable: boolean
  onRefsChange: (refs: MediaRef[]) => void
  onUploaded: (m: Media) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [kind, setKind] = useState<"photo" | "doc">("photo")
  const [docType, setDocType] = useState("floor_plan")
  const [visibility, setVisibility] = useState<MediaVisibility>("staff")
  const [uploading, setUploading] = useState(0)

  const byId = Object.fromEntries(media.map((m) => [m.id, m]))
  const attached = refs.filter((r) => byId[r.mediaId])
  const loose = media.filter((m) => m.status === "ready" && !refs.some((r) => r.mediaId === m.id))

  const attach = (m: Media, current: MediaRef[]): MediaRef[] => {
    const hasCover = current.some((r) => r.isCover)
    return [...current, { mediaId: m.id, order: current.length + 1, isCover: m.kind === "photo" && !hasCover, caption: "" }]
  }

  async function upload(files: FileList | null) {
    if (!files?.length) return
    let next = refs
    setUploading(files.length)
    for (const file of Array.from(files)) {
      try {
        const m = await api.upload({ warehouseId, kind, docType, visibility, file })
        onUploaded(m)
        next = attach(m, next)
        onRefsChange(next)
      } catch (err) {
        toast.error(`${file.name}: ${errorMessage(err)}`)
      } finally {
        setUploading((n) => n - 1)
      }
    }
    if (fileRef.current) fileRef.current.value = ""
  }

  const move = (i: number, d: -1 | 1) => {
    const next = [...attached]
    const j = i + d
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    onRefsChange(next)
  }

  return (
    <div className="flex flex-col gap-4">
      {editable && (
        <div className="flex flex-wrap items-end gap-2 rounded-2xl border border-dashed border-border p-4">
          <NativeSelect
            value={kind}
            onChange={(v) => setKind(v as "photo" | "doc")}
            options={[
              { value: "photo", label: "Photos (public)" },
              { value: "doc", label: "Document" },
            ]}
          />
          {kind === "doc" && (
            <>
              <NativeSelect value={docType} onChange={setDocType} options={DOC_TYPES.map((d) => ({ value: d.value, label: d.label }))} />
              <NativeSelect
                value={visibility}
                onChange={(v) => setVisibility(v as MediaVisibility)}
                options={[
                  { value: "staff", label: "Staff only" },
                  { value: "public", label: "Public" },
                ]}
              />
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            multiple={kind === "photo"}
            accept={kind === "photo" ? "image/jpeg,image/png,image/webp" : "application/pdf,image/jpeg,image/png,image/webp"}
            onChange={(e) => upload(e.target.files)}
          />
          <Button type="button" variant="outline" disabled={uploading > 0} onClick={() => fileRef.current?.click()}>
            <Upload /> {uploading > 0 ? `Uploading ${uploading}…` : "Upload"}
          </Button>
          <p className="w-full text-xs text-muted-foreground">Photos: JPEG/PNG/WebP up to 10 MB. Documents: PDF or images up to 20 MB. Save the draft to keep changes.</p>
        </div>
      )}

      {attached.length === 0 ? (
        <p className="text-sm text-muted-foreground">No photos or documents on this listing yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {attached.map((r, i) => {
            const m = byId[r.mediaId]
            return (
              <li key={r.mediaId} className={cn("flex items-center gap-3 rounded-2xl border border-border p-2", r.isCover && "border-primary")}>
                <Thumb media={m} />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-sm">
                    <span className="truncate font-medium">{m.filename}</span>
                    {r.isCover && (
                      <Badge>
                        <Star /> Cover
                      </Badge>
                    )}
                    {m.kind === "doc" && <Badge variant="outline">{DOC_TYPES.find((d) => d.value === m.docType)?.label ?? "Doc"}</Badge>}
                    {m.visibility === "staff" && <Badge variant="secondary">Staff only</Badge>}
                  </div>
                  <Input
                    value={r.caption}
                    disabled={!editable}
                    placeholder="Caption"
                    className="h-8"
                    onChange={(e) => onRefsChange(attached.map((x) => (x.mediaId === r.mediaId ? { ...x, caption: e.target.value } : x)))}
                  />
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <Button size="icon-sm" variant="ghost" onClick={() => openLink(m.id)} aria-label="Open">
                    <ExternalLink />
                  </Button>
                  {editable && (
                    <>
                      {m.kind === "photo" && !r.isCover && (
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label="Make cover"
                          onClick={() => onRefsChange(attached.map((x) => ({ ...x, isCover: x.mediaId === r.mediaId })))}
                        >
                          <Star />
                        </Button>
                      )}
                      <Button size="icon-sm" variant="ghost" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                        <ArrowUp />
                      </Button>
                      <Button size="icon-sm" variant="ghost" aria-label="Move down" disabled={i === attached.length - 1} onClick={() => move(i, 1)}>
                        <ArrowDown />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Remove from listing"
                        onClick={() => onRefsChange(attached.filter((x) => x.mediaId !== r.mediaId))}
                      >
                        <X />
                      </Button>
                    </>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {editable && loose.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">Uploaded but not on this listing</p>
          <div className="flex flex-wrap gap-2">
            {loose.map((m) => (
              <Button key={m.id} size="sm" variant="outline" onClick={() => onRefsChange(attach(m, attached))}>
                + {m.filename}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
