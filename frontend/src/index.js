import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import setupAxios from './utils/axiosConfig';

// 設置全局axios配置
setupAxios();

// Create a custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#000000', // Black
    },
    secondary: {
      main: '#FFFF00', // Vibrant Yellow
    },
    background: {
      default: '#FFFFFF', // White
      paper: '#FFFFFF',   // White for Paper components
    },
    text: {
      primary: '#000000', // Black
      secondary: '#333333', // Dark Gray
    },
    divider: '#000000', // Black dividers
  },
  typography: {
    fontFamily: '"Consolas", "Monaco", "Courier New", monospace',
    fontWeightBold: 700, // Ensure bold is actually bold
    h1: { fontSize: '2.5rem', fontWeight: 700 },
    h2: { fontSize: '2rem', fontWeight: 700 },
    h3: { fontSize: '1.75rem', fontWeight: 700 },
    h4: { fontSize: '1.5rem', fontWeight: 700 },
    h5: { fontSize: '1.25rem', fontWeight: 700 },
    h6: { fontSize: '1rem', fontWeight: 700 },
    button: {
      fontWeight: 700,
      textTransform: 'none', // Common in Neubrutalism
    }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          color: '#000000',
          backgroundColor: '#FFFFFF',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          border: '2px solid #000000',
          borderRadius: 0,
          boxShadow: '4px 4px 0px #000000',
          '&:hover': {
            backgroundColor: '#FFFF00',
            color: '#000000',
            boxShadow: '2px 2px 0px #000000',
          },
          '&:active': {
            boxShadow: '1px 1px 0px #000000',
          },
        },
        containedPrimary: {
          backgroundColor: '#000000',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#333333',
          },
        },
        containedSecondary: {
          backgroundColor: '#FFFF00',
          color: '#000000',
          '&:hover': {
            backgroundColor: '#FFEE00',
          },
        },
        outlined: {
           borderColor: '#000000',
           color: '#000000',
           '&:hover': {
            borderColor: '#000000',
            backgroundColor: 'rgba(255, 255, 0, 0.1)',
          },
        }
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          border: '2px solid #000000',
          borderRadius: 0,
          boxShadow: '5px 5px 0px #000000',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: '#000000',
          boxShadow: 'none',
          borderBottom: '2px solid #000000',
        },
      },
    },
    MuiDrawer: {
        styleOverrides: {
            paper: {
                borderRight: '2px solid #000000',
                borderRadius: 0,
                boxShadow: '5px 0px 0px #000000',
            }
        }
    },
    MuiTextField: {
        styleOverrides: {
            root: {
                '& .MuiOutlinedInput-root': {
                    borderRadius: 0,
                    '& fieldset': {
                        border: '2px solid #000000',
                    },
                    '&:hover fieldset': {
                        borderColor: '#000000',
                    },
                    '&.Mui-focused fieldset': {
                        border: '2px solid #000000',
                    },
                },
                '& .MuiInputLabel-root': {
                    color: '#000000',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                    color: '#000000',
                },
            }
        }
    },
    MuiChip: {
        styleOverrides: {
            root: {
                border: '2px solid #000000',
                borderRadius: '4px',
                backgroundColor: '#FFFFFF',
                color: '#000000',
                fontWeight: 'bold',
            },
            colorPrimary: {
                backgroundColor: '#000000',
                color: '#FFFFFF',
                '&:hover': {
                    backgroundColor: '#333333',
                }
            },
            colorSecondary: {
                backgroundColor: '#FFFF00',
                color: '#000000',
                '&:hover': {
                    backgroundColor: '#FFEE00',
                }
            }
        }
    },
    MuiListItemButton: {
        styleOverrides: {
            root: {
                '&.Mui-selected': {
                    backgroundColor: '#FFFF00',
                    color: '#000000',
                    border: '2px solid #000000',
                    '&:hover': {
                        backgroundColor: '#FFEE00',
                    },
                },
                '&:hover': {
                    backgroundColor: 'rgba(255, 255, 0, 0.1)',
                }
            }
        }
    },
    MuiTabs: {
        styleOverrides: {
            indicator: {
                backgroundColor: '#000000',
                height: '3px',
            }
        }
    },
    MuiTab: {
        styleOverrides: {
            root: {
                textTransform: 'none',
                fontWeight: 'bold',
                borderBottom: '2px solid transparent',
                '&.Mui-selected': {
                    color: '#000000',
                    borderBottom: '2px solid #000000',
                },
                '&:hover': {
                    backgroundColor: 'rgba(255, 255, 0, 0.1)',
                    color: '#000000',
                }
            }
        }
    },
    MuiAccordion: {
        styleOverrides: {
            root: {
                border: '2px solid #000000',
                borderRadius: 0,
                boxShadow: '5px 5px 0px #000000',
                '&:before': {
                    display: 'none',
                },
                '&.Mui-expanded': {
                    margin: '0 0',
                    boxShadow: '5px 5px 0px #000000',
                }
            }
        }
    },
    MuiAccordionSummary: {
        styleOverrides: {
            root: {
                borderBottom: '2px solid #000000',
                '&.Mui-expanded': {
                    minHeight: '48px',
                },
            },
            content: {
                '&.Mui-expanded': {
                    margin: '12px 0',
                }
            }
        }
    },
    MuiDialog: {
        styleOverrides: {
            paper: {
                borderRadius: 0,
            }
        }
    },
    MuiDialogTitle: {
        styleOverrides: {
            root: {
                borderBottom: '2px solid #000000',
                fontWeight: 'bold',
            }
        }
    },
    MuiDialogActions: {
        styleOverrides: {
            root: {
                borderTop: '2px solid #000000',
                padding: '16px 24px',
            }
        }
    },
    MuiAlert: {
        styleOverrides: {
            root: {
                border: '2px solid #000000',
                borderRadius: 0,
                fontWeight: 'bold',
                '&.MuiAlert-standardSuccess': {
                    backgroundColor: '#ccffcc',
                    color: '#000000',
                    '& .MuiAlert-icon': { color: '#000000' },
                },
                '&.MuiAlert-standardError': {
                    backgroundColor: '#ffcccc',
                    color: '#000000',
                    '& .MuiAlert-icon': { color: '#000000' },
                },
                '&.MuiAlert-standardWarning': {
                    backgroundColor: '#ffffcc',
                    color: '#000000',
                    '& .MuiAlert-icon': { color: '#000000' },
                },
                '&.MuiAlert-standardInfo': {
                    backgroundColor: '#cceeff',
                    color: '#000000',
                    '& .MuiAlert-icon': { color: '#000000' },
                },
            }
        }
    }
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
