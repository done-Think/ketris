import type { FooterColumn } from '../types/footer'

export const homeNavigationItems = [
  { label: 'Home', href: '/' },
  { label: 'Alugar', href: '/imoveis?finalidade=alugar' },
  { label: 'Comprar', href: '/imoveis?finalidade=comprar' },
  { label: 'Corretores', href: '/corretores' },
  { label: 'Imobiliárias', href: '/imobiliarias' },
] as const

export const footerColumns: FooterColumn[] = [
  {
    title: 'Para você',
    links: [
      { label: 'Buscar imóveis', href: '/imoveis' },
      { label: 'Favoritos', href: '/imoveis' },
      { label: 'Simulador financeiro', href: '/imoveis' },
    ],
  },
  {
    title: 'Corretores',
    links: [
      { label: 'Quero anunciar', href: '/login' },
      { label: 'Portal parceiro', href: '/login' },
      { label: 'Soluções corporativas', href: '/imoveis' },
    ],
  },
  {
    title: 'Empresa',
    links: [
      { label: 'Sobre nós', href: '/' },
      { label: 'Contato', href: '/' },
      { label: 'Trabalhe conosco', href: '/' },
    ],
  },
]

export const legalLinks = [
  { label: 'Termos de Uso', href: '/' },
  { label: 'Política de Privacidade', href: '/' },
] as const
