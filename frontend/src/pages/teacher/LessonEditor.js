import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Button, 
  TextField, 
  Grid, 
  CircularProgress, 
  Alert, 
  Tabs, 
  Tab,
  Divider
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Save } from '@mui/icons-material';
import CodingExerciseEditor from './lesson-components/CodingExerciseEditor';
import MultipleChoiceEditor from './lesson-components/MultipleChoiceEditor';
import FillInBlankEditor from './lesson-components/FillInBlankEditor';

const LessonEditor = () => {
  const { lessonId, unitId } = useParams();
  const navigate = useNavigate();
  const isNewLesson = !lessonId;
  
  // Basic lesson data
  const [lessonData, setLessonData] = useState({
    title: '',
    description: '',
    unit_id: unitId || '',
    order: 1,
    content_type: 'coding' // Default to coding exercise
  });
  
  // Content data based on type
  const [contentData, setContentData] = useState({
    coding: {
      instructions: '',
      starter_code: '',
      solution_code: '',
      test_code: ''
    },
    multiple_choice: {
      question: '',
      options: ['', '', '', ''],
      correct_option: 0
    },
    fill_in_blank: {
      text: '',
      blanks: []
    }
  });
  
  const [loading, setLoading] = useState(!isNewLesson);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (!isNewLesson) {
      fetchLessonData();
    }
  }, [lessonId]);

  const fetchLessonData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/lessons/${lessonId}`);
      
      // Set basic lesson data
      const lesson = response.data.lesson;
      setLessonData({
        title: lesson.title,
        description: lesson.description,
        unit_id: lesson.unit_id,
        order: lesson.order,
        content_type: lesson.content_type
      });
      
      // Set content data based on type
      if (lesson.content) {
        if (lesson.content_type === 'coding') {
          setContentData({
            ...contentData,
            coding: {
              instructions: lesson.content.instructions || '',
              starter_code: lesson.content.starter_code || '',
              solution_code: lesson.content.solution_code || '',
              test_code: lesson.content.test_code || ''
            }
          });
        } else if (lesson.content_type === 'multiple_choice') {
          setContentData({
            ...contentData,
            multiple_choice: {
              question: lesson.content.question || '',
              options: lesson.content.options || ['', '', '', ''],
              correct_option: lesson.content.correct_option || 0
            }
          });
        } else if (lesson.content_type === 'fill_in_blank') {
          setContentData({
            ...contentData,
            fill_in_blank: {
              text: lesson.content.text || '',
              blanks: lesson.content.blanks || []
            }
          });
        }
      }
      
    } catch (err) {
      setError('Failed to load lesson data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLessonDataChange = (e) => {
    const { name, value } = e.target;
    setLessonData({
      ...lessonData,
      [name]: value
    });
  };

  const handleContentTypeChange = (e, newValue) => {
    setActiveTab(newValue);
    
    const contentTypes = ['coding', 'multiple_choice', 'fill_in_blank'];
    setLessonData({
      ...lessonData,
      content_type: contentTypes[newValue]
    });
  };

  const handleContentChange = (type, data) => {
    setContentData({
      ...contentData,
      [type]: data
    });
  };

  const handleSave = async () => {
    if (!lessonData.title) {
      setError('Lesson title is required');
      return;
    }
    
    if (!lessonData.unit_id && !unitId) {
      setError('Unit ID is required');
      return;
    }
    
    try {
      setSaving(true);
      setError('');
      
      // Prepare data for API
      const saveData = {
        ...lessonData,
        unit_id: lessonData.unit_id || unitId,
        content: contentData[lessonData.content_type]
      };
      
      let response;
      if (isNewLesson) {
        response = await axios.post('/api/lessons', saveData);
        navigate(`/teacher/lessons/${response.data.lesson.id}`);
      } else {
        response = await axios.put(`/api/lessons/${lessonId}`, saveData);
      }
      
      setSuccess('Lesson saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError('Failed to save lesson');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">
          {isNewLesson ? 'Create New Lesson' : 'Edit Lesson'}
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<Save />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Lesson'}
        </Button>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Lesson Details
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="Lesson Title"
              name="title"
              value={lessonData.title}
              onChange={handleLessonDataChange}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Lesson Description"
              name="description"
              value={lessonData.description}
              onChange={handleLessonDataChange}
              variant="outlined"
              multiline
              rows={3}
            />
          </Grid>
        </Grid>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Lesson Content
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Tabs 
          value={activeTab} 
          onChange={handleContentTypeChange} 
          variant="fullWidth" 
          sx={{ mb: 3 }}
        >
          <Tab label="Coding Exercise" />
          <Tab label="Multiple Choice" />
          <Tab label="Fill in the Blank" />
        </Tabs>
        
        {activeTab === 0 && (
          <CodingExerciseEditor 
            data={contentData.coding} 
            onChange={(data) => handleContentChange('coding', data)} 
          />
        )}
        
        {activeTab === 1 && (
          <MultipleChoiceEditor 
            data={contentData.multiple_choice} 
            onChange={(data) => handleContentChange('multiple_choice', data)} 
          />
        )}
        
        {activeTab === 2 && (
          <FillInBlankEditor 
            data={contentData.fill_in_blank} 
            onChange={(data) => handleContentChange('fill_in_blank', data)} 
          />
        )}
      </Paper>
    </Container>
  );
};

export default LessonEditor;
