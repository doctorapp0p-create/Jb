import fs from 'fs';
const content = fs.readFileSync('constants.ts', 'utf8');

const doctorsMatch = content.match(/export const DOCTORS: Doctor\[\] = \[([\s\S]*?)\];/);
const clinicsMatch = content.match(/export const CLINICS: Clinic\[\] = \[([\s\S]*?)\];/);

if (!doctorsMatch) { console.error('DOCTORS not found'); process.exit(1); }
if (!clinicsMatch) { console.error('CLINICS not found'); process.exit(1); }

const doctorsText = doctorsMatch[1];
const clinicsText = clinicsMatch[1];

// Parse doctors
const doctors = [];
const doctorIds = [];
const doctorBlocks = doctorsText.split(/\{ id:/).slice(1);
doctorBlocks.forEach(block => {
  const idMatch = block.match(/'([^']+)'/);
  const clinicsMatch = block.match(/clinics:\s*\[([^\]]+)\]/);
  if (idMatch) {
    const id = idMatch[1];
    doctorIds.push(id);
    const clinics = clinicsMatch ? clinicsMatch[1].split(',').map(s => s.trim().replace(/'/g, '')) : [];
    doctors.push({ id, clinics });
  }
});
console.log(`Parsed ${doctorIds.length} doctors.`);

// Parse clinics
const clinics = [];
const clinicBlocks = clinicsText.split(/\{ id:/).slice(1);
clinicBlocks.forEach(block => {
  const idMatch = block.match(/'([^']+)'/);
  const doctorRefsMatch = block.match(/doctors:\s*\[([^\]]+)\]/);
  if (idMatch) {
    const id = idMatch[1];
    const doctorRefs = doctorRefsMatch ? doctorRefsMatch[1].split(',').map(s => s.trim().replace(/'/g, '')) : [];
    clinics.push({ id, doctorRefs });
  }
});

// Check consistency
clinics.forEach(c => {
  c.doctorRefs.forEach(dId => {
    const doctor = doctors.find(d => d.id === dId);
    if (!doctor) {
      console.log(`Error: Doctor ${dId} referenced in clinic ${c.id} but not found in DOCTORS array.`);
    } else if (!doctor.clinics.includes(c.id)) {
      console.log(`Inconsistency: Doctor ${dId} is listed in clinic ${c.id}, but the doctor object doesn't list ${c.id} in its 'clinics' property.`);
    }
  });
});

doctors.forEach(d => {
  d.clinics.forEach(cId => {
    const clinic = clinics.find(c => c.id === cId);
    if (!clinic) {
      console.log(`Warning: Doctor ${d.id} lists clinic ${cId}, but clinic ${cId} not found in CLINICS array.`);
    } else if (!clinic.doctorRefs.includes(d.id)) {
      console.log(`Inconsistency: Doctor ${d.id} lists clinic ${cId}, but the clinic object doesn't list the doctor.`);
    }
  });
});
