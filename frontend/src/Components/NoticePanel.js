import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { format } from 'date-fns';
import NoticeForm from './NoticeForm';
import NoticeList from './NoticeList';
import '../ComponentsCSS/NoticePanel.css';

const NoticePanel = () => {
  const [notices, setNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);

  const fetchNotices = async () => {
    setIsLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false });
      if (err) throw err;
      setNotices(data || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch notices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleAddNew = () => {
    setSelectedNotice(null);
    setShowForm(true);
  };

  const handleEdit = (notice) => {
    setSelectedNotice(notice);
    setShowForm(true);
  };

  const handleDelete = async (noticeId) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    try {
      const { error: err } = await supabase
        .from('notices')
        .delete()
        .eq('notice_id', noticeId);
      if (err) throw err;
      fetchNotices();
    } catch (err) {
      setError(err.message || 'Failed to delete notice');
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      // formData may contain File objects — store text fields only in DB
      const payload = {
        title: formData.get ? formData.get('title') : formData.title,
        content: formData.get ? formData.get('content') : formData.content,
        notice_type: formData.get ? formData.get('notice_type') : formData.notice_type,
        updated_at: new Date().toISOString(),
      };

      if (selectedNotice) {
        const { error: err } = await supabase
          .from('notices')
          .update(payload)
          .eq('notice_id', selectedNotice.notice_id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from('notices')
          .insert([{ ...payload, created_at: new Date().toISOString() }]);
        if (err) throw err;
      }

      setShowForm(false);
      fetchNotices();
    } catch (err) {
      setError(err.message || 'Failed to save notice');
    }
  };

  return (
    <div className="np-container">
      <div className="np-header">
        <h1 className="np-title">Notice Panel</h1>
        <button onClick={handleAddNew} className="np-add-button">
          Add New Notice
        </button>
      </div>

      {error && <div className="np-error">{error}</div>}

      {showForm ? (
        <NoticeForm
          notice={selectedNotice}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <NoticeList
          notices={notices}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default NoticePanel;