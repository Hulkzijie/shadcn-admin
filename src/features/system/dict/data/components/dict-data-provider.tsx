import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type SysDictDataVo } from '../../api'

export type DictDataDialogType = 'add' | 'edit' | 'delete'

type DictDataContextType = {
  open: DictDataDialogType | null
  setOpen: (str: DictDataDialogType | null) => void
  currentRow: SysDictDataVo | null
  setCurrentRow: React.Dispatch<React.SetStateAction<SysDictDataVo | null>>
}

const DictDataContext = React.createContext<DictDataContextType | null>(null)

export function DictDataProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<DictDataDialogType>(null)
  const [currentRow, setCurrentRow] = useState<SysDictDataVo | null>(null)

  return (
    <DictDataContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </DictDataContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useDictData = () => {
  const ctx = React.useContext(DictDataContext)
  if (!ctx) {
    throw new Error('useDictData has to be used within <DictDataProvider>')
  }
  return ctx
}
