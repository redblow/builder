import { AxiosRequestConfig, AxiosError } from 'axios'
import { env } from 'decentraland-commons'
import { BaseAPI, APIParam } from 'decentraland-dapps/dist/lib/api'
import { Omit } from 'decentraland-dapps/dist/lib/types'
import { NO_CACHE_HEADERS } from 'lib/headers'
import { runMigrations } from 'modules/migrations/utils'
import { migrations } from 'modules/migrations/manifest'
import { Project, Manifest } from 'modules/project/types'
import { Asset, AssetAction, AssetParameter } from 'modules/asset/types'
import { Scene } from 'modules/scene/types'
import { FullAssetPack } from 'modules/assetPack/types'
import { dataURLToBlob, isDataUrl, objectURLToBlob } from 'modules/media/utils'
import { createManifest } from 'modules/project/export'
import { PoolGroup } from 'modules/poolGroup/types'
import { Pool } from 'modules/pool/types'
import { Item, ItemType, ItemRarity, WearableData, Rarity, ItemApprovalData } from 'modules/item/types'
import { Collection } from 'modules/collection/types'
import { Cheque, ThirdParty } from 'modules/thirdParty/types'
import { PreviewType } from 'modules/editor/types'
import { ForumPost } from 'modules/forum/types'
import { ModelMetrics } from 'modules/models/types'
import { CollectionCuration } from 'modules/curations/collectionCuration/types'
import { CurationStatus } from 'modules/curations/types'
import { ItemCuration } from 'modules/curations/itemCuration/types'
import { Authorization } from './auth'

export const BUILDER_SERVER_URL = env.get('REACT_APP_BUILDER_SERVER_URL', '')

export const getContentsStorageUrl = (hash: string = '') => `${BUILDER_SERVER_URL}/storage/contents/${hash}`
export const getAssetPackStorageUrl = (hash: string = '') => `${BUILDER_SERVER_URL}/storage/assetPacks/${hash}`
export const getPreviewUrl = (projectId: string) => `${BUILDER_SERVER_URL}/projects/${projectId}/media/preview.png`

export type RemoteItem = {
  id: string // uuid
  name: string
  description: string
  thumbnail: string
  eth_address: string
  collection_id: string | null
  blockchain_item_id: string | null
  price: string | null
  urn: string | null
  beneficiary: string | null
  rarity: ItemRarity | null
  total_supply: number | null
  is_published: boolean
  is_approved: boolean
  in_catalyst: boolean
  type: ItemType
  data: WearableData
  metrics: ModelMetrics
  contents: Record<string, string>
  content_hash: string | null
  created_at: Date
  updated_at: Date
  local_content_hash: string | null
  catalyst_content_hash: string | null
}

export type RemoteCollection = {
  id: string // uuid
  name: string
  eth_address: string
  salt: string | null
  contract_address: string | null
  urn: string
  is_published: boolean
  is_approved: boolean
  minters: string[]
  managers: string[]
  forum_link: string | null
  lock: Date | null
  reviewed_at: Date | null
  created_at: Date
  updated_at: Date
}

export type RemoteProject = {
  id: string
  title: string
  description: string
  thumbnail: string
  is_public: boolean
  scene_id: string
  eth_address: string
  rows: number
  cols: number
  created_at: string
  updated_at: string
}

export type RemotePoolGroup = {
  id: string
  name: string
  is_active: boolean
  active_from: string
  active_until: string
}

export type RemotePool = RemoteProject & {
  groups: string[]
  parcels: number | null
  transforms: number | null
  gltf_shapes: number | null
  nft_shapes: number | null
  scripts: number | null
  entities: number | null
  likes: number
  like: boolean
}

export type RemoteAssetPack = {
  id: string
  title: string
  url?: string
  thumbnail?: string
  eth_address: string
  assets: RemoteAsset[]
  created_at?: string
  updated_at?: string
}

