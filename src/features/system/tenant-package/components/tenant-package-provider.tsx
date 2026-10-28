import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type SysTenantPackageVo } from '../api'

export type TenantPackageDialogType = 'add' | 'edit' | 'delete'

type TenantPackageContextType = {
  open: TenantPackageDialogType | null
  setOpen: (str: TenantPackageDialogType | null) => void
  currentRow: SysTenantPackageVo | null
  setCurrentRow: React.Dispatch<React.SetStateAction<SysTenantPackageVo | null>>
}

const TenantPackageContext = React.createContext<TenantPackageContextType | null>(
  null
)

export function TenantPackageProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useDialogState<TenantPackageDialogType>(null)
  const [currentRow, setCurrentRow] = useState<SysTenantPackageVo | null>(null)

  return (
    <TenantPackageContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </TenantPackageContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTenantPackage = () => {
  const ctx = React.useContext(TenantPackageContext)
  if (!ctx) {
    throw new Error(
      'useTenantPackage has to be used within <TenantPackageProvider>'
    )
  }
  return ctx
}
