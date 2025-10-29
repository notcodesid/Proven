/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Idempotent seeds for local development
  const userId = '00000000-0000-0000-0000-000000000001';

  await prisma.user.upsert({
    where: { id: userId },
    update: { name: 'Demo Admin', email: 'hello@proven.com' },
    create: { 
      id: userId, 
      name: 'Demo Admin', 
      email: 'hello@proven.com'
    },
  });

  // Create a sample challenge if none exists
  const existing = await prisma.challenge.findFirst();
  if (!existing) {
    // Set up a 7-day challenge timeline
    // Start: Tomorrow at midnight
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1); // Tomorrow
    startDate.setHours(0, 0, 0, 0); // Midnight

    // End: 7 days after start
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    console.log(`Creating sample challenge: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()} (7 days)`);

    await prisma.challenge.create({
      data: {
        creatorId: userId,
        title: '5K Daily Run Club',
        description: 'Join our 7-day running challenge! Run 5K daily and upload proof of your workout. Complete the challenge to earn rewards and build a healthy habit.',
        stakeAmount: 0.1, // 0.1 SOL stake
        image: 'https://images.unsplash.com/photo-1593079831268-3381b0db4a77',
        startDate: startDate,
        endDate: endDate,
        verificationType: 'PHOTO',
        difficulty: 'MODERATE',
        metrics: 'Distance (5K daily)',
        rules: [
          'Upload a photo or screenshot after each 5K run',
          'Submit proof within 24 hours of completing your run',
          'Complete at least 80% of days to win'
        ],
        totalPrizePool: 0.5, // 0.5 SOL total prize pool
        participants: 0,
        hostType: 'PERSONAL',
        sponsor: 'Proven',
        trackingMetrics: ['distance', 'time'],
      },
    });

    console.log('Sample challenge created successfully!');
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Seed failed', e);
    await prisma.$disconnect();
    process.exit(1);
  });
