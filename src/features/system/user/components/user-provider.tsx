import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type SysUserVo } from '../api'

export type UserDialogType = 'add' | 'edit' | 'delete' | 'resetPwd'

type UserContextType = {
  open: UserDialogType | null
  setOpen: (str: UserDialogType | null) => void
  currentRow: SysUserVo | null
  setCurrentRow: React.Dispatch<React.SetStateAction<SysUserVo | null>>
}

const UserContext = React.createContext<UserContextType | null>(null)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<UserDialogType>(null)
  const [currentRow, setCurrentRow] = useState<SysUserVo | null>(null)

  return (
    <UserContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </UserContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useUser = () => {
  const ctx = React.useContext(UserContext)
  if (!ctx) {
    throw new Error('useUser has to be used within <UserProvider>')
  }
  return ctx
}
