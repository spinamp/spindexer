import * as slugifyLibrary from 'slugify'

export const slugify = (input: string) => slugifyLibrary.default(input, { lower: true, strict: true })
