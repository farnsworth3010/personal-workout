// An icon is one or more SVG shapes in a 24×24 box, stroked with the text colour.
export type IconShape = { d: string } | { cx: number; cy: number; r: number }

export interface Destination {
  to: string
  label: string
  icon: IconShape[]
}
