'use client'

import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SelectDropdown } from '@/components/select-dropdown'
import {
  addDictData,
  getDictData,
  updateDictData,
  type SysDictDataBo,
  type SysDictDataVo,
  type SysDictTypeVo,
} from '../../api'

const dictDataSchema = z.object({
  dictLabel: z.string().min(1, '请输入字典标签').max(100, '最多 100 个字符'),
  dictValue: z.string().min(1, '请输入字典键值').max(100, '最多 100 个字符'),
  dictType: z.string().min(1, '请选择字典类型'),
  dictSort: z.number().int('排序必须为整数'),
  isDefault: z.string(),
  cssClass: z.string().optional(),
  remark: z.string().optional(),
})

type DictDataForm = z.infer<typeof dictDataSchema>

type DictDataMutateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: SysDictDataVo
  dictTypeOptions: SysDictTypeVo[]
}

export function DictDataMutateDialog({
  open,
  onOpenChange,
  currentRow,
  dictTypeOptions,
}: DictDataMutateDialogProps) {
  const isEdit = !!currentRow
  const queryClient = useQueryClient()

  const form = useForm<DictDataForm>({
    resolver: zodResolver(dictDataSchema),
    defaultValues: {
      dictLabel: '',
      dictValue: '',
      dictType: '',
      dictSort: 0,
      isDefault: 'N',
      cssClass: '',
      remark: '',
    },
  })

  const { data: detail } = useQuery({
    queryKey: ['system-dict-data-detail', currentRow?.dictCode],
    queryFn: () => getDictData(currentRow!.dictCode),
    enabled: open && isEdit,
  })

  useEffect(() => {
    if (isEdit && detail) {
      form.reset({
        dictLabel: detail.dictLabel ?? '',
        dictValue: detail.dictValue ?? '',
        dictType: detail.dictType ?? '',
        dictSort: detail.dictSort ?? 0,
        isDefault: detail.isDefault ?? 'N',
        cssClass: detail.cssClass ?? '',
        remark: detail.remark ?? '',
      })
    }
    if (!isEdit) {
      form.reset({
        dictLabel: '',
        dictValue: '',
        dictType: '',
        dictSort: 0,
        isDefault: 'N',
        cssClass: '',
        remark: '',
      })
    }
  }, [isEdit, detail, form])

  const { mutate, isPending } = useMutation({
    mutationFn: (values: DictDataForm) => {
      const payload: SysDictDataBo = {
        dictCode: currentRow?.dictCode,
        dictSort: values.dictSort,
        dictLabel: values.dictLabel,
        dictValue: values.dictValue,
        dictType: values.dictType,
        cssClass: values.cssClass || undefined,
        isDefault: values.isDefault,
        remark: values.remark || undefined,
      }
      return isEdit ? updateDictData(payload) : addDictData(payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? '修改成功' : '新增成功')
      queryClient.invalidateQueries({ queryKey: ['system-dict-data-list'] })
      onOpenChange(false)
      form.reset()
    },
    onError: (error: Error) => toast.error(error.message || '保存失败'),
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        if (!state) form.reset()
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>{isEdit ? '编辑字典数据' : '新增字典数据'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改字典数据信息后保存。' : '填写字典数据信息后保存。'}
          </DialogDescription>
        </DialogHeader>
        <div className='max-h-[70vh] overflow-y-auto py-1 pe-1'>
          <Form {...form}>
            <form
              id='dict-data-form'
              onSubmit={form.handleSubmit((v) => mutate(v))}
              className='space-y-4 px-0.5'
            >
              <FormField
                control={form.control}
                name='dictLabel'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      字典标签
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='请输入字典标签'
                        className='col-span-4'
                        autoComplete='off'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='dictValue'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      字典键值
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='请输入字典键值'
                        className='col-span-4'
                        autoComplete='off'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='dictType'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      字典类型
                    </FormLabel>
                    <SelectDropdown
                      isControlled
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      className='col-span-4'
                      items={dictTypeOptions.map((o) => ({
                        label: o.dictName,
                        value: o.dictType,
                      }))}
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='dictSort'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>排序</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='请输入排序'
                        className='col-span-4'
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ''
                              ? undefined
                              : e.target.valueAsNumber
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='isDefault'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      是否默认
                    </FormLabel>
                    <SelectDropdown
                      isControlled
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      className='col-span-4'
                      items={[
                        { label: '是', value: 'Y' },
                        { label: '否', value: 'N' },
                      ]}
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='cssClass'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      样式属性
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='请输入样式属性'
                        className='col-span-4'
                        autoComplete='off'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='remark'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-start space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 pt-2 text-end'>
                      备注
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='请输入备注'
                        className='col-span-4 resize-none'
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button type='submit' form='dict-data-form' disabled={isPending}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