export type RemoteAsset = {
  id: string
  legacy_id: string | null
  asset_pack_id: string
  name: string
  model: string
  script: string | null
  thumbnail: string
  tags: string[]
  category: string
  contents: Record<string, string>
  metrics: ModelMetrics
  parameters: AssetParameter[]
  actions: AssetAction[]
}

export type RemoteWeeklyStats = {
  week: string
  title: string
  base: string
  users: number
  sessions: number
  median_session_time: number
  min_session_time: number
  average_session_time: number
  max_session_time: number
  direct_users: number
  direct_sessions: number
  max_concurrent_users: number
  max_concurrent_users_time: string
}

type BaseCuration = {
  id: string
  status: CollectionCuration['status']
  created_at: Date
  updated_at: Date
}

export type RemoteCollectionCuration = {
  collection_id: string
} & BaseCuration

export type RemoteItemCuration = {
  item_id: string
  content_hash: string
} & BaseCuration

/**
 * Transforms a Project into a RemoteProject for saving purposes only.
 * The `thumbnail` is omitted.
 */
function toRemoteProject(project: Project): Omit<RemoteProject, 'thumbnail'> {
  return {
    id: project.id,
    title: project.title,
    description: project.description,
    is_public: project.isPublic,
    scene_id: project.sceneId,
    eth_address: project.ethAddress!,
    rows: project.layout.rows,
    cols: project.layout.cols,
    created_at: project.createdAt,
    updated_at: project.updatedAt
  }
}

function fromRemoteProject(remoteProject: RemoteProject): Project {
  return {
    id: remoteProject.id,
    title: remoteProject.title,
    description: remoteProject.description,
    thumbnail: `${BUILDER_SERVER_URL}/projects/${remoteProject.id}/media/thumbnail.png`,
    isPublic: !!remoteProject.is_public,
    sceneId: remoteProject.scene_id,
    ethAddress: remoteProject.eth_address,
    layout: {
      rows: remoteProject.rows,
      cols: remoteProject.cols
    },
    createdAt: remoteProject.created_at,
    updatedAt: remoteProject.updated_at
  }
}

function fromRemotePool(remotePool: RemotePool): Pool {
  const pool = fromRemoteProject(remotePool) as Pool

  pool.thumbnail = `${BUILDER_SERVER_URL}/projects/${remotePool.id}/media/preview.png`
  pool.isPublic = true
  pool.groups = remotePool.groups || []
  pool.likes = remotePool.likes || 0
  pool.like = !!remotePool.like

  if (remotePool.parcels) {
    pool.statistics = {
      parcels: remotePool.parcels as number,
      transforms: remotePool.transforms as number,
      gltf_shapes: remotePool.gltf_shapes as number,
      nft_shapes: remotePool.nft_shapes as number,
      scripts: remotePool.scripts as number,
      entities: remotePool.entities as number
    }
  }

  return pool
}

function toRemoteAssetPack(assetPack: FullAssetPack): RemoteAssetPack {
  return {
    id: assetPack.id,
    title: assetPack.title,
    eth_address: assetPack.ethAddress!,
    assets: assetPack.assets.map(asset => toRemoteAsset(asset))
  }
}

function fromRemoteAssetPack(remoteAssetPack: RemoteAssetPack): FullAssetPack {
  return {
    id: remoteAssetPack.id,
    title: remoteAssetPack.title,
    thumbnail: getAssetPackStorageUrl(remoteAssetPack.thumbnail),
    ethAddress: remoteAssetPack.eth_address,
    assets: remoteAssetPack.assets.map(asset => fromRemoteAsset(asset)),
    createdAt: remoteAssetPack.created_at,
    updatedAt: remoteAssetPack.updated_at
  }
}

