import { supabase } from './supabase';

export async function seedDatabase() {
  const MOCK_STUDENTS = [
    { id: '1', full_name: 'Leo Baisakina', grade_level: 'Grade 2', section: 'St. Jude', status: 'present' as const, holding_area: 'Classroom', qr_id: 'q1' },
    { id: '2', full_name: 'Mia Santos', grade_level: 'Grade 2', section: 'St. Jude', status: 'present' as const, holding_area: 'Classroom', qr_id: 'q2' },
    { id: '3', full_name: 'Noah Reyes', grade_level: 'Grade 2', section: 'St. Jude', status: 'dismissed' as const, holding_area: 'Gate', qr_id: 'q3' },
    { id: '4', full_name: 'Iris Cruz', grade_level: 'Grade 2', section: 'St. Jude', status: 'absent' as const, holding_area: 'Home', qr_id: 'q4' },
  ];

  const MOCK_FETCHERS = [
    { id: 'f1', student_id: '1', name: 'Sarah Abad', relationship: 'Mother', relationship_type: 'Case 1' as const, phone_number: '+63 912 345 6789', is_active: true },
    { id: 'f2', student_id: '1', name: 'Roberto Abad', relationship: 'Father', relationship_type: 'Case 2' as const, phone_number: '+63 998 765 4321', is_active: true },
    { id: 'f3', student_id: '1', name: 'Lola Remedios', relationship: 'Grandmother', relationship_type: 'Case 3' as const, phone_number: '+63 922 111 2222', is_active: true },
    { id: 'f4', student_id: '2', name: 'Elena Santos', relationship: 'Aunt', relationship_type: 'Case 1' as const, phone_number: '+63 917 000 1111', is_active: true },
  ];

  try {
    // 1. Seed Students
    const { error: studentError } = await supabase
      .from('students')
      .upsert(MOCK_STUDENTS, { onConflict: 'id' });

    if (studentError) throw studentError;

    // 2. Seed Fetchers
    const { error: fetcherError } = await supabase
      .from('fetchers')
      .upsert(MOCK_FETCHERS, { onConflict: 'id' });

    if (fetcherError) throw fetcherError;

    console.log("Database seeded successfully with Supabase!");
  } catch (err) {
    console.error("Error seeding database: ", err);
    throw err;
  }
}
