import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  CircularProgress, 
  Alert,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  Divider,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  TextField,
  Snackbar
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { ArrowBack, ArrowForward, Check, Code, QuestionAnswer, TextFields } from '@mui/icons-material';

const LessonView = () => {
  const [lesson, setLesson] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Coding exercise state
  const [code, setCode] = useState('');
  const [codeOutput, setCodeOutput] = useState('');
  const [codeRunning, setCodeRunning] = useState(false);
  const [response, setResponse] = useState(null);
  
  // Multiple choice state
  const [selectedOptions, setSelectedOptions] = useState({});
  
  // Fill-in-the-blank state
  const [blanks, setBlanks] = useState([]);
  const [filledBlanks, setFilledBlanks] = useState([]);
  
  const { lessonId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLessonData = async () => {
      try {
        setLoading(true);
        
        // Fetch lesson details including all content types
        const lessonResponse = await axios.get(`/api/lessons/${lessonId}`);
        const lessonData = lessonResponse.data.lesson;
        
        // 适配后端的数据结构
        // 后端返回的是content和content_type字段，而不是前端期望的数组结构
        const adaptedLesson = {
          ...lessonData,
          coding_exercises: [],
          multiple_choice_questions: [],
          fill_blank_exercises: []
        };
        
        // 根据content_type来填充相应的数组
        if (lessonData.content_type === 'coding') {
          adaptedLesson.coding_exercises = [{
            instructions: lessonData.content.instructions || '',
            starter_code: lessonData.content.starter_code || '',
            solution_code: lessonData.content.solution_code || '',
            test_code: lessonData.content.test_code || ''
          }];
          // 初始化编码器内容
          setCode(lessonData.content.starter_code || '# Write your code here\n');
        } 
        else if (lessonData.content_type === 'multiple_choice') {
          adaptedLesson.multiple_choice_questions = [{
            question_text: lessonData.content.question || '',
            options: lessonData.content.options || [],
            correct_option_index: lessonData.content.correct_option || 0
          }];
        } 
        else if (lessonData.content_type === 'fill_in_blank') {
          adaptedLesson.fill_blank_exercises = [{
            text_template: lessonData.content.text || '',
            blanks: JSON.stringify(lessonData.content.blanks || [])
          }];
          
          // 初始化填空题内容
          const blanksList = lessonData.content.blanks || [];
          setBlanks(blanksList);
          setFilledBlanks(Array(blanksList.length).fill(null));
        }
        
        setLesson(adaptedLesson);
      } catch (err) {
        setError('Failed to load lesson data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLessonData();
  }, [lessonId]);

  const handleCodeChange = React.useCallback((value) => {
    setCode(value);
  }, []);

  // 僅執行代碼，不提交評分
  const executeCode = async () => {
    if (!(lesson.content_type === 'coding' || (lesson.coding_exercises && lesson.coding_exercises.length > 0))) return;
    
    try {
      setCodeRunning(true);
      setCodeOutput('正在執行程式碼...');
      // 使用獨立的執行API
      const response = await axios.post(`/api/code/run`, {
        code: code
      });
      
      setCodeOutput(response.data.output || (response.data.error ? `錯誤: ${response.data.error}` : 'No output'));
      // 清除測試結果
      setResponse(null);
    } catch (error) {
      console.error('Error executing code:', error);
      setCodeOutput(error.response?.data?.error || error.message || '執行代碼時發生錯誤');
    } finally {
      setCodeRunning(false);
    }
  };

  // 提交代碼並評分
  const runCode = async () => {
    if (!(lesson.content_type === 'coding' || (lesson.coding_exercises && lesson.coding_exercises.length > 0))) return;
    
    try {
      setCodeRunning(true);
      setCodeOutput('正在執行並評分程式碼...');
      // 使用新的 code_runner API
      const response = await axios.post(`/api/code/submit/${lessonId}`, {
        code: code
      });
      
      setCodeOutput(response.data.output || 'No output');
      setResponse(response.data);
      
      // 顯示評分結果
      if (response.data.passed) {
        setSnackbar({
          open: true,
          message: `Success! You scored ${response.data.score}%`,
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Your code did not pass all tests. Try again!',
          severity: 'warning'
        });
      }
    } catch (error) {
      console.error('Error running code:', error);
      setCodeOutput(error.response?.data?.error || error.message || '提交代碼時發生錯誤');
      setSnackbar({
        open: true,
        message: '執行代碼出錯',
        severity: 'error'
      });
    } finally {
      setCodeRunning(false);
    }
  };

  const handleOptionChange = (questionId, optionIndex) => {
    setSelectedOptions({
      ...selectedOptions,
      [questionId]: optionIndex
    });
  };

  const submitMultipleChoice = async () => {
    if (!((lesson.content_type === 'multiple_choice' && lesson.content) || (lesson.multiple_choice_questions && lesson.multiple_choice_questions.length > 0))) return;
    
    try {
      // 根據content_type調整submissions格式
      let submissions;
      
      if (lesson.content_type === 'multiple_choice') {
        // 使用content數據結構
        submissions = { answers: selectedOptions };
      } else {
        // 使用數組數據結構
        submissions = Object.entries(selectedOptions).map(([questionId, optionIndex]) => ({
          question_id: parseInt(questionId),
          selected_option_index: optionIndex
        }));
      }
      
      const response = await axios.post(`/api/progress/multiple-choice/${lessonId}`, {
        answers: selectedOptions
      });
      
      setSnackbar({
        open: true,
        message: `Submitted! You scored ${response.data.score}%`,
        severity: response.data.score >= 70 ? 'success' : 'warning'
      });
      
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Error submitting answers',
        severity: 'error'
      });
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destIndex = result.destination.droppableId.split('-')[1];
    
    const newFilledBlanks = [...filledBlanks];
    newFilledBlanks[destIndex] = blanks[destIndex].options[sourceIndex];
    
    setFilledBlanks(newFilledBlanks);
  };

  const submitFillBlanks = async () => {
    // 检查lesson.content_type为fill_in_blank或存在fill_blank_exercises
    if (!(lesson.content_type === 'fill_in_blank' || (lesson.fill_blank_exercises && lesson.fill_blank_exercises.length > 0))) return;
    
    try {
      // 使用lesson.id而不是exercise.id
      
      const response = await axios.post(`/api/progress/fill-blank/${lessonId}`, {
        answers: filledBlanks
      });
      
      setSnackbar({
        open: true,
        message: `Submitted! You scored ${response.data.score}%`,
        severity: response.data.score >= 70 ? 'success' : 'warning'
      });
      
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Error submitting answers',
        severity: 'error'
      });
    }
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!lesson) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">Lesson not found or you don't have access to this lesson.</Alert>
      </Container>
    );
  }

  const steps = [
    { label: 'Coding Exercise', icon: <Code /> },
    { label: 'Multiple Choice', icon: <QuestionAnswer /> },
    { label: 'Fill in the Blanks', icon: <TextFields /> }
  ];

  // Render the text with blanks for the fill-in-the-blank exercise
  const renderTextWithBlanks = () => {
    if (!lesson.fill_blank_exercises || lesson.fill_blank_exercises.length === 0) {
      return <Typography>No fill-in-the-blank exercise available.</Typography>;
    }
    
    const exercise = lesson.fill_blank_exercises[0];
    let textParts = exercise.text_template.split(/{{(\d+)}}/);
    
    return (
      <Box>
        {textParts.map((part, index) => {
          if (index % 2 === 0) {
            // Regular text
            return <Typography component="span" key={index}>{part}</Typography>;
          } else {
            // Blank to fill
            const blankIndex = parseInt(part);
            return (
              <Droppable droppableId={`blank-${blankIndex}`} key={index}>
                {(provided, snapshot) => (
                  <Box
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    component="span"
                    sx={{
                      display: 'inline-block',
                      minWidth: '120px',
                      minHeight: '30px',
                      border: '2px dashed',
                      borderColor: snapshot.isDraggingOver ? 'primary.main' : 'grey.400',
                      borderRadius: '4px',
                      padding: '0 8px',
                      margin: '0 4px',
                      backgroundColor: snapshot.isDraggingOver ? 'rgba(63, 81, 181, 0.1)' : 'transparent',
                    }}
                  >
                    {filledBlanks[blankIndex] || ''}
                    {provided.placeholder}
                  </Box>
                )}
              </Droppable>
            );
          }
        })}
      </Box>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {lesson.title}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {lesson.description}
        </Typography>
      </Paper>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      <Box sx={{ width: '100%' }}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel StepIconComponent={() => step.icon}>{step.label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Box sx={{ mt: 2, mb: 4 }}>
          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Coding Exercise
              </Typography>
              
              {((lesson.content_type === 'coding' && lesson.content) || (lesson.coding_exercises && lesson.coding_exercises.length > 0)) ? (
                <>
                  <Card variant="outlined" sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="body1" gutterBottom>
                        <strong>Instructions:</strong>
                      </Typography>
                      <Typography variant="body2">
                        {lesson.content_type === 'coding' ? lesson.content.instructions : lesson.coding_exercises[0].instructions}
                      </Typography>
                    </CardContent>
                  </Card>
                  
                  <Typography variant="subtitle1" gutterBottom>
                    Your Code:
                  </Typography>
                  <Box className="code-editor" sx={{ mb: 2 }}>
                    <CodeMirror
                      value={code}
                      height="300px"
                      extensions={[python()]}
                      onChange={handleCodeChange}
                    />
                  </Box>
                  
                  <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={executeCode}
                      disabled={codeRunning || code.trim().length === 0}
                      startIcon={<PlayArrowIcon />}
                    >
                      {codeRunning ? '執行中...' : '執行代碼'}
                    </Button>
                    
                    <Button 
                      variant="contained" 
                      color="primary" 
                      onClick={runCode}
                      disabled={codeRunning || code.trim().length === 0}
                      startIcon={<PlayArrowIcon />}
                    >
                      {codeRunning ? '評分中...' : '提交與評分'}
                    </Button>
                  </Box>
                  
                  {codeOutput && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        執行結果：
                      </Typography>
                      <Paper 
                        variant="outlined" 
                        sx={{ 
                          p: 2, 
                          backgroundColor: '#f5f5f5',
                          fontFamily: 'monospace',
                          whiteSpace: 'pre-wrap'
                        }}
                      >
                        {codeOutput}
                      </Paper>
                      
                      {/* 測試結果區域 */}
                      {response && response.test_results && (
                        <Box sx={{ mt: 3 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            測試結果：
                          </Typography>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2">
                              分數：<strong>{response.score || 0}</strong>/{response.max_score || 100}
                            </Typography>
                          </Box>
                          {response.test_results.map((test, index) => (
                            <Paper
                              key={index}
                              variant="outlined"
                              sx={{
                                p: 1.5,
                                mb: 1,
                                borderLeft: test.passed ? '4px solid #4caf50' : '4px solid #f44336',
                                backgroundColor: test.passed ? '#e8f5e9' : '#ffebee'
                              }}
                            >
                              <Typography variant="body2">
                                <strong>測試 {test.test_case}：</strong> {test.message}
                              </Typography>
                            </Paper>
                          ))}
                        </Box>
                      )}
                    </Box>
                  )}
                </>
              ) : (
                <Alert severity="info">No coding exercise available for this lesson.</Alert>
              )}
            </Box>
          )}
          
          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Multiple Choice
              </Typography>
              
              {((lesson.content_type === 'multiple_choice' && lesson.content) || (lesson.multiple_choice_questions && lesson.multiple_choice_questions.length > 0)) ? (
                <>
                  {lesson.content_type === 'multiple_choice' ? (
                    // 使用content数据结构渲染
                    <Card variant="outlined" sx={{ mb: 3 }}>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          Question: {lesson.content.question}
                        </Typography>
                        
                        <FormControl component="fieldset" sx={{ width: '100%', mt: 2 }}>
                          <RadioGroup
                            value={selectedOptions['content_mcq'] !== undefined ? selectedOptions['content_mcq'] : ''}
                            onChange={(e) => handleOptionChange('content_mcq', parseInt(e.target.value))}
                          >
                            {lesson.content.options.map((option, index) => (
                              <FormControlLabel
                                key={index}
                                value={index.toString()}
                                control={<Radio />}
                                label={option}
                              />
                            ))}
                          </RadioGroup>
                        </FormControl>
                      </CardContent>
                    </Card>
                  ) : (
                    // 使用数组数据结构渲染
                    lesson.multiple_choice_questions.map((question, qIndex) => {
                      const options = Array.isArray(question.options) ? question.options : JSON.parse(question.options);
                      
                      return (
                        <Card key={question.id || qIndex} variant="outlined" sx={{ mb: 3 }}>
                          <CardContent>
                            <Typography variant="subtitle1" gutterBottom>
                              Question {qIndex + 1}: {question.question_text}
                            </Typography>
                            
                            <FormControl component="fieldset" sx={{ width: '100%', mt: 2 }}>
                              <RadioGroup
                                value={selectedOptions[question.id] !== undefined ? selectedOptions[question.id] : ''}
                                onChange={(e) => handleOptionChange(question.id, parseInt(e.target.value))}
                              >
                                {options.map((option, index) => (
                                  <FormControlLabel
                                    key={index}
                                    value={index.toString()}
                                    control={<Radio />}
                                    label={option}
                                  />
                                ))}
                              </RadioGroup>
                            </FormControl>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                  
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={submitMultipleChoice}
                    sx={{ mt: 2 }}
                  >
                    Submit Answers
                  </Button>
                </>
              ) : (
                <Alert severity="info">No multiple choice questions available for this lesson.</Alert>
              )}
            </Box>
          )}
          
          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Fill in the Blanks
              </Typography>
              
              {((lesson.content_type === 'fill_in_blank' && lesson.content) || (lesson.fill_blank_exercises && lesson.fill_blank_exercises.length > 0)) ? (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Card variant="outlined" sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="body1" gutterBottom>
                        <strong>Instructions:</strong> Fill in the blanks in the text below.
                      </Typography>
                      
                      <Box sx={{ mt: 3, p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                        {lesson.content_type === 'fill_in_blank' ? 
                          // 使用content数据结构渲染填空题
                          lesson.content.text || 'No content available' : 
                          renderTextWithBlanks()
                        }
                      </Box>
                    </CardContent>
                  </Card>
                  
                  <Typography variant="subtitle1" gutterBottom>
                    Available Options:
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                    {lesson.content_type === 'fill_in_blank' ? 
                      // 使用content数据结构渲染选项
                      lesson.content.blanks && lesson.content.blanks.map((blank, blankIndex) => (
                        <Box key={blankIndex} sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            填空 {blankIndex + 1}: {blank}
                          </Typography>
                          <TextField 
                            variant="outlined" 
                            size="small" 
                            fullWidth 
                            value={filledBlanks[blankIndex] || ''}
                            onChange={(e) => {
                              const newFilledBlanks = [...filledBlanks];
                              newFilledBlanks[blankIndex] = e.target.value;
                              setFilledBlanks(newFilledBlanks);
                            }}
                          />
                        </Box>
                      ))
                    : blanks.map((blank, blankIndex) => (
                      <Box key={blankIndex} sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          Options for blank {blankIndex + 1}:
                        </Typography>
                        {blank.options && blank.options.map((option, optionIndex) => (
                          <Draggable
                            key={`${blankIndex}-${optionIndex}`}
                            draggableId={`option-${blankIndex}-${optionIndex}`}
                            index={optionIndex}
                          >
                            {(provided) => (
                              <Box
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="drag-item"
                                sx={{ display: 'inline-block', mr: 1, mb: 1 }}
                              >
                                {option}
                              </Box>
                            )}
                          </Draggable>
                        ))}
                      </Box>
                    ))}
                  </Box>
                  
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={submitFillBlanks}
                    sx={{ mt: 2 }}
                  >
                    Submit Answers
                  </Button>
                </DragDropContext>
              ) : (
                <Alert severity="info">No fill-in-the-blank exercise available for this lesson.</Alert>
              )}
            </Box>
          )}
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            color="inherit"
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<ArrowBack />}
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={activeStep === steps.length - 1 ? () => navigate(-1) : handleNext}
            endIcon={activeStep === steps.length - 1 ? <Check /> : <ArrowForward />}
          >
            {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
          </Button>
        </Box>
      </Box>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Container>
  );
};

export default LessonView;