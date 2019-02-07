import { action } from 'typesafe-actions'
import { Vector3 } from 'modules/common/types'
import { AssetResource } from 'modules/asset/types'
import { SceneDefinition, SceneMetrics, ComponentType, ComponentData } from './types'

// Create scene

export const CREATE_SCENE = 'Create scene'

export const createScene = (scene: SceneDefinition) => action(CREATE_SCENE, { scene })

export type CreateSceneAction = ReturnType<typeof createScene>

// Provision a scene

export const PROVISION_SCENE = 'Provision scene'

export const provisionScene = (sceneId: string, components: SceneDefinition['components'], entities: SceneDefinition['entities']) =>
  action(PROVISION_SCENE, { sceneId, components, entities })

export type ProvisionSceneAction = ReturnType<typeof provisionScene>

// Update metrics

export const UPDATE_METRICS = 'Update metrics'

export const updateMetrics = (sceneId: string, metrics: SceneMetrics, limits: SceneMetrics) =>
  action(UPDATE_METRICS, { sceneId, metrics, limits })

export type UpdateMetricsAction = ReturnType<typeof updateMetrics>

// Update component

export const UPDATE_TRANSFORM = 'Update transform'

export const updateTransform = (sceneId: string, componentId: string, data: ComponentData[ComponentType.Transform]) =>
  action(UPDATE_TRANSFORM, { sceneId, componentId, data })

export type UpdateTransfromAction = ReturnType<typeof updateTransform>

// Spawn item

export const ADD_ITEM = 'Add item'

export const addItem = (asset: AssetResource, position?: Vector3) => action(ADD_ITEM, { asset, position })

export type AddItemAction = ReturnType<typeof addItem>

// Spawn item on the mouse position (used for drag and drop)

export const DROP_ITEM = 'Drop item'

export const dropItem = (asset: AssetResource, x: number, y: number) => action(DROP_ITEM, { asset, x, y })

export type DropItemAction = ReturnType<typeof dropItem>

// Reset item

export const RESET_ITEM = 'Reset item'

export const resetItem = () => action(RESET_ITEM, {})

export type ResetItemAction = ReturnType<typeof resetItem>

// Duplicate item

export const DUPLICATE_ITEM = 'Duplicate item'

export const duplicateItem = () => action(DUPLICATE_ITEM, {})

export type DuplicateItemAction = ReturnType<typeof duplicateItem>

// Delete item

export const DELETE_ITEM = 'Delete item'

export const deleteItem = () => action(DELETE_ITEM, {})

export type DeleteItemAction = ReturnType<typeof deleteItem>
