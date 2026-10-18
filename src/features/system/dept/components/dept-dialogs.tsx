import { DeptDeleteDialog } from './dept-delete-dialog'
import { DeptMutateDialog } from './dept-mutate-dialog'
import { useDept } from './dept-provider'

export function DeptDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useDept()
  return (
    <>
      <DeptMutateDialog
        key='dept-add'
        open={open === 'add'}
        onOpenChange={(state) => setOpen(state ? 'add' : null)}
      />

      {currentRow && (
        <>
          <DeptMutateDialog
            key={`dept-edit-${currentRow.deptId}`}
            open={open === 'edit'}
            onOpenChange={(state) => {
              setOpen(state ? 'edit' : null)
              if (!state) setTimeout(() => setCurrentRow(null), 500)
            }}
            currentRow={currentRow}
          />

          <DeptDeleteDialog
            key={`dept-delete-${currentRow.deptId}`}
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
