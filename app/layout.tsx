import type { Metadata, Viewport } from "next"
import Head from "next/head"
import { Geist, Geist_Mono } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"

import "./globals.css"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: "NervyAI I.M. | Desarrollo Personal",
  description:
    "Aplicacion avanzada de seguimiento de vida y desarrollo personal con estetica cyberpunk futurista. Gestion de habilidades, tareas y objetivos.",
  generator: "NervyAI",
}

export const viewport: Viewport = {
  themeColor: "#00FFFF",
  width: "device-width",
  initialScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Get backend URL from environment variable (set during Docker/K8s build or at runtime)
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ""
  
  return (
    <html lang="es" className="dark">
      <Head>
        {/* Meta tag for backend URL - can be overridden at container runtime */}
        {backendUrl && <meta name="backend-url" content={backendUrl} />}
      </Head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  )
}
