import { PrismaClient, BreedType, FeedType } from '../lib/generated/prisma';

const prisma = new PrismaClient();

const feedProgramData = [
  // Layer feed program
  { breed: 'layer' as BreedType, ageInWeeks: 1, ageInDays: '1-7', feedType: 'LAYER_STARTER' as FeedType, gramPerHen: 10 },
  { breed: 'layer' as BreedType, ageInWeeks: 2, ageInDays: '8-14', feedType: 'LAYER_STARTER' as FeedType, gramPerHen: 16 },
  { breed: 'layer' as BreedType, ageInWeeks: 3, ageInDays: '15-21', feedType: 'LAYER_STARTER' as FeedType, gramPerHen: 20 },
  { breed: 'layer' as BreedType, ageInWeeks: 4, ageInDays: '22-28', feedType: 'REARING' as FeedType, gramPerHen: 26 },
  { breed: 'layer' as BreedType, ageInWeeks: 5, ageInDays: '29-35', feedType: 'REARING' as FeedType, gramPerHen: 32 },
  { breed: 'layer' as BreedType, ageInWeeks: 6, ageInDays: '36-42', feedType: 'REARING' as FeedType, gramPerHen: 37 },
  { breed: 'layer' as BreedType, ageInWeeks: 7, ageInDays: '43-49', feedType: 'REARING' as FeedType, gramPerHen: 43 },
  { breed: 'layer' as BreedType, ageInWeeks: 8, ageInDays: '50-56', feedType: 'REARING' as FeedType, gramPerHen: 47 },
  { breed: 'layer' as BreedType, ageInWeeks: 9, ageInDays: '57-63', feedType: 'REARING' as FeedType, gramPerHen: 51 },
  { breed: 'layer' as BreedType, ageInWeeks: 10, ageInDays: '64-70', feedType: 'PULLET_FEED' as FeedType, gramPerHen: 55 },
  { breed: 'layer' as BreedType, ageInWeeks: 11, ageInDays: '71-77', feedType: 'PULLET_FEED' as FeedType, gramPerHen: 58 },
  { breed: 'layer' as BreedType, ageInWeeks: 12, ageInDays: '78-84', feedType: 'PULLET_FEED' as FeedType, gramPerHen: 64 },
  { breed: 'layer' as BreedType, ageInWeeks: 13, ageInDays: '85-91', feedType: 'PULLET_FEED' as FeedType, gramPerHen: 65 },
  { breed: 'layer' as BreedType, ageInWeeks: 14, ageInDays: '92-98', feedType: 'PULLET_FEED' as FeedType, gramPerHen: 68 },
  { breed: 'layer' as BreedType, ageInWeeks: 15, ageInDays: '99-105', feedType: 'PULLET_FEED' as FeedType, gramPerHen: 70 },
  { breed: 'layer' as BreedType, ageInWeeks: 16, ageInDays: '106-112', feedType: 'PULLET_FEED' as FeedType, gramPerHen: 71 },
  { breed: 'layer' as BreedType, ageInWeeks: 17, ageInDays: '113-119', feedType: 'PULLET_FEED' as FeedType, gramPerHen: 72 },
  { breed: 'layer' as BreedType, ageInWeeks: 18, ageInDays: '120-126', feedType: 'LAYER' as FeedType, gramPerHen: 75 },
  { breed: 'layer' as BreedType, ageInWeeks: 19, ageInDays: '127-133', feedType: 'LAYER' as FeedType, gramPerHen: 80 },
  { breed: 'layer' as BreedType, ageInWeeks: 20, ageInDays: '134-140', feedType: 'LAYER' as FeedType, gramPerHen: 92 },
  { breed: 'layer' as BreedType, ageInWeeks: 21, ageInDays: '141-147', feedType: 'LAYER_PHASE_1' as FeedType, gramPerHen: 125 },
  { breed: 'layer' as BreedType, ageInWeeks: 22, ageInDays: '148-154', feedType: 'LAYER_PHASE_1' as FeedType, gramPerHen: 158 },
];

async function seedFeedProgram() {
  try {
    console.log('🌱 Seeding feed program data...');

    // Clear existing feed program data
    await prisma.feedProgram.deleteMany({});

    // Insert new feed program data
    for (const program of feedProgramData) {
      await prisma.feedProgram.create({
        data: program,
      });
    }

    console.log(`✅ Successfully seeded ${feedProgramData.length} feed program entries`);
  } catch (error) {
    console.error('❌ Error seeding feed program:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedFeedProgram()
  .catch((error) => {
    console.error('Seed script failed:', error);
    process.exit(1);
  });
