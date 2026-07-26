import { ZodError, string, z } from 'zod';

export type FormState = {
  status: 'UNSET' | 'SUCCESS' | 'ERROR';
  message: string | null;
  fieldErrors: Record<string, { errors: string[] } | undefined>;
};

export const EMPTY_FORM_STATE: FormState = {
  status: 'UNSET' as const,
  message: null,
  fieldErrors: {},
};

export const fromErrorToFormState = (error: unknown) => {
  if (error instanceof ZodError) {
    // console.log("ZOD ERRORRRRR")
    //console.log(error.flatten().fieldErrors) // old
    // console.log(z.treeifyError(error).properties)
    // console.log(z.treeifyError(error))
    // console.log(error.issues)

    const treeifyError: any = z.treeifyError(error)
    var errorProperties= (treeifyError as any).properties;
    
    var fieldsError: Record<string, { errors: string[] }> = errorProperties
    // console.log("fieldsError")
    // console.log(fieldsError)

    return {
      status: 'ERROR' as const,
      message: null,
      //message: error.issues[0].message,
      //fieldErrors: error.flatten().fieldErrors,
      fieldErrors: fieldsError,
    };
  // if another error instance, return error message
  // e.g. database error
  } else if (error instanceof Error) {
    return {
      status: 'ERROR' as const,
      message: error.message,
      fieldErrors: {},
    };
    // return {
    //     message: 'Something went wrong',
    // };
  // if not an error instance but something else crashed
  // return generic error message
  } else {
    return {
      status: 'ERROR' as const,
      message: 'An unknown error occurred',
      fieldErrors: {},
    };
  }
};