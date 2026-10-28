import { RoleDeleteDialog } from './role-delete-dialog'
import { RoleMutateDialog } from './role-mutate-dialog'
import { RolePermissionDialog } from './role-permission-dialog'
import { useRole } from './role-provider'

export function RoleDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useRole()
  return (
    <>
      <RoleMutateDialog
        key='role-add'
        open={open === 'add'}
        onOpenChange={(state) => setOpen(state ? 'add' : null)}
      />

      {currentRow && (
        <>
          <RoleMutateDialog
            key={`role-edit-${currentRow.roleId}`}
            open={open === 'edit'}
            onOpenChange={(state) => {
              setOpen(state ? 'edit' : null)
              if (!state) setTimeout(() => setCurrentRow(null), 500)
            }}
            currentRow={currentRow}
          />

          <RolePermissionDialog
            key={`role-auth-${currentRow.roleId}`}
            open={open === 'auth'}
            onOpenChange={(state) => {
              setOpen(state ? 'auth' : null)
              if (!state) setTimeout(() => setCurrentRow(null), 500)
            }}
            currentRow={currentRow}
          />

          <RoleDeleteDialog
            key={`role-delete-${currentRow.roleId}`}
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
