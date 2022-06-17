import { readFile, writeFile, rm } from 'node:fs/promises';
import http from 'node:http';
import https from 'node:https';
import Path from 'node:path';

import { create } from 'ipfs-http-client';
import tempDirectory from 'temp-dir';

import { Table } from '../../db/db';
import { Clients } from '../../types/processor';
import { ProcessedTrack } from '../../types/track';
import { rollPromises } from '../../utils/rollingPromises';

function imageBuffer(url: string): Promise<Buffer> {
  console.log(`Downloading ${url}`)
  return new Promise(function (resolve, reject) {
    const client = url.includes('https') ? https : http;
    client.get(url, function (res) {
      const data: any = []
      res.on('data', function (chunk) {
        data.push(chunk);
      }).on('end', function () {
        const buffer = Buffer.concat(data);
        resolve(buffer);
      }).on('error', function (e) {
        reject(e)
      });
    });
  })
}

async function uploadBuffer(buffer: Buffer) {
  const url: any = '/ip4/127.0.0.1/tcp/5011'; // have to use any because create only accepts hash
  const client = create(url)
  const { cid } = await client.add(buffer)
  return cid;
}

async function withTempPath(callback: (path: string) => Promise<any>, ext: string | void): Promise<any> {
  const fileName = (Math.random().toString(16) + '0000000').substr(2, 8);
  const path = `${Path.join(tempDirectory, fileName)}${ext ? '.' + ext : ''}`;

  try {
    return await callback(path);
  } catch (e) {
    throw e;
  } finally {
    await rm(path);
  }
}

async function temporaryWrite(buffer: Buffer, callback: (path: string) => Promise<void | Buffer>): Promise<void> {
  return withTempPath(async function (path) {
    await writeFile(path, buffer)
    await callback(path);
  })
}
const uploadContent = async function (clients: Clients, nft: any): Promise<void> {
  // todo

  // console.log(`processing ${nft.lossyArtworkURL}`)
  // const buffer = await imageBuffer(nft.lossyArtworkURL);
  // return temporaryWrite(buffer, async function (originalPath) {
  //   console.log(`wrote image to ${originalPath}`)
  //   let imageProcessingResults: any = null;
  //   try {
  //     const [largeImageBuffer, thumbnailImageBuffer]
  //       = await Promise.all([resizeImage(originalPath, '700x700'), resizeImage(originalPath, '200x200')]);
  //     const [coverCid, thumnailCid] = await Promise.all([uploadBuffer(largeImageBuffer), uploadBuffer(thumbnailImageBuffer)])
  //     imageProcessingResults = [
  //       { cid: coverCid.toString(), size: 'cover', trackId: nft.id },
  //       { cid: thumnailCid.toString(), size: 'thumbnail', trackId: nft.id }
  //     ]
  //   } catch (e: any) {
  //     imageProcessingResults = [
  //       { error: e.toString(), size: 'cover', trackId: nft.id },
  //       { error: e.toString(), size: 'thumbnail', trackId: nft.id }
  //     ]
  //   } finally {
  //     await clients.db.insert(Table.processedArtworks, imageProcessingResults);
  //   }
  // });
}

const processorFunction = async (items: Array<ProcessedTrack>, clients: Clients) => {
  const boundPromiseCreator = uploadContent.bind(null, clients);
  const results = await rollPromises<ProcessedTrack, void, Error>(items, boundPromiseCreator);
}

export const processTrackArtworks = {
  trigger:  // todo
  processorFunction: processorFunction,
};
