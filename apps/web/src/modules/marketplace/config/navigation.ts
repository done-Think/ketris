import type { FooterColumn } from '../types'

export const homeNavigationItems = [
  { label: 'Alugar', href: '/imoveis', active: true },
  { label: 'Comprar', href: '/imoveis' },
  { label: 'Corretores', href: '/imoveis' },
  { label: 'Imobiliárias', href: '/imoveis' },
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
