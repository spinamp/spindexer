import slugify from 'slugify'

export const strictSlugify = (input: string) => slugify(input, { lower: true, strict: true })
