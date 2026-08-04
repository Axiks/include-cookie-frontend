import { Avatar } from "@radix-ui/themes"
import { Responsive } from "@radix-ui/themes/dist/esm/props/prop-def.js";

export default function UserAvatar({src, username, size="2"}: {src: string | null | undefined, username: string | null | undefined, size: Responsive<"1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"> | undefined }) {
  if (src == null || src == undefined) return

  // Kratos stores `avatar_url` as a BARE FILENAME (lumi-auth writes the uploaded/Telegram
  // filename straight into the trait), and lib/catalog/project-hydrate.ts passes that raw
  // value through. Rendered as-is it resolves relative to the current page — e.g.
  // /project/<id>/<file>.jpg — so every contributor avatar 404'd. Resolve it to this app's
  // own /cdn/avatars/ route, which streams the bytes from the shared S3 bucket. Same rule
  // the covers on /project/[id] already use, and the same one apps/catalog applies.
  // Absolute URLs and already-resolved paths pass through untouched.
  const url = /^(https?:|\/)/.test(src) ? src : `/cdn/avatars/${src}`
  const userNameAbr = username?.slice(0, 2) || ''

  return (
    <Avatar
      radius="full"
      size={size}
      src={url}
      fallback={userNameAbr}
    />
  )
}