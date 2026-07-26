import { Avatar } from "@radix-ui/themes"
import { Responsive } from "@radix-ui/themes/dist/esm/props/prop-def.js";
import { ur } from "zod/v4/locales";

export default function UserAvatar({src, username, size="2"}: {src: string | null | undefined, username: string | null | undefined, size: Responsive<"1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"> | undefined }) {
  if (src == null || src == undefined) return
  
  // var url = '/avatars/' + src
  var url = src
  var userNameAbr = username?.slice(0, 2) || ''

  // const optimizedUrl = `/_next/image?url=${encodeURIComponent(url)}&w=640&q=75`;
  // console.log("optimizedUrl")
  // console.log(optimizedUrl)

  return (
    <Avatar
      radius="full"
      size={size}
      src={url}
      fallback={userNameAbr}
    />
  )
}