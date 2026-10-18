import { UserDeleteDialog } from './user-delete-dialog'
import { UserMutateDialog } from './user-mutate-dialog'
import { UserResetPwdDialog } from './user-reset-pwd-dialog'
import { useUser } from './user-provider'

export function UserDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useUser()
  return (
    <>
      <UserMutateDialog
        key='user-add'
        open={open === 'add'}
        onOpenChange={(state) => setOpen(state ? 'add' : null)}
      />

      {currentRow && (
        <>
          <UserMutateDialog
            key={`user-edit-${currentRow.userId}`}
            open={open === 'edit'}
            onOpenChange={(state) => {
              setOpen(state ? 'edit' : null)
              if (!state) setTimeout(() => setCurrentRow(null), 500)
            }}
            currentRow={currentRow}
          />

          <UserResetPwdDialog
            key={`user-resetPwd-${currentRow.userId}`}
            open={open === 'resetPwd'}
            onOpenChange={(state) => {
              setOpen(state ? 'resetPwd' : null)
              if (!state) setTimeout(() => setCurrentRow(null), 500)
            }}
            currentRow={currentRow}
          />

          <UserDeleteDialog
            key={`user-delete-${currentRow.userId}`}
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
