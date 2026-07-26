"use client"

import { Button, Spinner } from "@radix-ui/themes"
import { useFormStatus } from "react-dom";

export default function FormBtn({label}: {label: string}){
  const { pending } = useFormStatus();
  return(
    <Button type="submit">
      <Spinner loading={pending}>
        {label}
      </Spinner>
    </Button>
  )
}