import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type SysDeptVo } from '../api'

export type DeptDialogType = 'add' | 'edit' | 'delete'

type DeptContextType = {
  open: DeptDialogType | null
  setOpen: (str: DeptDialogType | null) => void
  currentRow: SysDeptVo | null
  setCurrentRow: React.Dispatch<React.SetStateAction<SysDeptVo | null>>
}

const DeptContext = React.createContext<DeptContextType | null>(null)

export function DeptProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<DeptDialogType>(null)
  const [currentRow, setCurrentRow] = useState<SysDeptVo | null>(null)

  return (
    <DeptContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </DeptContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useDept = () => {
  const ctx = React.useContext(DeptContext)
  if (!ctx) {
    throw new Error('useDept has to be used within <DeptProvider>')
  }
  return ctx
}
