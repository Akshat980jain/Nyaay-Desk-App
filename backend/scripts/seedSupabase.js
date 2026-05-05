
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const EXPORT_DIR = path.join(__dirname, '../db_export');

async function seedTable(tableName, jsonFileName, mapFn) {
    console.log(`\n--- Seeding ${tableName} ---`);
    const filePath = path.join(EXPORT_DIR, jsonFileName);
    
    if (!fs.existsSync(filePath)) {
        console.warn(`File ${jsonFileName} not found, skipping...`);
        return;
    }

    const rawData = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(rawData);
    
    console.log(`Processing ${data.length} records...`);

    const batchSize = 100;
    for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize).map(mapFn).filter(item => item !== null);
        if (batch.length === 0) continue;

        const { error } = await supabase.from(tableName).upsert(batch, { 
            onConflict: tableName === 'enrollment_records' ? 'id' : (tableName === 'legal_cases' ? 'case_num' : (tableName === 'advocates' ? 'advocate_id' : (tableName === 'litigants' ? 'litigant_id' : 'id'))) 
        });
        
        if (error) {
            console.error(`\nError seeding batch starting at ${i}:`, error.message);
            // Log one item to see what went wrong
            console.log('Sample item from failed batch:', JSON.stringify(batch[0], null, 2));
        } else {
            process.stdout.write(`.`);
        }
    }
    console.log(`\nFinished ${tableName}`);
}

async function startSeeding() {
    try {
        // 1. Seed Advocates
        await seedTable('advocates', 'advocates.json', (d) => ({
            advocate_id: d.advocate_id,
            enrollment_no: d.enrollment_no,
            name: d.name,
            email: d.email,
            password: d.password,
            gender: d.gender,
            dob: d.dob,
            district: d.district,
            contact: d.contact,
            practice_details: d.practice_details,
            cop_document: d.cop_document,
            profile_picture: d.profilePicture,
            status: d.status,
            is_verified: d.isVerified || false,
            is_email_verified: d.isEmailVerified || false,
            verification_notes: d.verificationNotes
        }));

        // 2. Seed Litigants
        await seedTable('litigants', 'litigants.json', (d) => ({
            litigant_id: d.party_id, // Fix: Use party_id
            name: d.full_name || d.name, // Fix: Handle full_name
            email: d.contact?.email || d.email,
            password: d.password,
            phone: d.contact?.mobile || d.phone,
            district: d.address?.district || d.district,
            address: typeof d.address === 'object' ? JSON.stringify(d.address) : d.address,
            is_verified: d.isEmailVerified || false
        }));

        // 3. Seed Legal Cases
        await seedTable('legal_cases', 'legalcases.json', (d) => ({
            case_num: d.case_num,
            case_no: d.case_no,
            court: d.court,
            case_type: d.case_type,
            district: d.district,
            status: d.status,
            case_approved: d.case_approved || false,
            plaintiff_details: d.plaintiff_details,
            respondent_details: d.respondent_details,
            police_station_details: d.police_station_details,
            hearings: d.hearings || [],
            documents: d.documents || [],
            advocate_requests: d.advocate_requests || [],
            video_meeting: d.videoMeeting
        }));

        // 4. Seed Enrollment Records
        await seedTable('enrollment_records', 'enrollmentrecords.json', (d) => ({
            enrollment_no: d.ENROLLMENT_NO,
            name_of_advocate: d.NAME_OF_ADVOCATE,
            fathers_name_of_advocate: d.FATHERS_NAME_OF_ADVOCATE,
            address_of_advocate: d.ADDRESS_OF_ADVOCATE,
            district: d.DISTRICT,
            date_of_registration: d.DATE_OF_REGISTRATION,
            date_of_birth: d.DATE_OF_BIRTH
        }));

        console.log('\n--- Seeding Completed Successfully ---');
    } catch (err) {
        console.error('Seeding failed:', err);
    }
}

startSeeding();
