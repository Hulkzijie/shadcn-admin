import { TenantPackageDeleteDialog } from './tenant-package-delete-dialog'
import { TenantPackageMutateDialog } from './tenant-package-mutate-dialog'
import { useTenantPackage } from './tenant-package-provider'

export function TenantPackageDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useTenantPackage()
  return (
    <>
      <TenantPackageMutateDialog
        key='tenant-package-add'
        open={open === 'add'}
        onOpenChange={(state) => setOpen(state ? 'add' : null)}
      />

      {currentRow && (
        <>
          <TenantPackageMutateDialog
            key={`tenant-package-edit-${currentRow.packageId}`}
            open={open === 'edit'}
            onOpenChange={(state) => {
              setOpen(state ? 'edit' : null)
              if (!state) setTimeout(() => setCurrentRow(null), 500)
            }}
            currentRow={currentRow}
          />

          <TenantPackageDeleteDialog
            key={`tenant-package-delete-${currentRow.packageId}`}
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