function toRemoteAsset(asset: Asset): RemoteAsset {
  return {
    id: asset.id,
    legacy_id: asset.legacyId || null,
    asset_pack_id: asset.assetPackId,
    name: asset.name,
    model: asset.model.replace(`${asset.assetPackId}/`, ''),
    script: asset.script,
    thumbnail: asset.thumbnail.replace(getContentsStorageUrl(), ''),
    tags: asset.tags,
    category: asset.category,
    contents: asset.contents,
    metrics: asset.metrics,
    parameters: asset.parameters,
    actions: asset.actions
  }
}

function fromRemoteAsset(remoteAsset: RemoteAsset): Asset {
  return {
    id: remoteAsset.id,
    legacyId: remoteAsset.legacy_id,
    assetPackId: remoteAsset.asset_pack_id,
    name: remoteAsset.name,
    model: remoteAsset.model,
    script: remoteAsset.script,
    thumbnail: getContentsStorageUrl(remoteAsset.thumbnail),
    tags: remoteAsset.tags,
    category: remoteAsset.category,
    contents: remoteAsset.contents,
    metrics: remoteAsset.metrics,
    parameters: remoteAsset.parameters,
    actions: remoteAsset.actions
  }
}

function fromPoolGroup(poolGroup: RemotePoolGroup): PoolGroup {
  return {
    id: poolGroup.id,
    name: poolGroup.name,
    isActive: poolGroup.is_active,
    activeFrom: new Date(Date.parse(poolGroup.active_from)),
    activeUntil: new Date(Date.parse(poolGroup.active_until))
  }
}

function toRemoteItem(item: Item): RemoteItem {
  const remoteItem: RemoteItem = {
    id: item.id,
    name: item.name,
    description: item.description || '',
    thumbnail: item.thumbnail,
    eth_address: item.owner,
    collection_id: item.collectionId || null,
    blockchain_item_id: item.tokenId || null,
    price: item.price || null,
    urn: item.urn || null,
    beneficiary: item.beneficiary || null,
    rarity: item.rarity || null,
    total_supply: item.totalSupply === undefined ? null : item.totalSupply,
    is_published: false,
    is_approved: false,
    in_catalyst: item.inCatalyst || false,
    type: item.type,
    data: item.data,
    metrics: item.metrics,
    contents: item.contents,
    content_hash: item.blockchainContentHash,
    local_content_hash: item.currentContentHash,
    catalyst_content_hash: item.catalystContentHash,
    created_at: new Date(item.createdAt),
    updated_at: new Date(item.updatedAt)
  }

  return remoteItem
}

function fromRemoteItem(remoteItem: RemoteItem) {
  const item: Item = {
    id: remoteItem.id,
    name: remoteItem.name,
    thumbnail: remoteItem.thumbnail,
    owner: remoteItem.eth_address,
    description: remoteItem.description,
    isPublished: remoteItem.is_published,
    isApproved: remoteItem.is_approved,
    inCatalyst: remoteItem.in_catalyst,
    type: remoteItem.type,
    data: remoteItem.data,
    contents: remoteItem.contents,
    currentContentHash: remoteItem.local_content_hash,
    blockchainContentHash: remoteItem.content_hash,
    catalystContentHash: remoteItem.catalyst_content_hash,
    metrics: remoteItem.metrics,
    createdAt: +new Date(remoteItem.created_at),
    updatedAt: +new Date(remoteItem.created_at)
  }

  if (remoteItem.collection_id) item.collectionId = remoteItem.collection_id
  if (remoteItem.blockchain_item_id) item.tokenId = remoteItem.blockchain_item_id
  if (remoteItem.price) item.price = remoteItem.price
  if (remoteItem.urn) item.urn = remoteItem.urn
  if (remoteItem.beneficiary) item.beneficiary = remoteItem.beneficiary
  if (remoteItem.rarity) item.rarity = remoteItem.rarity
  if (remoteItem.total_supply !== null) item.totalSupply = remoteItem.total_supply // 0 is false

  return item
}

