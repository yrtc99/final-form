import React from 'react';
import {
  Typography,
  Box,
  TextField,
  Grid,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  IconButton,
  InputAdornment
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';

const MultipleChoiceEditor = ({ data, onChange }) => {
  const handleChange = (field, value) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...data.options];
    newOptions[index] = value;
    onChange({
      ...data,
      options: newOptions
    });
  };

  const handleCorrectOptionChange = (event) => {
    onChange({
      ...data,
      correct_option: parseInt(event.target.value)
    });
  };

  const addOption = () => {
    onChange({
      ...data,
      options: [...data.options, '']
    });
  };

  const removeOption = (index) => {
    const newOptions = [...data.options];
    newOptions.splice(index, 1);
    
    // Adjust correct option if necessary
    let correctOption = data.correct_option;
    if (index === correctOption) {
      correctOption = 0; // Default to first option
    } else if (index < correctOption) {
      correctOption -= 1; // Shift down if removed option was before correct one
    }
    
    onChange({
      ...data,
      options: newOptions,
      correct_option: correctOption
    });
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          rows={2}
          label="Question"
          value={data.question}
          onChange={(e) => handleChange('question', e.target.value)}
          variant="outlined"
          placeholder="Enter your question here..."
        />
      </Grid>
      
      <Grid item xs={12}>
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Answer Options
          </Typography>
          <FormControl component="fieldset">
            <RadioGroup 
              value={data.correct_option}
              onChange={handleCorrectOptionChange}
            >
              {data.options.map((option, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <FormControlLabel
                    value={index}
                    control={<Radio />}
                    label={`Correct Answer`}
                    sx={{ mr: 2, minWidth: '150px' }}
                  />
                  <TextField
                    fullWidth
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    variant="outlined"
                    placeholder={`Option ${index + 1}`}
                    size="small"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => removeOption(index)}
                            edge="end"
                            disabled={data.options.length <= 2}
                          >
                            <Delete />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              ))}
              
              <Box sx={{ mt: 2 }}>
                <IconButton 
                  color="primary" 
                  onClick={addOption}
                  disabled={data.options.length >= 6}
                >
                  <Add />
                </IconButton>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  Add option (max 6)
                </Typography>
              </Box>
            </RadioGroup>
          </FormControl>
        </Paper>
      </Grid>
      
      <Grid item xs={12}>
        <Typography variant="caption" color="text.secondary">
          Tip: Make sure to have at least one correct answer and provide clear options. Good multiple choice questions have plausible distractors that help assess understanding.
        </Typography>
      </Grid>
    </Grid>
  );
};

export default MultipleChoiceEditor;
