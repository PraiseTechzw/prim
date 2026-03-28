import 'dotenv/config';
import { db } from './db';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // 1. Create an Operator
    const operator = await db
      .insertInto('operators')
      .values({
        id: uuidv4(),
        name: 'Zim-Express Luxury',
        code: 'ZEL',
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // 2. Create a Bus
    const bus = await db
      .insertInto('buses')
      .values({
        id: uuidv4(),
        operator_id: operator.id,
        registration_number: 'AGE-1234',
        bus_class: 'Luxury',
        capacity: 52,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // 3. Create Seats for the bus (1A, 1B, 1C, 1D ... 13D)
    const seats = [];
    const rows = 13;
    const cols = ['A', 'B', 'C', 'D'];
    for (let r = 1; r <= rows; r++) {
      for (const c of cols) {
        seats.push({
          id: uuidv4(),
          bus_id: bus.id,
          seat_identifier: `${r}${c}`,
        });
      }
    }
    await db.insertInto('seats').values(seats).execute();

    // 4. Create a Route
    const route = await db
      .insertInto('routes')
      .values({
        id: uuidv4(),
        operator_id: operator.id,
        origin: 'Harare',
        destination: 'Bulawayo',
        base_fare_usd: '25.00',
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // 5. Create some Trips
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);

    const trip1 = await db
      .insertInto('trips')
      .values({
        id: uuidv4(),
        route_id: route.id,
        bus_id: bus.id,
        departure_time: tomorrow,
        status: 'SCHEDULED',
      })
      .execute();

    const evening = new Date(tomorrow);
    evening.setHours(20, 0, 0, 0);
    
    const trip2 = await db
      .insertInto('trips')
      .values({
        id: uuidv4(),
        route_id: route.id,
        bus_id: bus.id,
        departure_time: evening,
        status: 'SCHEDULED',
      })
      .execute();

    console.log('✅ Seeding complete!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    process.exit();
  }
}

seed();
