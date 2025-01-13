import type {LiteralUnion, ValueOf} from 'type-fest'
import type {Skins} from './enums'
import type {I18nLanguage, LayoutConfig} from '@layouts/types'

interface ExplicitThemeConfig {
  app: {
    i18n: {
      defaultLocale: string
      langConfig: I18nLanguage[]
    }
    theme: LiteralUnion<'light' | 'dark' | 'system', string>
    skin: ValueOf<typeof Skins>
  }
  verticalNav: {
    isVerticalNavSemiDark: boolean
  }
}

export type UserThemeConfig = LayoutConfig & ExplicitThemeConfig

// SECTION Custom Input
export interface CustomInputContent {
  title: string
  desc?: string
  value: string
  subtitle?: string
  icon?: string | object
  images?: string
}

export interface GridColumn {
  cols?: string
  sm?: string
  md?: string
  lg?: string
  xl?: string
  xxl?: string
}

// Data table
export interface SortItem {
  key: string;
  order?: boolean | 'asc' | 'desc'
}

export interface Options {
  page: number
  itemsPerPage: number
  sortBy: readonly SortItem[]
  groupBy: readonly SortItem[]
  search: string | undefined
}

export interface userPreferencias {
  tema: 'dark' | 'light' | 'system'
  tema_color: 'dark' | 'light'
  aspecto: 'default' | 'bordered'
  ancho_contenido_aplicacion: 'boxed' | 'fluid'
  desenfoque_habilitado_barra_navegacion: boolean
  navBar_loyout: 'vertical' | 'horizontal'
  es_navBar_vertical_semioscura: boolean
  esta_navBar_vertical_colapsada: boolean
  navBar_vertical_tipo: 'sticky' | 'static' | 'hidden'
  navBar_horizontal_tipo: 'sticky' | 'static' | 'hidden'
  color_primario_tema_light: string
  color_oscurecimiento_primario_tema_light: string
  color_primario_tema_dark: string
  color_oscurecimiento_primario_tema_dark: string
  direccion: 'ltr' | 'rtl'
}
