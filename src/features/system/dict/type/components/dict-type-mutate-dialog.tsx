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
import {
  addDictType,
  getDictType,
  updateDictType,
  type SysDictTypeBo,
  type SysDictTypeVo,
} from '../../api'

const dictTypeSchema = z.object({
  dictName: z.string().min(1, '请输入字典名称').max(100, '最多 100 个字符'),
  dictType: z
    .string()
    .min(1, '请输入字典类型')
    .max(100, '最多 100 个字符')
    .regex(
      /^[a-z][a-z0-9_]*$/,
      '必须以小写字母开头，且只能为小写字母、数字、下划线'
    ),
  remark: z.string().optional(),
})

type DictTypeForm = z.infer<typeof dictTypeSchema>

type DictTypeMutateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: SysDictTypeVo
}

export function DictTypeMutateDialog({
  open,
  onOpenChange,
  currentRow,
}: DictTypeMutateDialogProps) {
  const isEdit = !!currentRow
  const queryClient = useQueryClient()

  const form = useForm<DictTypeForm>({
    resolver: zodResolver(dictTypeSchema),
    defaultValues: {
      dictName: '',
      dictType: '',
      remark: '',
    },
  })

  const { data: detail } = useQuery({
    queryKey: ['system-dict-type-detail', currentRow?.dictId],
    queryFn: () => getDictType(currentRow!.dictId),
    enabled: open && isEdit,
  })

  useEffect(() => {
    if (isEdit && detail) {
      form.reset({
        dictName: detail.dictName ?? '',
        dictType: detail.dictType ?? '',
        remark: detail.remark ?? '',
      })
    }
    if (!isEdit) {
      form.reset({
        dictName: '',
        dictType: '',
        remark: '',
      })
    }
  }, [isEdit, detail, form])

  const { mutate, isPending } = useMutation({
    mutationFn: (values: DictTypeForm) => {
      const payload: SysDictTypeBo = {
        dictId: currentRow?.dictId,
        dictName: values.dictName,
        dictType: values.dictType,
        remark: values.remark || undefined,
      }
      return isEdit ? updateDictType(payload) : addDictType(payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? '修改成功' : '新增成功')
      queryClient.invalidateQueries({ queryKey: ['system-dict-type-list'] })
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
          <DialogTitle>{isEdit ? '编辑字典类型' : '新增字典类型'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改字典类型信息后保存。' : '填写字典类型信息后保存。'}
          </DialogDescription>
        </DialogHeader>
        <div className='max-h-[70vh] overflow-y-auto py-1 pe-1'>
          <Form {...form}>
            <form
              id='dict-type-form'
              onSubmit={form.handleSubmit((v) => mutate(v))}
              className='space-y-4 px-0.5'
            >
              <FormField
                control={form.control}
                name='dictName'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      字典名称
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='请输入字典名称'
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
                    <FormControl>
                      <Input
                        placeholder='请输入字典类型'
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
          <Button type='submit' form='dict-type-form' disabled={isPending}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
