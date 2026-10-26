
import './globals.css';
import type { Metadata } from 'next';
import { Montserrat, Montserrat_Alternates } from 'next/font/google';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
});

const montserratAlternates = Montserrat_Alternates({
  subsets: ['latin'],
  weight: ['400', '700', '800'],
  variable: '--font-montserrat-alternates',
});

export const metadata: Metadata = {
  title: 'Clarimê | Acessórios',
  description:
    'Acessórios feitos à mão para colorir os dias, celebrar amizades e contar histórias.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="UTF-8" />
      </head>
      <body
        className={`${montserrat.variable} ${montserratAlternates.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
