import { PrismaClient } from '../lib/generated/prisma';
import type { 
  StaffRole, 
  FeedType, 
  ExpenseCategory, 
  RevenueSource, 
  AttendanceStatus,
  LeaveType,
  LeaveStatus,
  DeathCause,
  DiseaseClass,
  TreatmentResponse,
  BankName,
  FeedUnit,
  InventoryType
} from '../lib/generated/prisma';

const prisma = new PrismaClient();

// Ethiopian names data
const ethiopianFirstNames = {
  male: [
    'Abebe', 'Alemayehu', 'Amare', 'Asefa', 'Bekele', 'Berhe', 'Dawit', 'Ephrem',
    'Fekadu', 'Getachew', 'Haile', 'Kebede', 'Lemma', 'Mekonnen', 'Negash', 'Tadesse',
    'Tesfaye', 'Wolde', 'Yohannes', 'Zerihun', 'Mulugeta', 'Girma', 'Berhanu', 'Desta',
    'Kassahun', 'Mamo', 'Sisay', 'Tilahun', 'Worku', 'Yitbarek'
  ],
  female: [
    'Almaz', 'Aster', 'Birtukan', 'Desta', 'Eleni', 'Fantu', 'Genet', 'Hanan',
    'Iyerusalem', 'Kalkidan', 'Liya', 'Meron', 'Nardos', 'Rahel', 'Selamawit', 'Tigist',
    'Wubit', 'Yeshi', 'Zara', 'Meseret', 'Hiwot', 'Tsehay', 'Marta', 'Senait',
    'Kidist', 'Mahlet', 'Bethlehem', 'Selam', 'Hanna', 'Mekdes'
  ]
};

const ethiopianLastNames = [
  'Abebe', 'Alemayehu', 'Alemu', 'Asfaw', 'Bekele', 'Berhe', 'Desta', 'Ephrem',
  'Fekadu', 'Getachew', 'Girma', 'Haile', 'Kebede', 'Lemma', 'Mekonnen', 'Negash',
  'Tadesse', 'Tesfaye', 'Wolde', 'Yohannes', 'Zerihun', 'Mulugeta', 'Berhanu',
  'Kassahun', 'Mamo', 'Sisay', 'Tilahun', 'Worku', 'Yitbarek', 'Teshome', 'Ayele'
];

const ethiopianCompanyNames = [
  'Addis Ababa Feed Supply', 'Ethiopian Poultry Supplies', 'Habesha Feed Co.',
  'Blue Nile Agricultural Supplies', 'Rift Valley Feed Company', 'Sheger Feed Industries',
  'Awash Valley Supplies', 'Bole Feed Distribution', 'Merkato Agricultural Store',
  'Entoto Feed Company', 'Sidama Feed Suppliers', 'Oromia Agricultural Supplies'
];

const ethiopianCities = [
  'Addis Ababa', 'Dire Dawa', 'Mekelle', 'Gondar', 'Awasa', 'Bahir Dar',
  'Jimma', 'Jijiga', 'Shashamane', 'Nekemte', 'Debre Markos', 'Harar'
];

