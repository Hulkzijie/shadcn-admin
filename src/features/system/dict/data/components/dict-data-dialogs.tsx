import { type SysDictTypeVo } from '../../api'
import { DictDataDeleteDialog } from './dict-data-delete-dialog'
import { DictDataMutateDialog } from './dict-data-mutate-dialog'
import { useDictData } from './dict-data-provider'

type DictDataDialogsProps = {
  dictTypeOptions: SysDictTypeVo[]
}

export function DictDataDialogs({ dictTypeOptions }: DictDataDialogsProps) {
  const { open, setOpen, currentRow, setCurrentRow } = useDictData()
  return (
    <>
      <DictDataMutateDialog
        key='dict-data-add'
        open={open === 'add'}
        onOpenChange={(state) => setOpen(state ? 'add' : null)}
        dictTypeOptions={dictTypeOptions}
      />

      {currentRow && (
        <>
          <DictDataMutateDialog
            key={`dict-data-edit-${currentRow.dictCode}`}
            open={open === 'edit'}
            onOpenChange={(state) => {
              setOpen(state ? 'edit' : null)
              if (!state) setTimeout(() => setCurrentRow(null), 500)
            }}
            currentRow={currentRow}
            dictTypeOptions={dictTypeOptions}
          />

          <DictDataDeleteDialog
            key={`dict-data-delete-${currentRow.dictCode}`}
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
