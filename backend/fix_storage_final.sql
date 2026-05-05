-- 1. Ensure storage schema usage is granted
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO anon;

-- 2. Bucket policies
DROP POLICY IF EXISTS "Authenticated users can select buckets" ON storage.buckets;
CREATE POLICY "Authenticated users can select buckets" ON storage.buckets FOR SELECT TO authenticated USING (true);

-- 3. Object policies for video-pleadings
DROP POLICY IF EXISTS "Authenticated users can upload video pleadings" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can do everything in video-pleadings" ON storage.objects;

CREATE POLICY "Authenticated users can do everything in video-pleadings" 
ON storage.objects FOR ALL TO authenticated 
USING (bucket_id = 'video-pleadings')
WITH CHECK (bucket_id = 'video-pleadings');

-- 4. Also ensure public read access is robust
DROP POLICY IF EXISTS "Public read access for video pleadings" ON storage.objects;
CREATE POLICY "Public read access for video pleadings"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'video-pleadings');

-- 5. Grant explicit table permissions
GRANT ALL ON TABLE storage.objects TO authenticated;
GRANT ALL ON TABLE storage.buckets TO authenticated;
