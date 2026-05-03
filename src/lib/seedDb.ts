import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function seedDatabase() {
  const MOCK_STUDENTS = [
    { id: '1', full_name: 'Leo Baisakina', grade_level: 'Grade 2', section: 'St. Jude', status: 'present', holding_area: 'Classroom', qr_id: 'q1' },
    { id: '2', full_name: 'Mia Santos', grade_level: 'Grade 2', section: 'St. Jude', status: 'present', holding_area: 'Classroom', qr_id: 'q2' },
    { id: '3', full_name: 'Noah Reyes', grade_level: 'Grade 2', section: 'St. Jude', status: 'dismissed', holding_area: 'Gate', qr_id: 'q3' },
    { id: '4', full_name: 'Iris Cruz', grade_level: 'Grade 2', section: 'St. Jude', status: 'absent', holding_area: 'Home', qr_id: 'q4' },
  ];

  const MOCK_FETCHERS = {
    '1': [
      { id: 'f1', student_id: '1', name: 'Sarah Abad', relationship: 'Mother', relationship_type: 'Case 1', phone_number: '+63 912 345 6789', is_active: true },
      { id: 'f2', student_id: '1', name: 'Roberto Abad', relationship: 'Father', relationship_type: 'Case 2', phone_number: '+63 998 765 4321', is_active: true },
      { id: 'f3', student_id: '1', name: 'Lola Remedios', relationship: 'Grandmother', relationship_type: 'Case 3', phone_number: '+63 922 111 2222', is_active: true },
    ],
    '2': [
      { id: 'f4', student_id: '2', name: 'Elena Santos', relationship: 'Aunt', relationship_type: 'Case 1', phone_number: '+63 917 000 1111', is_active: true },
    ]
  };

  try {
    for (const student of MOCK_STUDENTS) {
      await setDoc(doc(db, 'students', student.id), {
         full_name: student.full_name,
         grade_level: student.grade_level,
         section: student.section,
         status: student.status,
         holding_area: student.holding_area,
         qr_id: student.qr_id,
      });
    }

    for (const studentId in MOCK_FETCHERS) {
      for (const fetcher of MOCK_FETCHERS[studentId as keyof typeof MOCK_FETCHERS]) {
        await setDoc(doc(db, 'fetchers', fetcher.id), {
          student_id: fetcher.student_id,
          name: fetcher.name,
          relationship: fetcher.relationship,
          relationship_type: fetcher.relationship_type,
          phone_number: fetcher.phone_number,
          is_active: fetcher.is_active,
        });
      }
    }
  } catch (err) {
    console.error("Error seeding database: ", err);
    throw err;
  }
}