// Utility functions
function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function generateEthiopianName(gender?: 'male' | 'female'): { firstName: string; lastName: string; fullName: string } {
  const selectedGender = gender || (Math.random() > 0.5 ? 'male' : 'female');
  const firstName = getRandomElement(ethiopianFirstNames[selectedGender]);
  const lastName = getRandomElement(ethiopianLastNames);
  return {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`
  };
}

function generatePhoneNumber(): string {
  const prefixes = ['091', '092', '093', '094', '095'];
  const prefix = getRandomElement(prefixes);
  const number = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  return `${prefix}${number}`;
}

async function seedStaff() {
  console.log('🧑‍💼 Seeding staff members...');
  
  const staffData = [];
  
  // Create admin users
  for (let i = 0; i < 2; i++) {
    const name = generateEthiopianName();
    staffData.push({
      firstName: name.firstName,
      lastName: name.lastName,
      name: name.fullName,
      email: `${name.firstName.toLowerCase()}.${name.lastName.toLowerCase()}@poultry.et`,
      phoneNumber: generatePhoneNumber(),
      role: 'ADMIN' as StaffRole,
      isActive: true,
      isSystemUser: i === 0
    });
  }
  
  // Create veterinarians
  for (let i = 0; i < 3; i++) {
    const name = generateEthiopianName();
    staffData.push({
      firstName: name.firstName,
      lastName: name.lastName,
      name: name.fullName,
      email: `dr.${name.firstName.toLowerCase()}@poultry.et`,
      phoneNumber: generatePhoneNumber(),
      role: 'VETERINARIAN' as StaffRole,
      isActive: true,
      isSystemUser: false
    });
  }
  
  // Create workers
  for (let i = 0; i < 15; i++) {
    const name = generateEthiopianName();
    staffData.push({
      firstName: name.firstName,
      lastName: name.lastName,
      name: name.fullName,
      email: Math.random() > 0.3 ? `${name.firstName.toLowerCase()}${i + 1}@poultry.et` : null,
      phoneNumber: generatePhoneNumber(),
      role: 'WORKER' as StaffRole,
      isActive: Math.random() > 0.1,
      isSystemUser: false
    });
  }
  
  const createdStaff = [];
  for (const staff of staffData) {
    const created = await prisma.staff.create({ data: staff });
    createdStaff.push(created);
  }
  
  console.log(`✅ Created ${createdStaff.length} staff members`);
  return createdStaff;
}

async function seedFeedSuppliers() {
  console.log('🏢 Seeding feed suppliers...');
  
  const suppliersData = [];
  
  for (let i = 0; i < ethiopianCompanyNames.length; i++) {
    const contactName = generateEthiopianName();
    const city = getRandomElement(ethiopianCities);
    
    suppliersData.push({
      name: ethiopianCompanyNames[i],
      contactName: contactName.fullName,
      phone: generatePhoneNumber(),
      address: `${getRandomElement(['Kebele 01', 'Kebele 02', 'Kebele 03'])}, ${city}, Ethiopia`,
      notes: `Established supplier in ${city} region`,
      isActive: Math.random() > 0.1
    });
  }
  
  const createdSuppliers = [];
  for (const supplier of suppliersData) {
    const created = await prisma.feedSupplier.create({ data: supplier });
    createdSuppliers.push(created);
  }
  
  console.log(`✅ Created ${createdSuppliers.length} feed suppliers`);
  return createdSuppliers;
}

async function seedFeedInventory(suppliers: any[]) {
  console.log('🌾 Seeding feed inventory...');
  
  const feedTypes: FeedType[] = ['LAYER_STARTER', 'REARING', 'PULLET_FEED', 'LAYER', 'LAYER_PHASE_1'];
  const feedInventoryData = [];
  
  for (const feedType of feedTypes) {
    for (let i = 0; i < 3; i++) {
      const supplier = getRandomElement(suppliers);
      const quantity = getRandomFloat(500, 5000);
      const costPerUnit = getRandomFloat(25, 45);
      
      feedInventoryData.push({
        feedType,
        supplierId: supplier.id,
        quantity,
        unit: 'KG' as FeedUnit,
        costPerUnit,
        totalCost: quantity * costPerUnit,
        notes: `Quality ${feedType.toLowerCase()} feed from ${supplier.name}`,
        isActive: Math.random() > 0.05
      });
    }
  }
  
  const createdInventory = [];
  for (const inventory of feedInventoryData) {
    const created = await prisma.feedInventory.create({ data: inventory });
    createdInventory.push(created);
  }
  
  console.log(`✅ Created ${createdInventory.length} feed inventory items`);
  return createdInventory;
}

async function seedFlocks() {
  console.log('🐔 Seeding flocks...');
  
  const flocksData = [];
  const currentDate = new Date();
  
  // Create flocks with different ages (6 flocks total)
  for (let i = 0; i < 6; i++) {
    const arrivalDate = getRandomDate(
      new Date(currentDate.getTime() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
      new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000)   // 1 month ago
    );
    
    const ageInDays = Math.floor((currentDate.getTime() - arrivalDate.getTime()) / (24 * 60 * 60 * 1000));
    const initialCount = getRandomInt(800, 2000);
    const mortalityRate = getRandomFloat(0.02, 0.08); // 2-8% mortality
    const currentCount = Math.floor(initialCount * (1 - mortalityRate));
    
    flocksData.push({
      batchCode: `FL${arrivalDate.getFullYear()}${String(i + 1).padStart(2, '0')}`,
      arrivalDate,
      initialCount,
      currentCount,
      ageInDays,
      notes: `Batch arrived from ${getRandomElement(ethiopianCities)} hatchery`
    });
  }
  
  const createdFlocks = [];
  for (const flock of flocksData) {
    const created = await prisma.flocks.create({ data: flock });
    createdFlocks.push(created);
  }
  
  console.log(`✅ Created ${createdFlocks.length} flocks`);
  return createdFlocks;
}

async function seedProductionData(flocks: any[], staff: any[]) {
  console.log('🥚 Seeding production data...');
  
  const currentDate = new Date();
  let totalRecords = 0;
  
  for (const flock of flocks) {
    const flockAge = flock.ageInDays;
    const startDate = new Date(flock.arrivalDate);
    
    // Generate records with strategic spacing to spread across months
    const daysSinceArrival = Math.floor((currentDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    
    // Only generate egg production records for layers older than 120 days
    if (daysSinceArrival > 120) {
      const eggProductionStartDay = 120;
      const eggProductionDays = daysSinceArrival - eggProductionStartDay;
      
      // Generate records every 2-3 days to spread data across months
      const recordInterval = getRandomInt(2, 4);
      
      for (let day = eggProductionStartDay; day < daysSinceArrival; day += recordInterval) {
        const recordDate = new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000);
        
        // Calculate production rate based on flock age (peaks around 200-300 days)
        const ageInDays = day;
        let productionRate;
        if (ageInDays < 150) {
          productionRate = Math.min(0.6, (ageInDays - 120) / 50); // Gradual increase
        } else if (ageInDays < 300) {
          productionRate = getRandomFloat(0.75, 0.9); // Peak production
        } else {
          productionRate = Math.max(0.4, 0.9 - (ageInDays - 300) / 200); // Gradual decline
        }
        
        const dailyEggs = Math.floor(flock.currentCount * productionRate * getRandomFloat(0.85, 1.15));
        
        if (dailyEggs > 0) {
          // Calculate egg quality distribution with seasonal variations
          const month = recordDate.getMonth();
          let normalRate, crackedRate, spoiledRate;
          
          // Seasonal quality variations (better quality in cooler months)
          if (month >= 10 || month <= 2) { // Nov-Feb (cooler months)
            normalRate = getRandomFloat(0.90, 0.96);
            crackedRate = getRandomFloat(0.02, 0.05);
            spoiledRate = getRandomFloat(0.01, 0.03);
          } else { // Mar-Oct (warmer months)
            normalRate = getRandomFloat(0.85, 0.92);
            crackedRate = getRandomFloat(0.04, 0.08);
            spoiledRate = getRandomFloat(0.02, 0.05);
          }
          
          const crackedCount = Math.floor(dailyEggs * crackedRate);
          const spoiledCount = Math.floor(dailyEggs * spoiledRate);
          const normalCount = dailyEggs - crackedCount - spoiledCount;
          
          await prisma.eggProduction.create({
            data: {
              flockId: flock.id,
              date: recordDate,
              totalCount: dailyEggs,
              gradeCounts: {
                normal: normalCount,
                cracked: crackedCount,
                spoiled: spoiledCount
              },
              notes: day % 14 === 0 ? 'Bi-weekly quality assessment completed' : null
            }
          });
          totalRecords++;
        }
      }
    }
    
    // Generate mortality records (less frequent but spread across time)
    const mortalityInterval = getRandomInt(7, 21); // Every 1-3 weeks
    for (let day = 0; day < daysSinceArrival; day += mortalityInterval) {
      const recordDate = new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000);
      
      // Mortality records (random occurrences)
      if (Math.random() < 0.3) { // 30% chance of mortality record per interval
        const mortalityCount = getRandomInt(1, 5);
        const causes: DeathCause[] = ['disease', 'injury', 'environmental', 'unknown'];
        
        await prisma.mortality.create({
          data: {
            flockId: flock.id,
            date: recordDate,
            count: mortalityCount,
            cause: getRandomElement(causes),
            causeDescription: 'Natural mortality in flock',
            recordedById: getRandomElement(staff).id
          }
        });
        totalRecords++;
      }
    }
    
    // Generate manure production records (weekly)
    for (let week = 0; week < Math.floor(daysSinceArrival / 7); week++) {
      const recordDate = new Date(startDate.getTime() + week * 7 * 24 * 60 * 60 * 1000);
      
      await prisma.manureProduction.create({
        data: {
          flockId: flock.id,
          date: recordDate,
          quantity: getRandomFloat(50, 150), // kg per week
          notes: 'Weekly manure collection'
        }
      });
      totalRecords++;
    }
  }
  
  console.log(`✅ Created ${totalRecords} production records`);
}

async function seedFeedUsage(flocks: any[], feedInventory: any[], staff: any[]) {
  console.log('🌾 Seeding feed usage records...');
  
  const currentDate = new Date();
  let totalRecords = 0;
  
  for (const flock of flocks) {
    const flockAge = flock.ageInDays;
    const startDate = new Date(flock.arrivalDate);
    
    // Generate weekly feed usage records
    for (let week = 0; week < Math.floor(flockAge / 7); week++) {
      const recordDate = new Date(startDate.getTime() + week * 7 * 24 * 60 * 60 * 1000);
      
      // Determine appropriate feed type based on age
      let feedType: FeedType = 'LAYER_STARTER';
      const ageInWeeks = Math.floor(flockAge / 7);
      
      if (ageInWeeks < 4) feedType = 'LAYER_STARTER';
      else if (ageInWeeks < 10) feedType = 'REARING';
      else if (ageInWeeks < 18) feedType = 'PULLET_FEED';
      else if (ageInWeeks < 21) feedType = 'LAYER';
      else feedType = 'LAYER_PHASE_1';
      
      const appropriateFeed = feedInventory.find(f => f.feedType === feedType);
      if (appropriateFeed) {
        const weeklyConsumption = getRandomFloat(200, 800); // kg per week
        
        await prisma.feedUsage.create({
          data: {
            flockId: flock.id,
            feedId: appropriateFeed.id,
            date: recordDate,
            amountUsed: weeklyConsumption,
            unit: 'KG' as FeedUnit,
            notes: `Weekly feed consumption for ${flock.batchCode}`,
            recordedById: getRandomElement(staff).id
          }
        });
        totalRecords++;
      }
    }
  }
  
  console.log(`✅ Created ${totalRecords} feed usage records`);
}

async function seedFinancialData() {
  console.log('💰 Seeding financial data...');
  
  const currentDate = new Date();
  const startDate = new Date(currentDate.getTime() - 365 * 24 * 60 * 60 * 1000); // 1 year ago
  
  let totalRecords = 0;
  
  // Generate monthly expenses
  for (let month = 0; month < 12; month++) {
    const monthDate = new Date(startDate.getTime() + month * 30 * 24 * 60 * 60 * 1000);
    
    const expenseCategories: ExpenseCategory[] = ['feed', 'medicine', 'labor', 'utilities', 'maintenance', 'other'];
    
    for (const category of expenseCategories) {
      let amount: number;
      let description: string;
      
      switch (category) {
        case 'feed':
          amount = getRandomFloat(50000, 150000);
          description = 'Monthly feed purchase from suppliers';
          break;
        case 'medicine':
          amount = getRandomFloat(5000, 25000);
          description = 'Veterinary medicines and vaccines';
          break;
        case 'labor':
          amount = getRandomFloat(30000, 80000);
          description = 'Staff salaries and wages';
          break;
        case 'utilities':
          amount = getRandomFloat(8000, 20000);
          description = 'Electricity, water, and other utilities';
          break;
        case 'maintenance':
          amount = getRandomFloat(3000, 15000);
          description = 'Equipment and facility maintenance';
          break;
        default:
          amount = getRandomFloat(2000, 10000);
          description = 'Miscellaneous operational expenses';
      }
      
      await prisma.expenses.create({
        data: {
          category,
          quantity: 1,
          costPerQuantity: amount,
          amount,
          date: monthDate,
          description
        }
      });
      totalRecords++;
    }
  }
  
  // Generate revenue records
  const revenueSources: RevenueSource[] = ['egg_sales', 'bird_sales', 'manure', 'other'];
  
  for (let month = 0; month < 12; month++) {
    const monthDate = new Date(startDate.getTime() + month * 30 * 24 * 60 * 60 * 1000);
    
    for (const source of revenueSources) {
      let amount: number;
      let quantity: number;
      let costPerQuantity: number;
      let description: string;
      
      switch (source) {
        case 'egg_sales':
          quantity = getRandomFloat(15000, 35000); // eggs per month
          costPerQuantity = getRandomFloat(3, 5); // birr per egg
          amount = quantity * costPerQuantity;
          description = 'Monthly egg sales to local markets';
          break;
        case 'bird_sales':
          quantity = getRandomFloat(50, 200); // birds per month
          costPerQuantity = getRandomFloat(300, 600); // birr per bird
          amount = quantity * costPerQuantity;
          description = 'Sale of culled and mature birds';
          break;
        case 'manure':
          quantity = getRandomFloat(500, 1500); // kg per month
          costPerQuantity = getRandomFloat(2, 4); // birr per kg
          amount = quantity * costPerQuantity;
          description = 'Organic manure sales to farmers';
          break;
        default:
          quantity = 1;
          costPerQuantity = getRandomFloat(5000, 15000);
          amount = costPerQuantity;
          description = 'Other miscellaneous income';
      }
      
      const banks: BankName[] = ['COMMERCIAL_BANK_OF_ETHIOPIA', 'AWASH_BANK', 'DASHEN_BANK'];
      
      await prisma.revenue.create({
        data: {
          source,
          quantity,
          costPerQuantity,
          amount,
          date: monthDate,
          description,
          transactionBy: generateEthiopianName().fullName,
          bankName: Math.random() > 0.3 ? getRandomElement(banks) : null,
          bankAccountNumber: Math.random() > 0.3 ? `1000${getRandomInt(100000, 999999)}` : null
        }
      });
      totalRecords++;
    }
  }
  
  console.log(`✅ Created ${totalRecords} financial records`);
}

async function seedAttendanceAndPayroll(staff: any[]) {
  console.log('📅 Seeding attendance and payroll data...');
  
  const currentDate = new Date();
  const startDate = new Date(currentDate.getTime() - 90 * 24 * 60 * 60 * 1000); // 3 months ago
  
  let totalRecords = 0;
  
  // Generate attendance for last 3 months
  for (const staffMember of staff) {
    if (!staffMember.isActive) continue;
    
    for (let day = 0; day < 90; day++) {
      const attendanceDate = new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000);
      
      // Skip weekends (assuming Saturday = 6, Sunday = 0)
      if (attendanceDate.getDay() === 0 || attendanceDate.getDay() === 6) continue;
      
      const attendanceStatuses: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'ON_LEAVE'];
      const status = Math.random() > 0.1 ? 'PRESENT' : getRandomElement(attendanceStatuses);
      
      let checkIn: Date | null = null;
      let checkOut: Date | null = null;
      let hours: number | null = null;
      
      if (status === 'PRESENT') {
        checkIn = new Date(attendanceDate);
        checkIn.setHours(getRandomInt(7, 9), getRandomInt(0, 59));
        
        checkOut = new Date(attendanceDate);
        checkOut.setHours(getRandomInt(16, 18), getRandomInt(0, 59));
        
        hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
      }
      
      await prisma.attendance.create({
        data: {
          staffId: staffMember.id,
          date: attendanceDate,
          status,
          checkIn,
          checkOut,
          hours
        }
      });
      totalRecords++;
    }
    
    // Generate monthly payroll for last 3 months
    for (let month = 0; month < 3; month++) {
      const payrollDate = new Date(currentDate.getTime() - (2 - month) * 30 * 24 * 60 * 60 * 1000);
      
      let baseSalary: number;
      switch (staffMember.role) {
        case 'ADMIN':
          baseSalary = getRandomFloat(15000, 25000);
          break;
        case 'VETERINARIAN':
          baseSalary = getRandomFloat(12000, 20000);
          break;
        default:
          baseSalary = getRandomFloat(3000, 8000);
      }
      
      const bonus = Math.random() > 0.7 ? getRandomFloat(500, 2000) : 0;
      const deductions = getRandomFloat(100, 500);
      
      await prisma.payroll.create({
        data: {
          staffId: staffMember.id,
          salary: baseSalary,
          bonus: bonus > 0 ? bonus : null,
          deductions,
          paidOn: payrollDate
        }
      });
      totalRecords++;
    }
    
    // Create leave balance
    await prisma.leaveBalance.create({
      data: {
        staffId: staffMember.id,
        year: currentDate.getFullYear(),
        totalLeaveDays: 30,
        usedLeaveDays: getRandomInt(0, 15),
        remainingLeaveDays: 30 - getRandomInt(0, 15)
      }
    });
    totalRecords++;
  }
  
  console.log(`✅ Created ${totalRecords} attendance and payroll records`);
}

async function seedTreatmentsAndVaccinations(flocks: any[], staff: any[]) {
  console.log('💉 Seeding treatments and vaccinations...');
  
  const veterinarians = staff.filter(s => s.role === 'VETERINARIAN');
  let totalRecords = 0;
  
  for (const flock of flocks) {
    const flockAge = flock.ageInDays;
    
    // Vaccinations (scheduled based on age)
    const vaccinationSchedule = [
      { age: 1, vaccine: 'Marek Disease', dosage: '0.2ml per bird' },
      { age: 7, vaccine: 'Newcastle Disease', dosage: '0.3ml per bird' },
      { age: 14, vaccine: 'Infectious Bronchitis', dosage: '0.3ml per bird' },
      { age: 21, vaccine: 'Gumboro Disease', dosage: '0.5ml per bird' },
      { age: 35, vaccine: 'Newcastle Disease Booster', dosage: '0.3ml per bird' },
      { age: 120, vaccine: 'Layer Vaccination', dosage: '0.5ml per bird' }
    ];
    
    for (const vaccination of vaccinationSchedule) {
      if (flockAge >= vaccination.age) {
        const vaccinationDate = new Date(flock.arrivalDate.getTime() + vaccination.age * 24 * 60 * 60 * 1000);
        
        await prisma.vaccinations.create({
          data: {
            flockId: flock.id,
            vaccineName: vaccination.vaccine,
            administeredDate: vaccinationDate,
            administeredBy: getRandomElement(veterinarians).name,
            dosage: vaccination.dosage,
            quantity: flock.currentCount,
            notes: `Routine vaccination as per schedule`,
            status: 'completed'
          }
        });
        totalRecords++;
      }
    }
    
    // Random treatments (disease occurrences)
    if (Math.random() < 0.3) { // 30% chance of disease treatment
      const diseases: DiseaseClass[] = ['respiratory', 'digestive', 'parasitic', 'nutritional', 'other'];
      const responses: TreatmentResponse[] = ['improved', 'no_change', 'worsened'];
      
      const treatmentDate = getRandomDate(flock.arrivalDate, new Date());
      
      await prisma.treatments.create({
        data: {
          flockId: flock.id,
          disease: getRandomElement(diseases),
          diseaseName: 'Respiratory infection',
          medication: 'Antibiotics',
          dosage: '5mg per bird',
          frequency: 'Twice daily',
          duration: '7 days',
          startDate: treatmentDate,
          endDate: new Date(treatmentDate.getTime() + 7 * 24 * 60 * 60 * 1000),
          response: getRandomElement(responses),
          symptoms: 'Coughing, reduced appetite',
          notes: 'Treated with veterinary supervision',
          treatedById: getRandomElement(veterinarians).id
        }
      });
      totalRecords++;
    }
  }
  
  console.log(`✅ Created ${totalRecords} treatment and vaccination records`);
}

async function seedInventory() {
  console.log('📦 Seeding general inventory...');
  
  const inventoryTypes: InventoryType[] = ['MEDICINE', 'FEED', 'EGG', 'OTHER'];
  const inventoryData = [];
  
  // Medicine inventory
  const medicines = [
    'Antibiotics', 'Vitamins', 'Vaccines', 'Dewormers', 'Disinfectants'
  ];
  
  for (const medicine of medicines) {
    inventoryData.push({
      type: 'MEDICINE' as InventoryType,
      name: medicine,
      quantity: getRandomFloat(10, 100),
      unit: 'bottles',
      threshold: 5,
      medicineDetails: {
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        manufacturer: getRandomElement(ethiopianCompanyNames)
      },
      costPerUnit: getRandomFloat(50, 300),
      totalValue: 0, // Will be calculated
      notes: `Essential medicine for poultry health`
    });
  }
  
  // Other inventory items
  const otherItems = [
    'Feeders', 'Waterers', 'Egg Trays', 'Cleaning Supplies', 'Tools'
  ];
  
  for (const item of otherItems) {
    const quantity = getRandomFloat(20, 200);
    const costPerUnit = getRandomFloat(25, 150);
    
    inventoryData.push({
      type: 'OTHER' as InventoryType,
      name: item,
      quantity,
      unit: 'pieces',
      threshold: 10,
      costPerUnit,
      totalValue: quantity * costPerUnit,
      notes: `Essential equipment for farm operations`
    });
  }
  
  // Calculate total values and create records
  for (const item of inventoryData) {
    if (item.totalValue === 0) {
      item.totalValue = item.quantity * item.costPerUnit;
    }
    
    await prisma.inventory.create({ data: item });
  }
  
  console.log(`✅ Created ${inventoryData.length} inventory items`);
}

async function main() {
  try {
    console.log('🚀 Starting database seeding with Ethiopian data...');
    
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection established');
    
    // Clear existing data (be careful with this in production!)
    console.log('🗑️ Clearing existing data...');
    await prisma.feedUsage.deleteMany({});
    await prisma.eggProduction.deleteMany({});
    await prisma.broilerProduction.deleteMany({});
    await prisma.manureProduction.deleteMany({});
    await prisma.mortality.deleteMany({});
    await prisma.treatments.deleteMany({});
    await prisma.vaccinations.deleteMany({});
    await prisma.notifications.deleteMany({});
    await prisma.flocks.deleteMany({});
    await prisma.feedInventory.deleteMany({});
    await prisma.feedSupplier.deleteMany({});
    await prisma.attendance.deleteMany({});
    await prisma.payroll.deleteMany({});
    await prisma.leaveBalance.deleteMany({});
    await prisma.leaveRequest.deleteMany({});
    await prisma.expenses.deleteMany({});
    await prisma.revenue.deleteMany({});
    await prisma.inventory.deleteMany({});
    await prisma.staff.deleteMany({});
    
    // Seed data in order (respecting foreign key constraints)
    const staff = await seedStaff();
    const suppliers = await seedFeedSuppliers();
    const feedInventory = await seedFeedInventory(suppliers);
    const flocks = await seedFlocks();
    
    await seedProductionData(flocks, staff);
    await seedFeedUsage(flocks, feedInventory, staff);
    await seedFinancialData();
    await seedAttendanceAndPayroll(staff);
    await seedTreatmentsAndVaccinations(flocks, staff);
    await seedInventory();
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Staff members: ${staff.length}`);
    console.log(`   - Feed suppliers: ${suppliers.length}`);
    console.log(`   - Feed inventory items: ${feedInventory.length}`);
    console.log(`   - Flocks: ${flocks.length}`);
    console.log('   - Production, financial, and operational data generated');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
main()
  .catch((error) => {
    console.error('Seed script failed:', error);
    process.exit(1);
  });
