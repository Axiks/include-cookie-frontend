import { LinkNeko } from "@/app/_components/ui/link-neko";
import UserAvatar from "@/app/_components/ui/user-avatar";
import HideInMiniApp from "@/app/_components/ui/hide-in-miniapp";
import { auth, signOut } from "@/auth"
import { ExitIcon, MagicWandIcon } from "@radix-ui/react-icons"
import { Avatar, Button, Flex, Text } from "@radix-ui/themes"

export default async function SignInUser() {
  const session = await auth()
  if (!session?.user) return null
  
  return (
    <Flex gap="3" align="center">
      <Text>{session.user.name}</Text>
      <UserAvatar src={session.user.image ?? undefined} username={session.user.name} size="2" />
      <LinkNeko href="/configurator">
        <Button type="submit" variant="soft">
            <MagicWandIcon />
            Config
        </Button>
      </LinkNeko>
      <HideInMiniApp>
        <form action={async () => {
              "use server"
              await signOut()
            }} >
          <Button type="submit" variant="soft">
            <ExitIcon />
          </Button>
        </form>
      </HideInMiniApp>
    </Flex>
  );
}