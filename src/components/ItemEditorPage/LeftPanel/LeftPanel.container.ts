import { connect } from 'react-redux'
import { RootState } from 'modules/common/types'
import { isConnected } from 'decentraland-dapps/dist/modules/wallet/selectors'
import { getSelectedCollectionId, getSelectedItemId } from 'modules/location/selectors'
import { getBodyShape, getVisibleItems } from 'modules/editor/selectors'
import { getItems, getWalletOrphanItems } from 'modules/item/selectors'
import { getAuthorizedCollections } from 'modules/collection/selectors'
import { getSelectedThirdPartyItemIds } from 'modules/ui/itemEditor/selectors'
import { setItems } from 'modules/editor/actions'
import { setCollection } from 'modules/item/actions'
import { resetThirdPartyItems, toggleThirdPartyItem } from 'modules/ui/itemEditor/actions'
import { MapStateProps, MapDispatchProps, MapDispatch } from './LeftPanel.types'
import LeftPanel from './LeftPanel'

const mapState = (state: RootState): MapStateProps => ({
  isConnected: isConnected(state),
  items: getItems(state),
  orphanItems: getWalletOrphanItems(state),
  collections: getAuthorizedCollections(state),
  selectedItemId: getSelectedItemId(state),
  selectedCollectionId: getSelectedCollectionId(state),
  selectedThirdPartyItemIds: getSelectedThirdPartyItemIds(state),
  visibleItems: getVisibleItems(state),
  bodyShape: getBodyShape(state)
})

const mapDispatch = (dispatch: MapDispatch): MapDispatchProps => ({
  onSetItems: items => dispatch(setItems(items)),
  onSetCollection: (item, collectionId) => dispatch(setCollection(item, collectionId)),
  onResetThirdPartyItems: () => dispatch(resetThirdPartyItems()),
  onToggleThirdPartyItem: (itemId: string, isSelected: boolean) => dispatch(toggleThirdPartyItem(itemId, isSelected))
})

export default connect(mapState, mapDispatch)(LeftPanel)
