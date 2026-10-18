import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type SysTenantVo } from '../api'

export type TenantDialogType = 'add' | 'edit' | 'delete'

type TenantContextType = {
  open: TenantDialogType | null
  setOpen: (str: TenantDialogType | null) => void
  currentRow: SysTenantVo | null
  setCurrentRow: React.Dispatch<React.SetStateAction<SysTenantVo | null>>
}

const TenantContext = React.createContext<TenantContextType | null>(null)

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<TenantDialogType>(null)
  const [currentRow, setCurrentRow] = useState<SysTenantVo | null>(null)

  return (
    <TenantContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </TenantContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTenant = () => {
  const ctx = React.useContext(TenantContext)
  if (!ctx) {
    throw new Error('useTenant has to be used within <TenantProvider>')
  }
  return ctx
}
