import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  TextField,
  Grid,
  Paper,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';

// Define constant to avoid ESLint errors
const BLANK = "BLANK";

const FillInBlankEditor = ({ data, onChange }) => {
  const [text, setText] = useState(data.text || '');
  const [blanks, setBlanks] = useState(data.blanks || []);
  const [currentBlank, setCurrentBlank] = useState('');
  const [error, setError] = useState('');

  // Sync with parent component
  useEffect(() => {
    onChange({
      text,
      blanks
    });
  }, [text, blanks]);

  const handleTextChange = (e) => {
    setText(e.target.value);
  };

  const addBlank = () => {
    if (!currentBlank.trim()) {
      setError('Blank cannot be empty');
      return;
    }
    
    if (blanks.includes(currentBlank.trim())) {
      setError('This blank already exists');
      return;
    }
    
    setBlanks([...blanks, currentBlank.trim()]);
    setCurrentBlank('');
    setError('');
  };

  const removeBlank = (index) => {
    const newBlanks = [...blanks];
    newBlanks.splice(index, 1);
    setBlanks(newBlanks);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addBlank();
    }
  };

  const insertBlankPlaceholder = () => {
    const placeholder = '{{BLANK}}';
    setText(text + placeholder);
  };

  // Check if text contains the correct number and format of blanks
  const validateText = () => {
    const blankMatches = text.match(/\{\{BLANK\}\}/g);
    if (!blankMatches) {
      return 'No blank placeholders found. Use "Insert Blank" button to add placeholders.';
    }
    
    if (blankMatches.length !== blanks.length) {
      return `Mismatch: ${blankMatches.length} placeholders but ${blanks.length} blank options.`;
    }
    
    return '';
  };

  const validation = validateText();

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom>
          Text with Blanks
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Enter your text and use the "Insert Blank" button to add blank placeholders ({{BLANK}}).
          </Typography>
        </Box>
        <TextField
          fullWidth
          multiline
          rows={4}
          value={text}
          onChange={handleTextChange}
          variant="outlined"
          placeholder="Enter your text here and insert blanks where needed..."
        />
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="outlined" 
            startIcon={<Add />}
            onClick={insertBlankPlaceholder}
          >
            Insert Blank
          </Button>
        </Box>
      </Grid>
      
      <Grid item xs={12}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Blank Options
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Add options that will be presented to students to fill in the blanks.
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', mb: 2 }}>
            <TextField
              fullWidth
              label="New Blank Option"
              value={currentBlank}
              onChange={(e) => setCurrentBlank(e.target.value)}
              onKeyPress={handleKeyPress}
              variant="outlined"
              error={!!error}
              helperText={error}
              size="small"
            />
            <Button 
              variant="contained" 
              onClick={addBlank}
              sx={{ ml: 2, whiteSpace: 'nowrap' }}
            >
              Add Option
            </Button>
          </Box>
          
          {blanks.length > 0 ? (
            <List>
              {blanks.map((blank, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <Divider />}
                  <ListItem
                    secondaryAction={
                      <Button 
                        startIcon={<Delete />}
                        color="error"
                        onClick={() => removeBlank(index)}
                      >
                        Remove
                      </Button>
                    }
                  >
                    <ListItemText 
                      primary={blank} 
                      secondary={`Option ${index + 1}`} 
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
              No blank options added yet
            </Typography>
          )}
        </Paper>
      </Grid>
      
      <Grid item xs={12}>
        {validation && (
          <Alert severity={validation.includes('Mismatch') ? 'warning' : 'info'}>
            {validation}
          </Alert>
        )}
      </Grid>
      
      <Grid item xs={12}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Preview
          </Typography>
          <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="body1">
              {text.split(/(\{\{BLANK\}\})/).map((part, index) => {
                if (part === '{{BLANK}}') {
                  return (
                    <Chip 
                      key={index} 
                      label={BLANK} 
                      color="primary" 
                      variant="outlined" 
                      size="small"
                      sx={{ mx: 0.5 }}
                    />
                  );
                }
                return <span key={index}>{part}</span>;
              })}
            </Typography>
          </Box>
          
          {blanks.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Available Options:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {blanks.map((blank, index) => (
                  <Chip key={index} label={blank} />
                ))}
              </Box>
            </Box>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
};

export default FillInBlankEditor;
