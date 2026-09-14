export type InputMask = string | Array<{ mask: string }>

export type MaskedInputProps = {
  mask: InputMask
  name: string
  onChange: (event: { target: { name: string; value: string } }) => void
}
