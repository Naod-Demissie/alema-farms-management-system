import { PrismaClient, FeedType } from '../lib/generated/prisma';

const prisma = new PrismaClient();

const feedProgramData = [
  // Layer feed program
  { ageInWeeks: 1, ageInDays: '1-7', feedType: 'LAYER_STARTER' as FeedType, gramPerHen: 10 },
  { ageInWeeks: 2, ageInDays: '8-14', feedType: 'LAYER_STARTER' as FeedType, gramPerHen: 16 },
  { ageInWeeks: 3, ageInDays: '15-21', feedType: 'LAYER_STARTER' as FeedType, gramPerHen: 20 },
  { ageInWeeks: 4, ageInDays: '22-28', feedType: 'REARING' as FeedType, gramPerHen: 26 },
  { ageInWeeks: 5, ageInDays: '29-35', feedType: 'REARING' as FeedType, gramPerHen: 32 },
  { ageInWeeks: 6, ageInDays: '36-42', feedType: 'REARING' as FeedType, gramPerHen: 37 },
  { ageInWeeks: 7, ageInDays: '43-49', feedType: 'REARING' as FeedType, gramPerHen: 43 },
  { ageInWeeks: 8, ageInDays: '50-56', feedType: 'REARING' as FeedType, gramPerHen: 47 },
  { ageInWeeks: 9, ageInDays: '57-63', feedType: 'REARING' as FeedType, gramPerHen: 51 },
  { ageInWeeks: 10, ageInDays: '64-70', feedType: 'PULLET_FEED' as FeedType, gramPerHen: 55 },
  { ageInWeeks: 11, ageInDays: '71-77', feedType: 'PULLET_FEED' as FeedType, gramPerHen: 58 },
  { ageInWeeks: 12, ageInDays: '78-84', feedType: 'PULLET_FEED' as FeedType, gramPerHen: 64 },
  { ageInWeeks: 13, ageInDays: '85-91', feedType: 'PULLET_FEED' as FeedType, gramPerHen: 65 },
  { ageInWeeks: 14, ageInDays: '92-98', feedType: 'PULLET_FEED' as FeedType, gramPerHen: 68 },
  { ageInWeeks: 15, ageInDays: '99-105', feedType: 'PULLET_FEED' as FeedType, gramPerHen: 70 },
  { ageInWeeks: 16, ageInDays: '106-112', feedType: 'PULLET_FEED' as FeedType, gramPerHen: 71 },
  { ageInWeeks: 17, ageInDays: '113-119', feedType: 'PULLET_FEED' as FeedType, gramPerHen: 72 },
  { ageInWeeks: 18, ageInDays: '120-126', feedType: 'LAYER' as FeedType, gramPerHen: 75 },
  { ageInWeeks: 19, ageInDays: '127-133', feedType: 'LAYER' as FeedType, gramPerHen: 80 },
  { ageInWeeks: 20, ageInDays: '134-140', feedType: 'LAYER' as FeedType, gramPerHen: 92 },
  { ageInWeeks: 21, ageInDays: '141-147', feedType: 'LAYER_PHASE_1' as FeedType, gramPerHen: 125 },
  { ageInWeeks: 22, ageInDays: '148-154', feedType: 'LAYER_PHASE_1' as FeedType, gramPerHen: 158 },
];

async function seedFeedProgram() {
  try {
    console.log('🌱 Seeding feed program data...');

    // Test database connection first
    await prisma.$connect();
    console.log('✅ Database connection established');

    // Clear existing feed program data
    console.log('🗑️ Clearing existing feed program data...');
    await prisma.feedProgram.deleteMany({});

    // Insert new feed program data
    console.log('📝 Inserting new feed program data...');
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
