import type { Metadata } from "next";
import Script from "next/script";
import { Fira_Mono } from "next/font/google";
import { Box, Container, Flex, Theme, ThemePanel } from "@radix-ui/themes";
import '@radix-ui/themes/styles.css';
import './styles.css';
import Header from "./_components/layout/Header/header";
import Footer from "./_components/layout/Footer/footer";
import { ThemeProvider } from "next-themes";
import { inDevEnvironment } from "@/lib/shared/utils/helpers";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

const inter = Fira_Mono({
  subsets: ["latin"],
  variable: '--font-source-code-pro',
  weight: '400',
});

export const metadata: Metadata = {
  title: "Programmers & Cookies",
  description: "Твори, програмуй, і їж печеньки!",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  const shell = (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <Theme className={inter.variable} accentColor="plum" grayColor="sand" radius="medium">
        <Container>
          <Flex direction="column" justify="between" minHeight="100vh" px="3">
            <Box>
              <Header />
              {children}
            </Box>
            <Footer />
          </Flex>
        </Container>
        {inDevEnvironment && <ThemePanel />}
      </Theme>
    </ThemeProvider>
  );

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Required for window.Telegram.WebApp — Telegram does NOT auto-inject this */}
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        <TrackExtension />
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {shell}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

function TrackExtension() {
  const src = process.env.UMAMI_SRC;
  const websiteId = process.env.UMAMI_WEBSITE_ID_WEB;
  if (!src || !websiteId) return null;
  return <script defer src={src} data-website-id={websiteId}></script>;
}
