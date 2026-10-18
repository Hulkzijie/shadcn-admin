import { DictTypeDeleteDialog } from './dict-type-delete-dialog'
import { DictTypeMutateDialog } from './dict-type-mutate-dialog'
import { useDictType } from './dict-type-provider'

export function DictTypeDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useDictType()
  return (
    <>
      <DictTypeMutateDialog
        key='dict-type-add'
        open={open === 'add'}
        onOpenChange={(state) => setOpen(state ? 'add' : null)}
      />

      {currentRow && (
        <>
          <DictTypeMutateDialog
            key={`dict-type-edit-${currentRow.dictId}`}
            open={open === 'edit'}
            onOpenChange={(state) => {
              setOpen(state ? 'edit' : null)
              if (!state) setTimeout(() => setCurrentRow(null), 500)
            }}
            currentRow={currentRow}
          />

          <DictTypeDeleteDialog
            key={`dict-type-delete-${currentRow.dictId}`}
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
