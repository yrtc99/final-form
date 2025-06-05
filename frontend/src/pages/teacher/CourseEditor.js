import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  CircularProgress, 
  Alert,
  Paper,
  Button,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Card,
  CardContent,
  CardActions,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Add, 
  Edit, 
  Delete, 
  Save,
  ArrowUpward,
  ArrowDownward,
  ExpandMore
} from '@mui/icons-material';

const CourseEditor = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const isNewCourse = courseId === undefined;
  
  const [course, setCourse] = useState({
    title: '',
    description: ''
  });
  
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(!isNewCourse);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Unit dialog states
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [currentUnit, setCurrentUnit] = useState({ title: '', description: '', order: 0 });
  const [isEditingUnit, setIsEditingUnit] = useState(false);
  
  // Delete dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState(''); // 'unit' or 'lesson'

  useEffect(() => {
    if (!isNewCourse) {
      fetchCourseData();
    }
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/courses/${courseId}`);
      setCourse({
        title: response.data.course.title,
        description: response.data.course.description
      });
      
      // Sort units by order
      const sortedUnits = response.data.course.units.sort((a, b) => a.order - b.order);
      setUnits(sortedUnits);
    } catch (err) {
      setError('載入課程資料失敗');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseChange = (e) => {
    const { name, value } = e.target;
    setCourse({
      ...course,
      [name]: value
    });
  };

  const handleSaveCourse = async () => {
    if (!course.title) {
      setError('課程標題為必填項');
      return;
    }
    
    try {
      setSaving(true);
      setError('');
      
      let response;
      if (isNewCourse) {
        response = await axios.post('/api/courses', course);
        navigate(`/teacher/courses/${response.data.course.id}`);
      } else {
        response = await axios.put(`/api/courses/${courseId}`, course);
      }
      
      setSuccess('課程儲存成功！');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError('儲存課程失敗');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Unit Dialog Functions
  const openUnitDialog = (unit = null) => {
    if (unit) {
      setCurrentUnit(unit);
      setIsEditingUnit(true);
    } else {
      setCurrentUnit({ 
        title: '', 
        description: '', 
        order: units.length > 0 ? Math.max(...units.map(u => u.order)) + 1 : 1 
      });
      setIsEditingUnit(false);
    }
    setUnitDialogOpen(true);
  };

  const handleUnitChange = (e) => {
    const { name, value } = e.target;
    setCurrentUnit({
      ...currentUnit,
      [name]: value
    });
  };

  const handleSaveUnit = async () => {
    if (!currentUnit.title) {
      setError('單元標題為必填項');
      return;
    }
    
    try {
      let response;
      if (isEditingUnit) {
        response = await axios.put(`/api/units/${currentUnit.id}`, currentUnit);
        setUnits(units.map(unit => unit.id === currentUnit.id ? response.data.unit : unit));
      } else {
        response = await axios.post(`/api/courses/${courseId}/units`, currentUnit);
        setUnits([...units, response.data.unit]);
      }
      
      setUnitDialogOpen(false);
      setSuccess('單元儲存成功！');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError('儲存單元失敗');
      console.error(err);
    }
  };

  // Delete Dialog Functions
  const openDeleteDialog = (item, type) => {
    setItemToDelete(item);
    setDeleteType(type);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    
    try {
      if (deleteType === 'unit') {
        await axios.delete(`/api/units/${itemToDelete.id}`);
        setUnits(units.filter(unit => unit.id !== itemToDelete.id));
      } else if (deleteType === 'lesson') {
        await axios.delete(`/api/lessons/${itemToDelete.id}`);
        // Update the units state to reflect the deleted lesson
        setUnits(units.map(unit => {
          if (unit.id === itemToDelete.unit_id) {
            return {
              ...unit,
              lessons: unit.lessons.filter(lesson => lesson.id !== itemToDelete.id)
            };
          }
          return unit;
        }));
      }
      
      setDeleteDialogOpen(false);
      setSuccess(`${deleteType.charAt(0).toUpperCase() + deleteType.slice(1)} deleted successfully!`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError(`Failed to delete ${deleteType}`);
      console.error(err);
    }
  };

  // Unit reordering functions
  const moveUnit = async (unitId, direction) => {
    const unitIndex = units.findIndex(u => u.id === unitId);
    if (
      (direction === 'up' && unitIndex === 0) || 
      (direction === 'down' && unitIndex === units.length - 1)
    ) {
      return;
    }
    
    const newUnits = [...units];
    const targetIndex = direction === 'up' ? unitIndex - 1 : unitIndex + 1;
    
    // Swap order values
    const tempOrder = newUnits[unitIndex].order;
    newUnits[unitIndex].order = newUnits[targetIndex].order;
    newUnits[targetIndex].order = tempOrder;
    
    // Swap positions in array
    [newUnits[unitIndex], newUnits[targetIndex]] = [newUnits[targetIndex], newUnits[unitIndex]];
    
    try {
      // Update order in database for both units
      await axios.put(`/api/units/${newUnits[unitIndex].id}`, { 
        order: newUnits[unitIndex].order 
      });
      await axios.put(`/api/units/${newUnits[targetIndex].id}`, { 
        order: newUnits[targetIndex].order 
      });
      
      setUnits(newUnits);
    } catch (err) {
      setError('Failed to reorder units');
      console.error(err);
    }
  };

  // Navigate to lesson editor
  const handleCreateLesson = (unitId) => {
    navigate(`/teacher/units/${unitId}/lessons/new`);
  };

  const handleEditLesson = (lessonId) => {
    navigate(`/teacher/lessons/${lessonId}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">
          {isNewCourse ? '創建新課程' : `編輯課程：${course.title || '載入中...'}`}
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleSaveCourse}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
        >
          儲存課程
        </Button>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
          課程詳情
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="課程標題"
              name="title"
              value={course.title}
              onChange={handleCourseChange}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="課程描述"
              name="description"
              value={course.description}
              onChange={handleCourseChange}
              variant="outlined"
              multiline
              rows={4}
            />
          </Grid>
        </Grid>
      </Paper>
      
      {!isNewCourse && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
              單元
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => openUnitDialog()}
            >
              新增單元
            </Button>
          </Box>
          <Divider sx={{ mb: 3 }} />
          
          {units.length === 0 ? (
            <Alert severity="info">
              此課程尚無單元。新增您的第一個單元以開始。
            </Alert>
          ) : (
            <List>
              {units.map((unit, index) => (
                <Card key={unit.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6">
                        {index + 1}. {unit.title}
                      </Typography>
                      <Box>
                        <IconButton 
                          size="small" 
                          disabled={index === 0}
                          onClick={() => moveUnit(unit.id, 'up')}
                        >
                          <ArrowUpward />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          disabled={index === units.length - 1}
                          onClick={() => moveUnit(unit.id, 'down')}
                        >
                          <ArrowDownward />
                        </IconButton>
                        <IconButton 
                          size="small"
                          color="primary" 
                          onClick={() => openUnitDialog(unit)}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton 
                          size="small"
                          color="error" 
                          onClick={() => openDeleteDialog(unit, 'unit')}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {unit.description}
                    </Typography>
                    
                    <Accordion sx={{ mt: 2 }}>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography>
                          課時 ({unit.lessons?.length || 0})
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        {unit.lessons && unit.lessons.length > 0 ? (
                          <List dense>
                            {unit.lessons.sort((a, b) => a.order - b.order).map((lesson, lessonIndex) => (
                              <ListItem key={lesson.id}>
                                <ListItemText 
                                  primary={`${lessonIndex + 1}. ${lesson.title}`} 
                                  secondary={lesson.description}
                                />
                                <ListItemSecondaryAction>
                                  <IconButton 
                                    edge="end" 
                                    aria-label="編輯"
                                    onClick={() => handleEditLesson(lesson.id)}
                                  >
                                    <Edit />
                                  </IconButton>
                                  <IconButton 
                                    edge="end" 
                                    aria-label="刪除"
                                    onClick={() => openDeleteDialog(lesson, 'lesson')}
                                  >
                                    <Delete />
                                  </IconButton>
                                </ListItemSecondaryAction>
                              </ListItem>
                            ))}
                          </List>
                        ) : (
                          <Typography variant="subtitle1" color="text.secondary">
                            此單元尚無課時。
                          </Typography>
                        )}
                        
                        <Button 
                          variant="outlined" 
                          startIcon={<Add />}
                          sx={{ mt: 2 }}
                          onClick={() => handleCreateLesson(unit.id)}
                        >
                          新增課時
                        </Button>
                      </AccordionDetails>
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </List>
          )}
        </Paper>
      )}
      
      {/* Unit Dialog */}
      <Dialog open={unitDialogOpen} onClose={() => setUnitDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditingUnit ? '編輯單元' : '新增單元'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="title"
            label="單元標題"
            type="text"
            fullWidth
            variant="outlined"
            value={currentUnit.title}
            onChange={handleUnitChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="description"
            label="單元描述"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={currentUnit.description}
            onChange={handleUnitChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnitDialogOpen(false)}>取消</Button>
          <Button onClick={handleSaveUnit} variant="contained">儲存</Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>
          {`刪除 ${deleteType === 'unit' ? '單元' : '課時'}？`}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteType === 'unit' 
              ? `您確定要刪除單元「${itemToDelete?.title}」嗎？這將同時刪除此單元中的所有課時。`
              : `您確定要刪除課時「${itemToDelete?.title}」嗎？`
            }
            此操作無法撤銷。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>取消</Button>
          <Button onClick={handleDeleteConfirm} color="error">刪除</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CourseEditor;
