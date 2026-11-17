import { zodResolver } from '@hookform/resolvers/zod';
import {
  useForm as useReactHookForm,
  type DefaultValues,
  type FieldValues,
  type UseFormProps,
  type UseFormReturn,
} from 'react-hook-form';
import type { ZodType, ZodTypeDef } from 'zod';

export interface UseZodFormOptions<TFieldValues extends FieldValues>
  extends Omit<UseFormProps<TFieldValues>, 'resolver'> {
  schema: ZodType<TFieldValues, ZodTypeDef, TFieldValues>;
  defaultValues?: DefaultValues<TFieldValues>;
}

export function useZodForm<TFieldValues extends FieldValues>({
  schema,
  defaultValues,
  mode = 'onTouched',
  ...rest
}: UseZodFormOptions<TFieldValues>): UseFormReturn<TFieldValues> {
  return useReactHookForm<TFieldValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode,
    ...rest,
  });
}

export { useZodForm as useForm };
