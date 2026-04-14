import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const drugInteractions = [
  {
    drug1: 'Warfarin',
    drug2: 'Aspirin',
    severity: 'HIGH',
    description: 'Increased risk of bleeding when warfarin is combined with aspirin.',
    recommendation: 'Monitor INR closely. Consider alternative pain management or reduce aspirin dose.',
  },
  {
    drug1: 'Warfarin',
    drug2: 'Ibuprofen',
    severity: 'HIGH',
    description: 'NSAIDs may increase the anticoagulant effect of warfarin.',
    recommendation: 'Avoid concomitant use if possible. Use acetaminophen for pain relief instead.',
  },
  {
    drug1: 'Clopidogrel',
    drug2: 'Omeprazole',
    severity: 'MODERATE',
    description: 'Omeprazole may reduce the effectiveness of clopidogrel.',
    recommendation: 'Consider using pantoprazole instead of omeprazole.',
  },
  {
    drug1: 'Simvastatin',
    drug2: 'Amlodipine',
    severity: 'MODERATE',
    description: 'Amlodipine may increase simvastatin levels, increasing risk of myopathy.',
    recommendation: 'Limit simvastatin dose to 20mg daily when used with amlodipine.',
  },
  {
    drug1: 'Lisinopril',
    drug2: 'Potassium',
    severity: 'MODERATE',
    description: 'ACE inhibitors may increase potassium levels when combined with potassium supplements.',
    recommendation: 'Monitor potassium levels regularly.',
  },
  {
    drug1: 'Metformin',
    drug2: 'Contrast Dye',
    severity: 'HIGH',
    description: 'Risk of lactic acidosis when metformin is used with iodinated contrast.',
    recommendation: 'Hold metformin before and for 48 hours after contrast imaging.',
  },
  {
    drug1: 'Digoxin',
    drug2: 'Amiodarone',
    severity: 'HIGH',
    description: 'Amiodarone can increase digoxin levels to toxic levels.',
    recommendation: 'Reduce digoxin dose by 50% when starting amiodarone. Monitor digoxin levels.',
  },
  {
    drug1: 'Levothyroxine',
    drug2: 'Calcium',
    severity: 'LOW',
    description: 'Calcium supplements may reduce absorption of levothyroxine.',
    recommendation: 'Separate administration by at least 4 hours.',
  },
  {
    drug1: 'Levothyroxine',
    drug2: 'Iron',
    severity: 'LOW',
    description: 'Iron supplements may reduce absorption of levothyroxine.',
    recommendation: 'Separate administration by at least 4 hours.',
  },
  {
    drug1: 'Warfarin',
    drug2: 'Vitamin K',
    severity: 'HIGH',
    description: 'Vitamin K can reverse the anticoagulant effect of warfarin.',
    recommendation: 'Maintain consistent vitamin K intake. Monitor INR closely.',
  },
  {
    drug1: 'Metoprolol',
    drug2: 'Verapamil',
    severity: 'HIGH',
    description: 'Increased risk of bradycardia and heart block.',
    recommendation: 'Avoid concomitant use or monitor heart rate closely.',
  },
  {
    drug1: 'Fluoxetine',
    drug2: 'Tramadol',
    severity: 'HIGH',
    description: 'Increased risk of serotonin syndrome.',
    recommendation: 'Avoid concomitant use or monitor for signs of serotonin syndrome.',
  },
  {
    drug1: 'Allopurinol',
    drug2: 'Azathioprine',
    severity: 'CONTRAINDICATED',
    description: 'Allopurinol can increase azathioprine levels to toxic levels.',
    recommendation: 'Do not use together. Consider alternative medication.',
  },
  {
    drug1: 'Methotrexate',
    drug2: 'NSAIDs',
    severity: 'HIGH',
    description: 'NSAIDs may increase methotrexate toxicity.',
    recommendation: 'Avoid high-dose NSAIDs. Monitor methotrexate levels.',
  },
  {
    drug1: 'Tadalafil',
    drug2: 'Nitroglycerin',
    severity: 'CONTRAINDICATED',
    description: 'Severe hypotension may occur when PDE5 inhibitors are used with nitrates.',
    recommendation: 'Do not use together. Maintain 24-48 hour separation.',
  },
  {
    drug1: 'Spironolactone',
    drug2: 'Lisinopril',
    severity: 'MODERATE',
    description: 'Increased risk of hyperkalemia.',
    recommendation: 'Monitor potassium levels regularly.',
  },
  {
    drug1: 'Ciprofloxacin',
    drug2: 'Theophylline',
    severity: 'MODERATE',
    description: 'Ciprofloxacin may increase theophylline levels.',
    recommendation: 'Monitor theophylline levels and adjust dose if needed.',
  },
  {
    drug1: 'Clarithromycin',
    drug2: 'Simvastatin',
    severity: 'HIGH',
    description: 'Macrolide antibiotics can increase simvastatin levels significantly.',
    recommendation: 'Hold simvastatin during clarithromycin treatment.',
  },
  {
    drug1: 'Sertraline',
    drug2: 'Fentanyl',
    severity: 'MODERATE',
    description: 'Risk of serotonin syndrome when SSRIs are combined with fentanyl.',
    recommendation: 'Monitor for signs of serotonin syndrome.',
  },
  {
    drug1: 'Diltiazem',
    drug2: 'Atorvastatin',
    severity: 'LOW',
    description: 'Diltiazem may increase atorvastatin levels.',
    recommendation: 'Monitor for signs of statin toxicity. Consider dose adjustment.',
  },
];

async function main() {
  console.log('Seeding drug interactions...');

  for (const interaction of drugInteractions) {
    try {
      await prisma.drugInteraction.upsert({
        where: {
          drug1_drug2: {
            drug1: interaction.drug1,
            drug2: interaction.drug2,
          },
        },
        update: interaction,
        create: interaction,
      });
      console.log(`Added: ${interaction.drug1} + ${interaction.drug2}`);
    } catch (error) {
      console.error(`Error adding ${interaction.drug1} + ${interaction.drug2}:`, error.message);
    }
  }

  console.log('Drug interactions seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
