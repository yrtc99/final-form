import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Alert,
  Chip,
  Tooltip,
  Divider,
  LinearProgress
} from '@mui/material';
import axios from 'axios';
import {
  EmojiEvents,
  Star,
  Code,
  Psychology,
  School,
  Timer,
  TrendingUp,
  WorkspacePremium,
  Lock
} from '@mui/icons-material';

const Achievements = () => {
  const [achievements, setAchievements] = useState({
    earned: [],
    inProgress: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/student/achievements');
      setAchievements(response.data);
    } catch (err) {
      setError('Failed to load achievements data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Function to get appropriate icon for achievement type
  const getAchievementIcon = (type) => {
    switch (type) {
      case 'completion':
        return <School fontSize="large" />;
      case 'streak':
        return <Timer fontSize="large" />;
      case 'skill':
        return <Code fontSize="large" />;
      case 'mastery':
        return <Psychology fontSize="large" />;
      case 'progress':
        return <TrendingUp fontSize="large" />;
      case 'special':
        return <Star fontSize="large" />;
      default:
        return <EmojiEvents fontSize="large" />;
    }
  };

  // Function to get color for achievement rarity
  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common':
        return '#78909c'; // blue-grey
      case 'uncommon':
        return '#4caf50'; // green
      case 'rare':
        return '#2196f3'; // blue
      case 'epic':
        return '#9c27b0'; // purple
      case 'legendary':
        return '#ff9800'; // orange
      default:
        return '#78909c';
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
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <WorkspacePremium sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4">
          My Achievements
        </Typography>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      {/* Stats Summary */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="primary.main">
                {achievements.earned?.length || 0}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Achievements Earned
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="secondary.main">
                {achievements.inProgress?.length || 0}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Achievements In Progress
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ color: 'text.primary' }}>
                {achievements.totalPossible ? 
                  `${Math.round((achievements.earned?.length / achievements.totalPossible) * 100)}%` : 
                  '0%'}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Completion Rate
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Earned Achievements */}
      <Typography variant="h5" gutterBottom>
        Earned Achievements
      </Typography>
      
      {achievements.earned && achievements.earned.length > 0 ? (
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {achievements.earned.map((achievement) => (
            <Grid item xs={12} sm={6} md={4} key={achievement.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  borderTop: `4px solid ${getRarityColor(achievement.rarity)}`
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', mb: 2 }}>
                    <Box 
                      sx={{ 
                        mr: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'background.paper',
                        borderRadius: '50%',
                        width: 60,
                        height: 60,
                        boxShadow: 1,
                        color: getRarityColor(achievement.rarity)
                      }}
                    >
                      {getAchievementIcon(achievement.type)}
                    </Box>
                    <Box>
                      <Typography variant="h6" component="div" gutterBottom>
                        {achievement.title}
                      </Typography>
                      <Chip 
                        label={achievement.rarity.toUpperCase()} 
                        size="small" 
                        sx={{ 
                          bgcolor: getRarityColor(achievement.rarity), 
                          color: 'white' 
                        }} 
                      />
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {achievement.description}
                  </Typography>
                  
                  <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Earned on {new Date(achievement.earned_date).toLocaleDateString()}
                    </Typography>
                    <Tooltip title={`${achievement.xp} XP`}>
                      <Chip label={`${achievement.xp} XP`} size="small" variant="outlined" />
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 3, mb: 4, textAlign: 'center' }}>
          <EmojiEvents sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No achievements earned yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Complete lessons and exercises to earn achievements
          </Typography>
        </Paper>
      )}
      
      {/* In Progress Achievements */}
      <Typography variant="h5" gutterBottom>
        Achievements In Progress
      </Typography>
      
      {achievements.inProgress && achievements.inProgress.length > 0 ? (
        <Grid container spacing={3}>
          {achievements.inProgress.map((achievement) => (
            <Grid item xs={12} sm={6} key={achievement.id}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', mb: 2 }}>
                  <Box 
                    sx={{ 
                      mr: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'background.paper',
                      borderRadius: '50%',
                      width: 50,
                      height: 50,
                      boxShadow: 1,
                      color: 'text.secondary'
                    }}
                  >
                    {getAchievementIcon(achievement.type)}
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="div">
                      {achievement.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {achievement.description}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                  <Box sx={{ flexGrow: 1, mr: 2 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={(achievement.current_progress / achievement.target_progress) * 100} 
                      sx={{ height: 8, borderRadius: 5 }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {achievement.current_progress}/{achievement.target_progress}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Lock sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No achievements in progress
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Keep working on your lessons to unlock more achievements
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default Achievements;
