import { createSeedsAPIServer } from './seeds/server';

createSeedsAPIServer().listen(process.env.SEEDS_API_PORT, () => {
  console.log(`Server running on port ${process.env.SEEDS_API_PORT}`);
});
