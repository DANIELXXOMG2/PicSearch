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
pixabay_api_key = os.getenv("PIXABAY_API_KEY")
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
        
        # Filtrar etiquetas potencialmente problemáticas
        result = response.json()
        if 'hits' in result and len(result['hits']) > 0:
            for image in result['hits']:
                if 'tags' in image:
                    image['tags'] = filter_sensitive_tags(image['tags'])
        
        return jsonify(result)
    except requests.exceptions.RequestException as e:
        return jsonify({'error': str(e)}), 500

# Función para filtrar etiquetas sensibles o potencialmente problemáticas
def filter_sensitive_tags(tags_string):
    # Lista de términos potencialmente problemáticos relacionados con etnia, nacionalidad, etc.
    sensitive_terms = [
        'african', 'indian', 'black', 'white', 'ethnic', 'race', 'racial',
        'homeless', 'poor', 'beggar', 'hungry', 'starving', 'unemployed', 'drunk',
        'africa', 'india', 'monochrome', 'black and white'
    ]
    
    # Dividir la cadena de etiquetas
    tags = [tag.strip() for tag in tags_string.split(',')]
    
    # Filtrar etiquetas sensibles
    filtered_tags = [tag for tag in tags if not any(term.lower() in tag.lower() for term in sensitive_terms)]
    
    # Si todas las etiquetas fueron filtradas, mantener al menos algunas genéricas
    if not filtered_tags:
        # Mantener etiquetas genéricas como 'person', 'human', 'portrait', etc.
        generic_tags = [tag for tag in tags if tag.lower() in ['person', 'human', 'portrait', 'man', 'woman', 'child', 'people']]
        if generic_tags:
            filtered_tags = generic_tags
        else:
            # Si no hay etiquetas genéricas, mantener la primera etiqueta original
            filtered_tags = [tags[0]] if tags else ['image']
    
    return ', '.join(filtered_tags)

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
    app.run(host='0.0.0.0', debug=True)