function toRemoteCollection(collection: Collection): RemoteCollection {
  const remoteCollection: RemoteCollection = {
    id: collection.id,
    name: collection.name,
    eth_address: collection.owner,
    salt: collection.salt || null,
    contract_address: collection.contractAddress || null,
    urn: collection.urn,
    is_published: false,
    is_approved: false,
    minters: collection.minters,
    managers: collection.managers,
    forum_link: collection.forumLink || null,
    lock: collection.lock ? new Date(collection.lock) : null,
    reviewed_at: collection.reviewedAt ? new Date(collection.reviewedAt) : null,
    created_at: new Date(collection.createdAt),
    updated_at: new Date(collection.updatedAt)
  }

  return remoteCollection
}

function fromRemoteCollection(remoteCollection: RemoteCollection) {
  const collection: Collection = {
    id: remoteCollection.id,
    name: remoteCollection.name,
    owner: remoteCollection.eth_address,
    urn: remoteCollection.urn,
    isPublished: remoteCollection.is_published,
    isApproved: remoteCollection.is_approved,
    minters: remoteCollection.minters || [],
    managers: remoteCollection.managers || [],
    forumLink: remoteCollection.forum_link || undefined,
    lock: remoteCollection.lock ? +new Date(remoteCollection.lock) : undefined,
    reviewedAt: remoteCollection.reviewed_at ? +new Date(remoteCollection.reviewed_at) : undefined,
    createdAt: +new Date(remoteCollection.created_at),
    updatedAt: +new Date(remoteCollection.updated_at)
  }

  if (remoteCollection.salt) collection.salt = remoteCollection.salt
  if (remoteCollection.contract_address) collection.contractAddress = remoteCollection.contract_address

  return collection
}

function getBaseCurationFields(remoteCuration: RemoteCollectionCuration | RemoteItemCuration) {
  return {
    id: remoteCuration.id,
    status: remoteCuration.status,
    createdAt: +new Date(remoteCuration.created_at),
    updatedAt: +new Date(remoteCuration.updated_at)
  }
}

function fromRemoteCollectionCuration(remoteCuration: RemoteCollectionCuration): CollectionCuration {
  return {
    ...getBaseCurationFields(remoteCuration),
    collectionId: remoteCuration.collection_id
  }
}

function fromRemoteItemCuration(remoteCuration: RemoteItemCuration): ItemCuration {
  return {
    ...getBaseCurationFields(remoteCuration),
    itemId: remoteCuration.item_id,
    contentHash: remoteCuration.content_hash
  }
}

export type PoolDeploymentAdditionalFields = {
  groups?: string[]
}

