import { MusicPlatform } from './platforms';

export type Track = {
  id: string
  createdAtBlockNumber: string
  platform: MusicPlatform
}
