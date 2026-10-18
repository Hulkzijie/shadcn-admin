import { MenuDeleteDialog } from './menu-delete-dialog'
import { MenuMutateDialog } from './menu-mutate-dialog'
import { useMenu } from './menu-provider'

export function MenuDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useMenu()
  return (
    <>
      <MenuMutateDialog
        key='menu-add'
        open={open === 'add'}
        onOpenChange={(state) => setOpen(state ? 'add' : null)}
      />

      {currentRow && (
        <>
          <MenuMutateDialog
            key={`menu-edit-${currentRow.menuId}`}
            open={open === 'edit'}
            onOpenChange={(state) => {
              setOpen(state ? 'edit' : null)
              if (!state) setTimeout(() => setCurrentRow(null), 500)
            }}
            currentRow={currentRow}
          />

          <MenuDeleteDialog
            key={`menu-delete-${currentRow.menuId}`}
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
