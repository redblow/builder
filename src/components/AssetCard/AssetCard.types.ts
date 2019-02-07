import { Asset } from 'modules/asset/types'

export type Props = {
  isHorizontal?: boolean
  isDragging?: boolean
  asset: Asset
  onClick: (asset: Asset) => any
}
