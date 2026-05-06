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
const clinicDoctorRefs = [...clinicsText.matchAll(/'([^']+)'/g)].map(m => m[1]).filter(id => id.includes('-') && id.split('-')[0].length <= 3 && !id.startsWith('c-'));

const missing = clinicDoctorRefs.filter(id => !doctorIds.includes(id));
if (missing.length > 0) {
  console.log('Missing Doctors (referenced in CLINICS but not in DOCTORS):', [...new Set(missing)]);
} else {
  console.log('All referenced doctors are present in DOCTORS array.');
}
