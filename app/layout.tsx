import type { Metadata } from 'next'
import { Providers } from './providers'
import { NavBar } from '../components/navbar'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'IBCM Token Mint',
  description: 'IBCM Token Presale Mint',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <NavBar />
          {children}
        </Providers>
      </body>
    </html>
  )
}
