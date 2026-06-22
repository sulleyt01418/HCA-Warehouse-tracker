import './globals.css'

export const metadata = {
  title: 'Warehouse Tracker',
  description: 'Parts checkout tracking for Hot Cold Air',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
