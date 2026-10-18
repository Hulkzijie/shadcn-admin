import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type SysDictTypeVo } from '../../api'

export type DictTypeDialogType = 'add' | 'edit' | 'delete'

type DictTypeContextType = {
  open: DictTypeDialogType | null
  setOpen: (str: DictTypeDialogType | null) => void
  currentRow: SysDictTypeVo | null
  setCurrentRow: React.Dispatch<React.SetStateAction<SysDictTypeVo | null>>
}

const DictTypeContext = React.createContext<DictTypeContextType | null>(null)

export function DictTypeProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<DictTypeDialogType>(null)
  const [currentRow, setCurrentRow] = useState<SysDictTypeVo | null>(null)

  return (
    <DictTypeContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </DictTypeContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useDictType = () => {
  const ctx = React.useContext(DictTypeContext)
  if (!ctx) {
    throw new Error('useDictType has to be used within <DictTypeProvider>')
  }
  return ctx
}
