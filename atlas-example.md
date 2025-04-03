Connecting with MongoDB Driver
1. Select your driver and version
We recommend installing and using the latest driver version.

Driver

Version

2. Install your driver
Run the following on the command line
Note: Use appropriate Python 3 executable
python -m pip install "pymongo[srv]"

View MongoDB Python Driver installation instructions.
3. Add your connection string into your application code
Use this connection string in your application


View full code sample

from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
uri = "mongodb+srv://danielxxomg:40334277@pixabay-img.dlmrkh8.mongodb.net/?retryWrites=true&w=majority&appName=pixabay-img"
# Create a new client and connect to the server
client = MongoClient(uri, server_api=ServerApi('1'))
# Send a ping to confirm a successful connection
try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)

Replace <db_password> with the password for the danielxxomg database user. Ensure any option params are URL encoded.
RESOURCES
Get started with the Python Driver
Python Starter Sample App
Access your Database Users
Troubleshoot Connections