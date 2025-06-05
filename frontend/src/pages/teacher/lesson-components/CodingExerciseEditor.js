import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  TextField,
  Grid,
  Paper,
  Divider
} from '@mui/material';

const CodingExerciseEditor = ({ data, onChange }) => {
  const [instructions, setInstructions] = useState(data.instructions || '');
  const [starterCode, setStarterCode] = useState(data.starter_code || '');
  const [solutionCode, setSolutionCode] = useState(data.solution_code || '');
  const [testCode, setTestCode] = useState(data.test_code || '');

  // Sync with parent component
  useEffect(() => {
    onChange({
      instructions,
      starter_code: starterCode,
      solution_code: solutionCode,
      test_code: testCode
    });
  }, [instructions, starterCode, solutionCode, testCode, onChange]);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom>
          Instructions
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          variant="outlined"
          placeholder="Enter instructions for the coding exercise..."
        />
      </Grid>
      
      <Grid item xs={12}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Starter Code
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <TextField
            fullWidth
            multiline
            rows={6}
            value={starterCode}
            onChange={(e) => setStarterCode(e.target.value)}
            variant="outlined"
            placeholder="// Starter code provided to the student"
            sx={{ fontFamily: 'monospace' }}
          />
        </Paper>
      </Grid>
      
      <Grid item xs={12}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Solution Code
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <TextField
            fullWidth
            multiline
            rows={6}
            value={solutionCode}
            onChange={(e) => setSolutionCode(e.target.value)}
            variant="outlined"
            placeholder="// Correct solution code"
            sx={{ fontFamily: 'monospace' }}
          />
        </Paper>
      </Grid>
      
      <Grid item xs={12}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Test Code
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Write test cases to verify the student's solution. This code will run against both the starter code and solution code.
            </Typography>
          </Box>
          <TextField
            fullWidth
            multiline
            rows={6}
            value={testCode}
            onChange={(e) => setTestCode(e.target.value)}
            variant="outlined"
            placeholder="// Test code to verify the solution"
            sx={{ fontFamily: 'monospace' }}
          />
        </Paper>
      </Grid>
    </Grid>
  );
};

export default CodingExerciseEditor;
