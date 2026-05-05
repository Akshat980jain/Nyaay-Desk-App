import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

const VideoRecorder = ({ caseNum, token }) => {
  const [isRecording, setIsRecording]     = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoBlob, setVideoBlob]         = useState(null);
  const [previewUrl, setPreviewUrl]       = useState('');
  const [status, setStatus]               = useState('idle'); // idle | recording | preview | uploading | success | error
  const [title, setTitle]                 = useState('');
  const [description, setDescription]     = useState('');
  const [errorMessage, setErrorMessage]   = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const videoRef        = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef       = useRef(null);
  const timerRef        = useRef(null);
  const chunksRef       = useRef([]); // Reliable ref for chunks

  // ── Recording ──────────────────────────────────────────────────────────────

  const startRecording = async () => {
    try {
      setStatus('recording');
      setRecordedChunks([]);
      chunksRef.current = [];
      setRecordingTime(0);
      setErrorMessage('');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: true,
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;

      // Pick the best supported codec
      const mimeType = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4',
      ].find((t) => MediaRecorder.isTypeSupported(t)) || '';

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Build the blob from whatever we collected
        const blob = new Blob(chunksRef.current, {
          type: mimeType || 'video/webm',
        });
        setVideoBlob(blob);
        setRecordedChunks(chunksRef.current);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setStatus('preview');
      };

      mediaRecorder.start(500); // Collect data every 500 ms
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing media devices:', err);
      setStatus('error');
      setErrorMessage('Cannot access camera and microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      videoRef.current.srcObject = null;
      // status → 'preview' is set inside onstop
    }
  };

  // ── Upload to Supabase Storage ─────────────────────────────────────────────

  const handleUpload = async () => {
    if (!videoBlob) {
      setStatus('error');
      setErrorMessage('No video recorded. Please record a video first.');
      return;
    }
    if (!title.trim()) {
      setStatus('error');
      setErrorMessage('Title is required.');
      return;
    }

    try {
      setStatus('uploading');
      setUploadProgress(0);

      // ── 1. Get the current Supabase session ──────────────────────────────
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Session expired. Please log in again.');
      }

      // ── 2. Build the file path inside the bucket ─────────────────────────
      const ext        = videoBlob.type.includes('mp4') ? 'mp4' : 'webm';
      const timestamp  = Date.now();
      const filePath   = `${caseNum}/${timestamp}-video-pleading.${ext}`;
      const bucketName = 'video-pleadings';

      // ── 3. Upload the video blob to Supabase Storage ──────────────────────
      // Supabase JS v2 storage upload (no native progress yet — simulate it)
      setUploadProgress(10);

      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from(bucketName)
        .upload(filePath, videoBlob, {
          contentType: videoBlob.type || 'video/webm',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      setUploadProgress(70);

      // ── 4. Get the public URL ──────────────────────────────────────────────
      const { data: { publicUrl } } = supabase
        .storage
        .from(bucketName)
        .getPublicUrl(filePath);

      setUploadProgress(80);

      // ── 5. Build a document record matching the existing schema ───────────
      const documentId = `VPLEAD-${timestamp}`;
      const newDocument = {
        document_id:        documentId,
        document_type:      'video-pleading',
        title:              title.trim(),
        description:        description.trim(),
        file_name:          `video-pleading.${ext}`,
        file_path:          publicUrl,       // Public Supabase Storage URL
        storage_path:       filePath,        // Bucket path for future deletion
        bucket:             bucketName,
        mime_type:          videoBlob.type || 'video/webm',
        size:               videoBlob.size,
        uploaded_date:      new Date().toISOString(),
        upload_date:        new Date().toISOString(), // Alias for dashboard compatibility
        uploaded_by_name:   session.user.user_metadata?.name || 'Litigant',
        verification_status: 'uploaded_pending_review',
      };

      // ── 6. Fetch the current documents array from legal_cases ─────────────
      const { data: caseRow, error: fetchError } = await supabase
        .from('legal_cases')
        .select('documents')
        .eq('case_num', caseNum)
        .single();

      if (fetchError) throw fetchError;

      const existingDocs  = Array.isArray(caseRow.documents) ? caseRow.documents : [];
      const updatedDocs   = [...existingDocs, newDocument];

      // ── 7. Write the updated documents back ───────────────────────────────
      const { error: updateError } = await supabase
        .from('legal_cases')
        .update({ documents: updatedDocs })
        .eq('case_num', caseNum);

      if (updateError) throw updateError;
      console.log(`Video pleading successfully linked to case ${caseNum}`);

      setUploadProgress(100);
      setStatus('success');
      
      // Dispatch a global event to notify the dashboard to refresh its data
      window.dispatchEvent(new CustomEvent('caseDataUpdated', { detail: { caseNum } }));

      setTimeout(() => resetComponent(), 5000);

    } catch (err) {
      console.error('Error uploading video:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Failed to upload video. Please try again.');
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  const resetComponent = () => {
    setRecordedChunks([]);
    chunksRef.current = [];
    setVideoBlob(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    setTitle('');
    setDescription('');
    setStatus('idle');
    setErrorMessage('');
    setRecordingTime(0);
    setUploadProgress(0);
  };

  const cancelRecording = () => {
    if (isRecording) stopRecording();
    resetComponent();
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => {
    return () => {
      if (streamRef.current)  streamRef.current.getTracks().forEach((t) => t.stop());
      if (timerRef.current)   clearInterval(timerRef.current);
      if (previewUrl)         URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif', width: '100%', maxWidth: '600px',
      padding: '20px', margin: '0 auto', border: '1px solid #e0e0e0',
      borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', backgroundColor: '#f9f9f9'
    }}>
      <h2 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '20px' }}>
        Video Pleading Recorder
      </h2>

      {/* ── Video area ── */}
      <div style={{
        width: '100%', height: '320px', backgroundColor: '#000',
        borderRadius: '8px', overflow: 'hidden', position: 'relative', marginBottom: '20px'
      }}>
        {/* Live camera feed */}
        <video
          ref={videoRef}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            display: status === 'preview' ? 'none' : 'block'
          }}
          autoPlay muted
        />

        {/* Preview of recorded video */}
        {status === 'preview' && previewUrl && (
          <video src={previewUrl}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            controls autoPlay
          />
        )}

        {/* Recording timer badge */}
        {status === 'recording' && (
          <div style={{
            position: 'absolute', top: '10px', right: '10px',
            backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff',
            padding: '5px 10px', borderRadius: '4px', display: 'flex', alignItems: 'center'
          }}>
            <span style={{
              display: 'inline-block', width: '12px', height: '12px',
              backgroundColor: '#f00', borderRadius: '50%', marginRight: '8px'
            }} />
            {formatTime(recordingTime)}
          </div>
        )}

        {/* Uploading overlay */}
        {status === 'uploading' && (
          <div style={{
            position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: '12px'
          }}>
            <div style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>
              Uploading… {uploadProgress}%
            </div>
            <div style={{
              width: '70%', height: '8px', backgroundColor: '#555', borderRadius: '4px', overflow: 'hidden'
            }}>
              <div style={{
                height: '100%', width: `${uploadProgress}%`,
                backgroundColor: '#3498db', transition: 'width 0.4s ease'
              }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Controls ── */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '20px' }}>
        {status === 'idle' && (
          <button onClick={startRecording} style={btnStyle('#3498db')}>Start Recording</button>
        )}

        {status === 'recording' && (
          <>
            <button onClick={stopRecording}    style={btnStyle('#e74c3c')}>Stop Recording</button>
            <button onClick={cancelRecording}  style={btnStyle('#7f8c8d')}>Cancel</button>
          </>
        )}

        {status === 'preview' && (
          <>
            <button onClick={startRecording}  style={btnStyle('#3498db')}>Record Again</button>
            <button onClick={cancelRecording} style={btnStyle('#7f8c8d')}>Cancel</button>
          </>
        )}
      </div>

      {/* ── Title / Description (shown in preview) ── */}
      {status === 'preview' && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="vp-title" style={labelStyle}>Title *</label>
            <input
              id="vp-title" type="text" value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for your video pleading"
              style={inputStyle}
              required
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="vp-desc" style={labelStyle}>Description (optional)</label>
            <textarea
              id="vp-desc" value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a brief description"
              style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
            />
          </div>

          {videoBlob && (
            <p style={{ textAlign: 'center', color: '#7f8c8d', fontSize: '14px', marginBottom: '12px' }}>
              Video size: {(videoBlob.size / (1024 * 1024)).toFixed(2)} MB
              {videoBlob.size > 50 * 1024 * 1024 && (
                <span style={{ color: '#e74c3c', display: 'block' }}>
                  ⚠ File exceeds 50 MB limit!
                </span>
              )}
            </p>
          )}

          <button
            onClick={handleUpload}
            disabled={!title.trim() || (videoBlob && videoBlob.size > 50 * 1024 * 1024)}
            style={{
              ...btnStyle('#27ae60'), width: '100%',
              opacity: (!title.trim() || (videoBlob && videoBlob.size > 50 * 1024 * 1024)) ? 0.5 : 1,
              cursor: (!title.trim()) ? 'not-allowed' : 'pointer',
            }}
          >
            Upload Video Pleading
          </button>
        </div>
      )}

      {/* ── Success ── */}
      {status === 'success' && (
        <div style={{
          marginTop: '20px', padding: '15px', backgroundColor: '#d4edda',
          color: '#155724', borderRadius: '4px', textAlign: 'center'
        }}>
          ✅ Video pleading uploaded successfully!
        </div>
      )}

      {/* ── Error ── */}
      {status === 'error' && errorMessage && (
        <div style={{
          marginTop: '20px', padding: '15px', backgroundColor: '#f8d7da',
          color: '#721c24', borderRadius: '4px', textAlign: 'center'
        }}>
          <p style={{ margin: 0 }}>{errorMessage}</p>
          <button
            onClick={() => setStatus('idle')}
            style={{
              marginTop: '10px', padding: '5px 12px', backgroundColor: 'transparent',
              color: '#721c24', border: '1px solid #721c24', borderRadius: '4px',
              cursor: 'pointer', fontSize: '14px'
            }}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

// ── Style helpers ────────────────────────────────────────────────────────────
const btnStyle = (bg) => ({
  padding: '10px 20px', backgroundColor: bg, color: 'white',
  border: 'none', borderRadius: '4px', cursor: 'pointer',
  fontWeight: 'bold', fontSize: '16px'
});

const labelStyle = {
  display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#2c3e50'
};

const inputStyle = {
  width: '100%', padding: '10px', borderRadius: '4px',
  border: '1px solid #ddd', fontSize: '16px', boxSizing: 'border-box'
};

export default VideoRecorder;
