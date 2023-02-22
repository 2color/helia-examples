import { createHelia } from 'helia'
import { createLibp2p } from 'libp2p'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { webSockets } from '@libp2p/websockets'
import { webTransport } from '@libp2p/webtransport'
import { bootstrap } from '@libp2p/bootstrap'
import { unixfs } from '@helia/unixfs'
import { MemoryBlockstore } from 'blockstore-core'
import { MemoryDatastore } from 'datastore-core'
import { importBytes } from 'ipfs-unixfs-importer'
import { peerIdFromString } from '@libp2p/peer-id'
import { kadDHT } from '@libp2p/kad-dht'

// the blockstore is where we store the blocks that make up files
const blockstore = new MemoryBlockstore()

// application-specific data lives in the datastore
const datastore = new MemoryDatastore()

// libp2p is the networking layer that underpins Helia
const libp2p = await createLibp2p({
  dht: kadDHT(),
  datastore,
  transports: [webSockets(), webTransport()],
  connectionEncryption: [noise()],
  streamMuxers: [yamux()],
  peerDiscovery: [
    bootstrap({
      list: [
        '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
        '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
        '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
        '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt',
      ],
    }),
  ],
})

const peerId = peerIdFromString(
  '12D3KooW9snnuzHgfzpBKWtZxU9tpPDqB7SG4qM9tGLA9eQgYpQh',
)
let connection
for await (const event of libp2p.dht.findPeer(peerId)) {
  console.log(event)
  if (event.name === 'FINAL_PEER') {
    connection = await libp2p.dial(event.peer.multiaddrs[0])
  }
}

// create a Helia node
const helia = await createHelia({
  datastore,
  blockstore,
  libp2p,
})

// print out our node's PeerId
const info = await helia.info()
console.log(info.peerId)

// // create a filesystem on top of Helia, in this case it's UnixFS
// const fs = unixfs(helia)

// // we will use this TextEncoder to turn strings into Uint8Arrays
// const encoder = new TextEncoder()

// // add the bytes to your node and receive a unique content identifer
// const { cid } = await importBytes(
//   encoder.encode('Hello World 101'),
//   helia.blockstore,
// )

// console.log('Added file:', cid.toString())

// // this decoder will turn Uint8Arrays into strings
// const decoder = new TextDecoder()
// let text = ''

// for await (const chunk of fs.cat(cid)) {
//   text += decoder.decode(chunk, {
//     stream: true,
//   })
// }

// console.log('Added file contents:', text)
