import './globals.css'

export const metadata = {
  title: 'Warehouse Tracker',
  description: 'Parts checkout tracking for Hot Cold Air',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  )
}
