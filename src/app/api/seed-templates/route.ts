import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import LetterTemplate from '@/models/LetterTemplate';

export async function GET() {
  try {
    await connectDB();

    // Clear old ones (safe for dev)
    await LetterTemplate.deleteMany({});

    const templates = [
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

    await LetterTemplate.insertMany(templates);

    return NextResponse.json({ success: true, inserted: templates.length });
  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}