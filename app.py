from flask import Flask, render_template, request, jsonify
import requests
import os
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración de la aplicación
app = Flask(__name__)

# Configuración de MongoDB Atlas
mongo_user = os.getenv("MONGOUSER")
mongo_password = os.getenv("MONGOPASSWORD")
mongo_url = os.getenv("MONGOURL")

# Configuración de Pixabay API
pixabay_api_key = os.getenv("pixabay-api-key")
pixabay_api_url = "https://pixabay.com/api/"

# Conexión a MongoDB Atlas
client = MongoClient(mongo_url, server_api=ServerApi('1'))
db = client.pixabay_images
collection = db.saved_images

# Verificar conexión a MongoDB
try:
    client.admin.command('ping')
    print("Conexión exitosa a MongoDB Atlas!")
except Exception as e:
    print(f"Error de conexión a MongoDB: {e}")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/search', methods=['POST'])
def search_images():
    data = request.get_json()
    query = data.get('query', '')
    per_page = data.get('per_page', 10)
    
    # Parámetros para la API de Pixabay
    params = {
        'key': pixabay_api_key,
        'q': query,
        'image_type': 'photo',
        'per_page': per_page
    }
    
    try:
        response = requests.get(pixabay_api_url, params=params)
        response.raise_for_status()
        return jsonify(response.json())
    except requests.exceptions.RequestException as e:
        return jsonify({'error': str(e)}), 500

@app.route('/save', methods=['POST'])
def save_images():
    data = request.get_json()
    images = data.get('images', [])
    
    if not images:
        return jsonify({'error': 'No se proporcionaron imágenes'}), 400
    
    try:
        # Guardar imágenes en MongoDB Atlas
        result = collection.insert_many(images)
        return jsonify({
            'success': True,
            'message': f'Se guardaron {len(result.inserted_ids)} imágenes correctamente',
            'ids': [str(id) for id in result.inserted_ids]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)