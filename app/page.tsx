import { Box, Button, Card, Flex, Heading, Link, Section, Text } from "@radix-ui/themes";
import InvitationBox from "./_components/Invitation-section";
import { Project } from "@/lib/shared/project/project.service.interface";
import { countScopedProjects, getLastScopedProjects } from "@/lib/catalog/community-projects";
import { LinkNeko } from "./_components/ui/link-neko";
import { ProjectsShowcaseWidjet } from "./_components/ui/project-showcase";
import { DynamicIcon, IconName } from "lucide-react/dynamic";
import { getTranslations } from "next-intl/server";
import { projectsCatalogEnabled } from "@/lib/features";

export default async function Root() {
  // The projects block ships in production independent of login — but only
  // when the Catalog service actually answers. Don't 500 the homepage if it's
  // unreachable; render without the block instead (catalogAvailable stays false).
  let lastProjects: Project[] = []
  let allProjects = 0
  let catalogAvailable = false
  if (projectsCatalogEnabled()) {
    try {
      lastProjects = await getLastScopedProjects(4)
      allProjects = await countScopedProjects()
      catalogAvailable = true
    } catch (e) {
      console.warn("[home] catalog unavailable, rendering without projects:", (e as Error).message)
    }
  }
  const canSeeProjectsCount = allProjects - lastProjects.length

  return (
    <>
      <Section size="1" />
      <Flex gap={{ initial: "0", md: "4" }} wrap={{ initial: "wrap", md: "nowrap" }} justify="center">
        <Box width="auto">
          <MainSection showProjects={catalogAvailable} />

          <Box id="hello">
            <InvitationBox />
          </Box>
          <Section size="1" />

          <AboutSection />

          {catalogAvailable && (
            <>
              <Section size="1" />
              <ProjectsRecommendations
                projects={lastProjects}
                canSeeProjectsCount={canSeeProjectsCount}
              />
            </>
          )}
        </Box>
      </Flex>
    </>
  );
}

async function MainSection({ showProjects }: { showProjects: boolean }) {
  const t = await getTranslations('home')

  return (
    <Flex direction="column" py="7" gap="5">
      <Box maxWidth="550px">
        <Heading as="h1">
          {t.rich('hero.title', {
            accent: (chunks) => <Text className="brand-color">{chunks}</Text>
          })}
        </Heading>
      </Box>

      <Flex direction="column" gap="5" maxWidth="950px" wrap={{ initial: "wrap", sm: "nowrap" }}>
        <Text color="gray" size="2">
          {t('hero.subtitle')}
          <Text as="p">{t('hero.subtitleCreative')}</Text>
          <Text as="p">{t('hero.subtitleJoin')}</Text>
        </Text>

        <Flex gap="3" direction="row" wrap="wrap">
          <Link href="https://t.me/include_anime" target="_blank">
            <Button variant="solid" style={{ textWrap: "nowrap" }}>{t('hero.joinTelegramChatBtn')}</Button>
          </Link>
          {showProjects && (
            <LinkNeko href="/project">
              <Button variant="soft" style={{ textWrap: "nowrap" }}>{t('hero.projectsBtn')}</Button>
            </LinkNeko>
          )}
        </Flex>
      </Flex>

      <Flex gap="5" direction="row" wrap="wrap">
        <LinkNeko href="/#about"><Text>{t('hero.whoLink')}</Text></LinkNeko>
        <LinkNeko href="/#hello"><Text>{t('hero.findLink')}</Text></LinkNeko>
      </Flex>
    </Flex>
  )
}

async function AboutSection() {
  const t = await getTranslations('home')

  return (
    <Flex direction="column" gap="1">
      <Box pb="2">
        <Heading id="about" as="h3">{t('about.title')}</Heading>
      </Box>
      <Text as="p">{t('about.p1')}</Text>
      <Text as="p">{t('about.p2')}</Text>
      <Text as="p">{t('about.p3')}</Text>
      <Text as="p">{t('about.p4')}</Text>
      <Box pt="2">
        <LinkNeko href="/about"><Text>{t('about.moreLink')}</Text></LinkNeko>
      </Box>
    </Flex>
  )
}

async function ProjectsRecommendations(
  { projects, canSeeProjectsCount }:
  { projects: Project[], canSeeProjectsCount: number },
) {
  const t = await getTranslations('home')

  return (
    <Flex gap="3" direction="column" pt="2" wrap="wrap">
      <Flex direction="row" justify="between" align="center" wrap="wrap" gap="1">
        <Heading as="h3" size="4">{t('projects.sectionTitle')}</Heading>
      </Flex>
      <ProjectsShowcaseWidjet projects={projects} />
      <Flex direction="row" gap="2" justify="between" align="center">
        <LinkNeko href="/project">
          <Text size="3">
            {t.rich('projects.seeMore', {
              count: canSeeProjectsCount,
              accent: (chunks) => <Text as="span" className="brand-color">{chunks}</Text>
            })}
          </Text>
        </LinkNeko>
      </Flex>
    </Flex>
  )
}

function InfoCard({ title, description, iconName }: { title: string, description: string, iconName?: IconName | undefined }) {
  return (
    <Box minWidth="100px" maxWidth="220px">
      <Card>
        <Flex py="3" gap="2" align="center" direction="column" justify="center">
          {iconName ? <DynamicIcon className="w-6 h-6 accent-color" name={iconName} style={{ shapeRendering: "unset" }} /> : null}
          <Flex align="center" direction="column" gap="1">
            <Text as="div" size="2" weight="bold" align="center">{title}</Text>
            <Text as="div" size="1" color="gray" align="center">{description}</Text>
          </Flex>
        </Flex>
      </Card>
    </Box>
  )
}

function LinuarSection({ title, description, children }: Readonly<{ title: string, description: string, children: React.ReactNode }>) {
  return (
    <Flex gap="5" direction="row" pt="5" align="center" wrap="wrap">
      <Flex direction="column">
        <Heading as="h3">{title}</Heading>
        <Text size="2" color="gray">{description}</Text>
      </Flex>
      <Flex gap="2" align="center" justify="center" wrap="wrap">
        {children}
      </Flex>
    </Flex>
  )
}
