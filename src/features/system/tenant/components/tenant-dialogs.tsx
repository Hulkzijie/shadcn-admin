import { TenantDeleteDialog } from './tenant-delete-dialog'
import { TenantMutateDialog } from './tenant-mutate-dialog'
import { useTenant } from './tenant-provider'

export function TenantDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useTenant()
  return (
    <>
      <TenantMutateDialog
        key='tenant-add'
        open={open === 'add'}
        onOpenChange={(state) => setOpen(state ? 'add' : null)}
      />

      {currentRow && (
        <>
          <TenantMutateDialog
            key={`tenant-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={(state) => {
              setOpen(state ? 'edit' : null)
              if (!state) setTimeout(() => setCurrentRow(null), 500)
            }}
            currentRow={currentRow}
          />

          <TenantDeleteDialog
            key={`tenant-delete-${currentRow.id}`}
            open={open === 'delete'}
            onOpenChange={(state) => {
              setOpen(state ? 'delete' : null)
              if (!state) setTimeout(() => setCurrentRow(null), 500)
            }}
            currentRow={currentRow}
          />
        </>
      )}
    </>
  )
}
