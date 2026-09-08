import './globals.css';
import Providers from '../components/providers/Providers';

export const metadata = {
  title: 'ระบบเช็คการชำระเงินและกองทุน • สาขาจุลชีววิทยา คณะวิทยาศาสตร์ ม.อ.',
  description: 'ระบบติดตามการชำระเงินและกองทุนสาขาวิชาจุลชีววิทยา คณะวิทยาศาสตร์ มหาวิทยาลัยสงขลานครินทร์ (Microbiology DeptTreasury)',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔬</text></svg>" />
      </head>
      <body className="min-h-screen bg-apple-parchment text-apple-ink antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