export type Sort = {
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export type Pagination = {
  limit?: number
  offset?: number
}

export type PoolFilters = {
  group?: string
  eth_address?: string
}

// API

export class BuilderAPI extends BaseAPI {
  private authorization: Authorization

  constructor(url: string, authorization: Authorization) {
    super(url)
    this.authorization = authorization
  }

  async request(method: AxiosRequestConfig['method'], path: string, params?: APIParam | null, config?: AxiosRequestConfig) {
    let authConfig = {}
    let headers = {}
    if (config) {
      authConfig = { ...config }
      if (config.headers) {
        headers = { ...config.headers }
      }
    }
    const authHeaders = this.authorization.createAuthHeaders(method, path)
    headers = {
      ...headers,
      ...authHeaders
    }
    authConfig = { ...authConfig, headers }

    try {
      const response = await super.request(method, path, params, authConfig)
      return response
    } catch (error) {
      if (this.isAxiosError(error) && error.response) {
        error.message = error.response.data.error
      }
      throw error
    }
  }

  async deployToPool(projectId: string, additionalInfo: PoolDeploymentAdditionalFields | null = null) {
    await this.request('put', `/projects/${projectId}/pool`, additionalInfo)
  }

  async uploadMedia(
    projectId: string,
    preview: Blob,
    shots: Record<string, Blob>,
    onUploadProgress?: (progress: { loaded: number; total: number }) => void
  ) {
    const formData = new FormData()
    formData.append('preview', preview)
    formData.append('north', shots.north)
    formData.append('east', shots.east)
    formData.append('south', shots.south)
    formData.append('west', shots.west)

    await this.request('post', `/projects/${projectId}/media`, formData, {
      onUploadProgress
    })
  }

  async fetchProjects() {
    const { items }: { items: RemoteProject[]; total: number } = await this.request('get', `/projects`)
    return items.map(fromRemoteProject)
  }

  async fetchPublicProject(projectId: string, type: 'public' | 'pool' = 'public') {
    const project: RemotePool = await this.request('get', `/projects/${projectId}/${type}`)
    return type === 'pool' ? fromRemotePool(project) : fromRemoteProject(project)
  }

  async fetchPoolsPage(filters: PoolFilters & Pagination & Sort) {
    const { items, total }: { items: RemotePool[]; total: number } = await this.request('get', '/pools', filters)
    return { items: items.map(fromRemotePool), total }
  }

  async fetchPoolGroups(activeOnly: boolean = false) {
    const items: RemotePoolGroup[] = await this.request('get', '/pools/groups', { activeOnly })
    return items.map(fromPoolGroup)
  }

  async saveProject(project: Project, scene: Scene) {
    const manifest = createManifest(toRemoteProject(project), scene)
    await this.request('put', `/projects/${project.id}/manifest`, { manifest })
  }

  async saveProjectThumbnail(project: Project) {
    const blob = dataURLToBlob(project.thumbnail)
    const formData = new FormData()
    if (blob) {
      formData.append('thumbnail', blob)
      await this.request('post', `/projects/${project.id}/media`, formData)
    }
  }

  async deleteProject(id: string) {
    await this.request('delete', `/projects/${id}`)
  }

  async fetchManifest(id: string, type: PreviewType.PROJECT | PreviewType.POOL | PreviewType.PUBLIC = PreviewType.PROJECT) {
    const remoteManifest = await this.request('get', `/${type}s/${id}/manifest`)
    const manifest = {
      ...remoteManifest,
      project: fromRemoteProject(remoteManifest.project)
    } as Manifest

    /* There are projects retrived from the cloud (S3, not DB) that don't have an ethAddress, even after migration (cos migration only impacts the DB),
       those projects can be loaded into the app state via the Scene Pool, and they end up with a null ethAddress, and are mixed with projects
       that the user created while being logged out (no ethAddress either). So to tell them appart we set them a placeholder value.
    */
    if (!manifest.project.ethAddress) {
      manifest.project.ethAddress = 'legacy'
    }

    return runMigrations(manifest, migrations)
  }

  async saveAssetPack(assetPack: FullAssetPack) {
    const remotePack = toRemoteAssetPack(assetPack)
    await this.request('put', `/assetPacks/${remotePack.id}`, { assetPack: remotePack })
  }

  async saveAssetContents(
    asset: Asset,
    contents: Record<string, Blob>,
    onUploadProgress?: (progress: { loaded: number; total: number }) => void
  ) {
    const formData = new FormData()

    for (let path in contents) {
      formData.append(path, contents[path])
    }

    await this.request('post', `/assetPacks/${asset.assetPackId}/assets/${asset.id}/files`, formData, {
      onUploadProgress
    })
  }

  async saveAssetPackThumbnail(assetPack: FullAssetPack) {
    let blob: Blob | null = null

    if (isDataUrl(assetPack.thumbnail)) {
      blob = dataURLToBlob(assetPack.thumbnail)
    } else {
      blob = await objectURLToBlob(assetPack.thumbnail)
    }

    if (!blob) throw new Error('Invalid thumbnail')

    const formData = new FormData()
    if (blob) {
      formData.append('thumbnail', blob)
      await this.request('post', `/assetPacks/${assetPack.id}/thumbnail`, formData)
    }
  }

  async fetchAssetPacks(address?: string): Promise<FullAssetPack[]> {
    const promisesOfRemoteAssetPacks: Array<Promise<RemoteAssetPack[]>> = [this.request('get', '/assetPacks', { owner: 'default' })]
    if (address) {
      promisesOfRemoteAssetPacks.push(this.request('get', '/assetPacks', { owner: address }))
    }

    const assetPacks: RemoteAssetPack[][] = await Promise.all(promisesOfRemoteAssetPacks)
    return assetPacks.reduce((acc, curr) => acc.concat(curr), []).map(fromRemoteAssetPack)
  }

  async deleteAssetPack(assetPack: FullAssetPack) {
    await this.request('delete', `/assetPacks/${assetPack.id}`)
  }

  likePool(pool: string, like: boolean = true) {
    const method = like ? 'put' : 'delete'
    return this.request(method, `/pools/${pool}/likes`)
  }

  async fetchItems(address?: string) {
    const remoteItems: RemoteItem[] = address ? await this.request('get', `/${address}/items`) : await this.request('get', `/items`)
    return remoteItems.map(fromRemoteItem)
  }

  async fetchItem(id: string) {
    const remoteItem: RemoteItem = await this.request('get', `/items/${id}`)
    return fromRemoteItem(remoteItem)
  }

  async fetchCollectionItems(collectionId: string) {
    const remoteItems: RemoteItem[] = await this.request('get', `/collections/${collectionId}/items`)
    return remoteItems.map(fromRemoteItem)
  }

  saveItem = async (item: Item, contents: Record<string, Blob>) => {
    await this.request('put', `/items/${item.id}`, { item: toRemoteItem(item) })
    // This has to be done after the PUT above, otherwise it will fail when creating an item, since it wont find it in the DB and return a 404
    await this.saveItemContents(item, contents)
  }

  saveItemContents = async (item: Item, contents: Record<string, Blob>) => {
    if (Object.keys(contents).length > 0) {
      const formData = new FormData()
      for (let path in contents) {
        formData.append(item.contents[path], contents[path])
      }

      return this.request('post', `/items/${item.id}/files`, formData)
    }
  }

  async deleteItem(id: string) {
    await this.request('delete', `/items/${id}`, {})
  }

  async fetchCollections(address?: string) {
    const remoteCollections: RemoteCollection[] = address
      ? await this.request('get', `/${address}/collections`)
      : await this.request('get', '/collections')

    return remoteCollections.map(fromRemoteCollection)
  }

  async fetchCollection(id: string) {
    const remoteCollection: RemoteCollection = await this.request('get', `/collections/${id}`)
    return fromRemoteCollection(remoteCollection)
  }

  async publishStandardCollection(collectionId: string) {
    const { collection, items }: { collection: RemoteCollection; items: RemoteItem[] } = await this.request(
      'post',
      `/collections/${collectionId}/publish`
    )
    return {
      collection: fromRemoteCollection(collection),
      items: items.map(fromRemoteItem)
    }
  }

  async publishTPCollection(collectionId: string, itemIds: string[], cheque: Cheque) {
    const {
      collection,
      items,
      itemCurations
    }: { collection: RemoteCollection; items: RemoteItem[]; itemCurations: RemoteItemCuration[] } = await this.request(
      'post',
      `/collections/${collectionId}/publish`,
      {
        itemIds,
        cheque
      }
    )
    return {
      collection: fromRemoteCollection(collection),
      items: items.map(fromRemoteItem),
      itemCurations: itemCurations.map(fromRemoteItemCuration)
    }
  }

  async saveCollection(collection: Collection, data: string) {
    const remoteCollection = await this.request('put', `/collections/${collection.id}`, {
      collection: toRemoteCollection(collection),
      data
    })
    return fromRemoteCollection(remoteCollection)
  }

  saveTOS = async (collection: Collection, email: string): Promise<void> => {
    await this.request('post', `/collections/${collection.id}/tos`, { email, collection_address: collection.contractAddress })
  }

  lockCollection = (collection: Collection): Promise<string> => {
    return this.request('post', `/collections/${collection.id}/lock`, { collection_address: collection.id })
  }

  async deleteCollection(id: string) {
    await this.request('delete', `/collections/${id}`, {})
  }

  async fetchCurations(): Promise<CollectionCuration[]> {
    const curations: RemoteCollectionCuration[] = await this.request('get', `/curations`)

    return curations.map(fromRemoteCollectionCuration)
  }

  async fetchItemCurations(collectionId: Collection['id']): Promise<ItemCuration[]> {
    const curations: RemoteItemCuration[] = await this.request('get', `/collections/${collectionId}/itemCurations`)

    return curations.map(fromRemoteItemCuration)
  }

  async fetchCuration(collectionId: string): Promise<CollectionCuration | undefined> {
    const curation: RemoteCollectionCuration | undefined = await this.request('get', `/collections/${collectionId}/curation`)

    if (!curation) {
      return
    }

    return fromRemoteCollectionCuration(curation)
  }

  pushCuration(collectionId: string): Promise<void> {
    return this.request('post', `/collections/${collectionId}/curation`)
  }

  async pushItemCuration(itemId: string): Promise<ItemCuration> {
    const curation: RemoteItemCuration = await this.request('post', `/items/${itemId}/curation`)

    return fromRemoteItemCuration(curation)
  }

  fetchCommittee(): Promise<string[]> {
    return this.request('get', '/committee')
  }

  createCollectionForumPost(collection: Collection, forumPost: ForumPost): Promise<string> {
    return this.request('post', `/collections/${collection.id}/post`, { forumPost })
  }

  fetchRarities(): Promise<Rarity[]> {
    return this.request('get', '/rarities')
  }

  fetchThirdParties(manager?: string): Promise<ThirdParty[]> {
    return this.request('get', '/thirdParties', { manager })
  }

  fetchThirdPartyAvailableSlots(thirdPartyId: string): Promise<number> {
    return this.request('get', `/thirdParties/${thirdPartyId}/slots`)
  }

  fetchApprovalData = (collectionId: string): Promise<ItemApprovalData> => {
    return this.request('get', `/collections/${collectionId}/approvalData`)
  }

  updateCurationStatus(collectionId: string, status: CurationStatus): Promise<void> {
    return this.request('patch', `/collections/${collectionId}/curation`, { curation: { status } })
  }

  async updateItemCurationStatus(itemId: string, status: CurationStatus): Promise<ItemCuration> {
    const curation: RemoteItemCuration = await this.request('patch', `/items/${itemId}/curation`, { curation: { status } })
    return fromRemoteItemCuration(curation)
  }

  async fetchContent(hash: string) {
    const url = getContentsStorageUrl(hash)
    const resp = await fetch(url, { headers: NO_CACHE_HEADERS })
    if (!resp.ok) {
      const message = await resp.text()
      throw new Error(message)
    }
    const blob = await resp.blob()
    return blob
  }

  async fetchContents(contents: Record<string, string>) {
    const blobs = new Map<string, Promise<Blob>>()
    const mappings: Promise<[string, Blob]>[] = []
    for (const path in contents) {
      const hash = contents[path]
      // avoid fetching the same hash more than once
      if (!blobs.has(hash)) {
        blobs.set(hash, this.fetchContent(hash))
      }
      const blob = blobs.get(hash)!
      mappings.push(blob.then(blob => [path, blob]))
    }
    return Promise.all(mappings).then(results =>
      results.reduce<Record<string, Blob>>((obj, [path, blob]) => {
        obj[path] = blob
        return obj
      }, {})
    )
  }

  isAxiosError(error: any): error is AxiosError {
    return error.isAxiosError
  }
}
