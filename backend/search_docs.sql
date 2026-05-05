SELECT case_num, jsonb_array_length(documents) as doc_count 
FROM legal_cases 
WHERE documents::text LIKE '%video-pleading%';
