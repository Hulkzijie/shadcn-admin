import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type SysRoleVo } from '../api'

export type RoleDialogType = 'add' | 'edit' | 'auth' | 'delete'

type RoleContextType = {
  open: RoleDialogType | null
  setOpen: (str: RoleDialogType | null) => void
  currentRow: SysRoleVo | null
  setCurrentRow: React.Dispatch<React.SetStateAction<SysRoleVo | null>>
}

const RoleContext = React.createContext<RoleContextType | null>(null)

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<RoleDialogType>(null)
  const [currentRow, setCurrentRow] = useState<SysRoleVo | null>(null)

  return (
    <RoleContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </RoleContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useRole = () => {
  const ctx = React.useContext(RoleContext)
  if (!ctx) {
    throw new Error('useRole has to be used within <RoleProvider>')
  }
  return ctx
}
