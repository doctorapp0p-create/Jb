const fs = require('fs');
const content = fs.readFileSync('constants.ts', 'utf8');

const doctorsMatch = content.match(/export const DOCTORS: Doctor\[\] = \[([\s\S]*?)\];/);
const clinicsMatch = content.match(/export const CLINICS: Clinic\[\] = \[([\s\S]*?)\];/);

if (!doctorsMatch || !clinicsMatch) {
  console.log('Could not find DOCTORS or CLINICS array');
  process.exit(1);
}

const doctorsText = doctorsMatch[1];
const clinicsText = clinicsMatch[1];

const doctorIds = [...doctorsText.matchAll(/id:\s*'([^']+)'/g)].map(m => m[1]);
const clinicDoctorRefs = [...clinicsText.matchAll(/'([^']+)'/g)].map(m => m[1]);

const orphaned = doctorIds.filter(id => !clinicDoctorRefs.includes(id));

if (orphaned.length > 0) {
  console.log('Orphaned Doctors (in DOCTORS but not assigned to any CLINIC):');
  orphaned.forEach(id => {
    const nameMatch = doctorsText.match(new RegExp(`id:\\s*'${id}',\\s*name:\\s*'([^']+)'`));
    console.log(`- ${id}: ${nameMatch ? nameMatch[1] : 'Unknown'}`);
  });
} else {
  console.log('All doctors in DOCTORS array are assigned to at least one clinic.');
}
