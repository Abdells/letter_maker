import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local from project ROOT (where package.json lives)
const envPath = path.resolve(process.cwd(), '.env.local');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Failed to load .env.local:', result.error.message);
  process.exit(1);
}

// Debug: Confirm loading
console.log('Env file attempted:', envPath);
console.log('dotenv loaded successfully?', result.parsed ? 'YES' : 'NO');
console.log('MONGODB_URI loaded?', !!process.env.MONGODB_URI);
if (process.env.MONGODB_URI) {
  console.log('MONGODB_URI (first 30 chars):', process.env.MONGODB_URI.substring(0, 30) + '...');
}
console.log('DATABASE_NAME:', process.env.DATABASE_NAME || 'not loaded');

import connectDB from '@/lib/db';
import LetterTemplate from '@/models/LetterTemplate';
import mongoose from 'mongoose';

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing templates (for dev — comment out in production)
    await (LetterTemplate as any).deleteMany({});

    const templates = [
      // Teacher: Recommendation Letter
      {
        category: 'teachers',
        type: 'student-recommendation',
        title: 'Recommendation Letter for Student',
        description: 'Standard recommendation for student (further studies/programs)',
        content: `GHANA EDUCATION SERVICE
[Your School Letterhead]

[School Name]
[School Address]
[Phone: {{schoolPhone}}]
[Email: {{schoolEmail}}]
Date: {{date}}

The Headmaster/Principal
{{recipientInstitution}}
{{recipientAddress}}

Dear Sir/Madam,

RE: RECOMMENDATION FOR {{studentName}} (Index No: {{indexNumber}})

I am pleased to recommend {{studentName}}, a former student of {{schoolName}}, who completed his/her {{program}} in {{graduationYear}}.

{{studentName}} was an exemplary student, demonstrating strong academic performance ({{gpa}} GPA) and excellent character. He/she participated actively in {{extracurriculars}}.

I have no hesitation in recommending {{studentName}} for {{purpose}}.

Yours faithfully,

{{teacherName}}
{{teacherPosition}}
{{schoolName}}
Contact: {{teacherPhone}}`,

        placeholders: ['date', 'recipientInstitution', 'recipientAddress', 'studentName', 'indexNumber', 'schoolName', 'program', 'graduationYear', 'gpa', 'extracurriculars', 'purpose', 'teacherName', 'teacherPosition', 'teacherPhone', 'schoolPhone', 'schoolEmail'],
      },

      // Teacher: Leave Application
      {
        category: 'teachers',
        type: 'leave-application',
        title: 'Application for Leave',
        description: 'Formal request for sick/annual/study leave',
        content: `{{schoolName}}
{{schoolAddress}}
Date: {{date}}

The Headmaster/Headmistress
{{schoolName}}

Dear Sir/Madam,

APPLICATION FOR {{leaveType}} LEAVE

I humbly apply for {{duration}} {{leaveType}} leave starting from {{startDate}} to {{endDate}} due to {{reason}}.

I have made arrangements for my duties to be handled by {{colleagueName}} during my absence.

Thank you for your kind consideration.

Yours faithfully,

{{teacherName}}
{{staffId}}
{{phoneNumber}}`,

        placeholders: ['schoolName', 'schoolAddress', 'date', 'leaveType', 'duration', 'startDate', 'endDate', 'reason', 'colleagueName', 'teacherName', 'staffId', 'phoneNumber'],
      },

      // Nurse: Patient Referral
      {
        category: 'nurses',
        type: 'patient-referral',
        title: 'Patient Referral Letter',
        description: 'Referral to specialist or another hospital',
        content: `{{hospitalName}}
{{hospitalAddress}}
{{phone}}
Date: {{date}}

The Medical Officer
{{referralHospital}}
{{referralAddress}}

Dear Colleague,

RE: REFERRAL OF {{patientName}}, Age {{patientAge}}, Gender {{patientGender}}

This is to refer the above-named patient who presented with {{symptoms}} for {{reasonForReferral}}.

Diagnosis: {{diagnosis}}
Treatment given: {{treatmentGiven}}

Thank you for your attention.

Yours sincerely,

{{nurseName}}
{{staffId}}
{{position}}
{{contact}}`,

        placeholders: ['hospitalName', 'hospitalAddress', 'phone', 'date', 'referralHospital', 'referralAddress', 'patientName', 'patientAge', 'patientGender', 'symptoms', 'reasonForReferral', 'diagnosis', 'treatmentGiven', 'nurseName', 'staffId', 'position', 'contact'],
      },
    ];

    await (LetterTemplate as any).insertMany(templates);
    console.log(`Successfully inserted ${templates.length} templates!`);

    await mongoose.connection.close();
    console.log('DB connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedData();