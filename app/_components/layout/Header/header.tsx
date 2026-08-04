import { Box, Flex, Text, Badge } from "@radix-ui/themes";
import { NavLink } from "../../ui/nav-link";
import { countScopedProjects } from "@/lib/catalog/community-projects";
import BrandLogo from "./_components/brand-logo";
import { LanguageSwitcher } from "./_components/language-switcher";
import { ThemeToggle } from "./_components/theme-toggle";
import { getTranslations } from "next-intl/server";

export default async function Header() {
  const t = await getTranslations('nav')

  // The projects nav link needs the Catalog service to actually be up — the header renders
  // on every page, so don't 500 the whole site or show a dead link when it isn't (e.g. local
  // UI dev without the catalog running).
  let projectCount: number | null = null
  try {
    projectCount = await countScopedProjects()
  } catch (e) {
    console.warn("[header] catalog unavailable, hiding projects link:", (e as Error).message)
    projectCount = null
  }
  const showProjectsLink = projectCount !== null

  return (
    <Box py="3">
      <Flex direction="row" wrap="wrap" gapX="6" gapY="3" justify="between" align="center" minHeight="4em">
        <BrandLogo />
        {/* On phones this drops to its own full-width row below the brand + controls
            (see `.header-nav` in styles.css). */}
        <Flex
          className="header-nav"
          direction="row"
          wrap="wrap"
          gapX="6"
          gapY="2"
          justify={{ initial: "center", sm: "start" }}
          width={{ initial: "100%", sm: "auto" }}
        >
          <NavLink href="/" name={t('home')} />
          {showProjectsLink && (
            <NavLink href="/project">
              <Text>{t('projects')} </Text>
              <Badge>{projectCount}</Badge>
            </NavLink>
          )}
          <NavLink href="/about" name={t('about')} />
          {/* Rules live on the About page — deep link, so it shares About's pathname
              and opts out of the active underline. */}
          <NavLink href="/about#rule" name={t('rules')} activeMatch={false} />
        </Flex>

        <Flex className="header-controls" align="center" gap="5">
          <ThemeToggle />
          <LanguageSwitcher />
        </Flex>
      </Flex>
    </Box>
  );
}
