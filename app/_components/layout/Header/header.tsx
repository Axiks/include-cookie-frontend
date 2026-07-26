import { Box, Flex, Text, Badge } from "@radix-ui/themes";
import { NavLink } from "../../ui/nav-link";
import { countScopedProjects } from "@/lib/catalog/community-projects";
import BrandLogo from "./_components/brand-logo";
import { HeaderAuthSection } from "./_components/header-auth-section";
import { LanguageSwitcher } from "./_components/language-switcher";
import { ThemeToggle } from "./_components/theme-toggle";
import { getTranslations } from "next-intl/server";
import { dynamicFeaturesEnabled, projectsCatalogEnabled } from "@/lib/features";

export default async function Header() {
  const t = await getTranslations('nav')
  const dynamicFeatures = dynamicFeaturesEnabled()

  // The projects catalog nav link is independent of the dynamicFeatures kill-switch
  // (it ships in production) but still needs the Catalog service to actually be up —
  // the header renders on every page, so don't 500 the whole site or show a dead link
  // when it isn't (e.g. local UI dev without the catalog running).
  let projectCount: number | null = null
  if (projectsCatalogEnabled()) {
    try {
      projectCount = await countScopedProjects()
    } catch {
      projectCount = null
    }
  }
  const showProjectsLink = projectsCatalogEnabled() && projectCount !== null

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
          {dynamicFeatures && (
            <>
              <NavLink href="/user" name={t('members')} />
              <NavLink href="/statistic" name={t('statistics')} />
            </>
          )}
          <NavLink href="/about" name={t('about')} />
          {/* Rules live on the About page — deep link, so it shares About's pathname
              and opts out of the active underline. */}
          <NavLink href="/about#rule" name={t('rules')} activeMatch={false} />
        </Flex>

        <Flex className="header-controls" align="center" gap="5">
          <ThemeToggle />
          {/* Auth (sign-in / user menu) is disabled with the dynamic features; keep the
              language switcher available so the static site stays multilingual. */}
          {dynamicFeatures ? <HeaderAuthSection /> : <LanguageSwitcher />}
        </Flex>
      </Flex>
    </Box>
  );
}
