import { Footer, Layout, Navbar, ThemeSwitch } from 'nextra-theme-blog'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-blog/style.css'
import 'katex/dist/katex.min.css'
import '../styles/main.css'
import NavLinks from './components/NavLinks'
import { Analytics } from '@vercel/analytics/next'
import { GoogleAnalytics } from './components/GoogleAnalytics'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog',
  icons: {
    icon: '/favicon.svg'
  }
}

export default async function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Head backgroundColor={{ dark: '#000', light: '#ffffff' }} />
      <body>
        <Layout>
          <Navbar pageMap={await getPageMap()}>
            <NavLinks />
            <ThemeSwitch />
          </Navbar>
          {children}
          <Analytics />
          <GoogleAnalytics />

          {/* <Footer>
            {new Date().getFullYear()} © Thomas Marchand
          </Footer> */}
        </Layout>
      </body>
    </html>
  )
}
