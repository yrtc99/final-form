import os
import sys
from dotenv import load_dotenv
from flask import Flask

# Add parent directory to Python path so that 'backend' can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))  

# Now we can import from backend
from backend import create_app

# Load environment variables
load_dotenv()

# Create the Flask application
app = create_app()

if __name__ == '__main__':
    # Get port from environment variable or use default
    port = int(os.environ.get('PORT', 5000))
    
    # Run the app
    app.run(host='0.0.0.0', port=port, debug=True)
