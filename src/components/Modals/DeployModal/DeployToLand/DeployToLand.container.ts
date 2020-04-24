import { connect } from 'react-redux'

import { RootState } from 'modules/common/types'
import { push } from 'connected-react-router'
import { enableWalletRequest } from 'decentraland-dapps/dist/modules/wallet/actions'
import { getError as getWalletError, isConnecting, isConnected, getAddress } from 'decentraland-dapps/dist/modules/wallet/selectors'
import {
  isUploadingAssets,
  getProgress as getUploadProgress,
  getError as getDeploymentError,
  isCreatingFiles,
  getCurrentDeploymentStatus,
  getCurrentDeployment,
  getOccuppiedParcels,
  isUploadingRecording
} from 'modules/deployment/selectors'
import { deployToLandRequest, loadDeploymentsRequest } from 'modules/deployment/actions'
import { recordMediaRequest } from 'modules/media/actions'
import { getCurrentProject } from 'modules/project/selectors'
import { getMedia, isRecording, getProgress } from 'modules/media/selectors'
import { locations } from 'routing/locations'

import { MapStateProps, MapDispatchProps, MapDispatch } from './DeployToLand.types'
import DeployToLand from './DeployToLand'
import { isLoggedIn } from 'modules/identity/selectors'

const mapState = (state: RootState): MapStateProps => {
  return {
    project: getCurrentProject(state)!,
    isConnecting: isConnecting(state),
    isConnected: isConnected(state),
    isRecording: isRecording(state),
    isUploadingAssets: isUploadingAssets(state),
    isUploadingRecording: isUploadingRecording(state),
    isCreatingFiles: isCreatingFiles(state),
    isLoggedIn: isLoggedIn(state),
    walletError: !!getWalletError(state),
    media: getMedia(state),
    ethAddress: getAddress(state),
    mediaProgress: getProgress(state),
    deploymentProgress: getUploadProgress(state),
    deploymentStatus: getCurrentDeploymentStatus(state),
    occupiedParcels: getOccuppiedParcels(state),
    deployment: getCurrentDeployment(state),
    error: getDeploymentError(state)
  }
}

const mapDispatch = (dispatch: MapDispatch): MapDispatchProps => ({
  onConnect: () => dispatch(enableWalletRequest()),
  onRecord: () => dispatch(recordMediaRequest()),
  onDeploy: (projectId, placement) => dispatch(deployToLandRequest(projectId, placement)),
  onNavigateHome: () => dispatch(push(locations.root())),
  onFetchDeployments: () => dispatch(loadDeploymentsRequest())
})

export default connect(mapState, mapDispatch)(DeployToLand)
