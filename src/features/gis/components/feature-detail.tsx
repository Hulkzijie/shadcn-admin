import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { GisFeature, GisLayerVo } from '../types'

interface FeatureDetailProps {
  feature: GisFeature | null
  layers: GisLayerVo[]
  onClose: () => void
}

export function FeatureDetail({
  feature,
  layers,
  onClose,
}: FeatureDetailProps) {
  if (!feature) return null

  const layer = layers.find((l) => l.id === feature.layerId)
  const props = feature.props ?? {}
  const detailFields = layer?.property?.filter((p) => p.detail) ?? []

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-[520px]'>
        <DialogHeader>
          <DialogTitle>{feature.theName || `要素 #${feature.id}`}</DialogTitle>
        </DialogHeader>
        <dl className='grid grid-cols-[110px_1fr] gap-x-4 gap-y-2 text-sm'>
          <dt className='text-muted-foreground'>所属图层</dt>
          <dd>{layer?.layerName ?? feature.layerId}</dd>

          {detailFields.map((f) => (
            <Field
              key={f.en}
              label={f.en}
              value={formatValue(props[f.col] ?? props[f.en])}
            />
          ))}

          {!detailFields.length &&
            Object.entries(props).map(([key, value]) => (
              <Field key={key} label={key} value={formatValue(value)} />
            ))}
        </dl>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className='text-muted-foreground'>{label}</dt>
      <dd className='break-all'>{value}</dd>
    </>
  )
}

function formatValue(value: unknown) {
  if (value == null) return '-'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
