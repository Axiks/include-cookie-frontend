import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";
import { getImageProps, StaticImageData } from "next/image";
import { StaticImport } from "next/dist/shared/lib/get-img-props";

import { Avatar  as AvatarRadix } from "@radix-ui/themes";

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
    // <AvatarRadix
    //   radius="full"
    //   size="3"
    //   src={props.}
    //   fallback={"A"}
    // />
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

function AvatarImage(
  props: React.ComponentProps<typeof AvatarPrimitive.Image>
) {
  const { src, alt, width, height, ...rest } = props;

  if (!src) {
    // fallback to the original behavior
    return <AvatarPrimitive.Image {...props} />;
  }

  const size =
    width && height
      ? { width: Number(width), height: Number(height) }
      : { fill: true };

// This is the key line that makes Next.js image optimization take effect
  const imgSrc: string | StaticImport = src as string //!!!
  const { props: nextOptimizedProps } = getImageProps({
    src: imgSrc,
    alt: String(alt),
    ...size,
    ...rest,
  });

  return <AvatarPrimitive.Image {...nextOptimizedProps} />;
}
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };