# Buscador de Imágenes Pixabay

Aplicación web para buscar y guardar imágenes de Pixabay utilizando Flask y MongoDB.

## Características

- Búsqueda de imágenes en Pixabay
- Selección y guardado de imágenes en MongoDB
- Interfaz de usuario intuitiva y responsive
- Dockerizada para fácil despliegue

## Requisitos previos

- Docker y Docker Compose instalados
- Archivo `.env` con las credenciales necesarias:
  - `MONGOUSER`: Usuario de MongoDB Atlas
  - `MONGOPASSWORD`: Contraseña de MongoDB Atlas
  - `MONGOURL`: URL de conexión a MongoDB Atlas
  - `pixabay-api-key`: Clave de API de Pixabay

## Instrucciones de despliegue

### Usando Docker Compose (recomendado)

1. Asegúrate de tener el archivo `.env` con las variables de entorno necesarias
2. Ejecuta el siguiente comando en la raíz del proyecto:

```bash
docker-compose up -d
```

3. Accede a la aplicación en tu navegador: http://localhost:5000

### Construyendo la imagen manualmente

1. Construye la imagen Docker:

```bash
docker build -t pixabay-app .
```

2. Ejecuta el contenedor:

```bash
docker run -d -p 5000:5000 --env-file .env --name pixabay-app pixabay-app
```

3. Accede a la aplicación en tu navegador: http://localhost:5000

## Desarrollo local

Para ejecutar la aplicación en modo desarrollo sin Docker:

1. Instala las dependencias:

```bash
pip install -r requirements.txt
```

2. Ejecuta la aplicación:

```bash
python app.py
```

3. Accede a la aplicación en tu navegador: http://localhost:5000

## Notas

- La aplicación utiliza Gunicorn como servidor WSGI en producción
- Las variables de entorno se cargan desde el archivo `.env`
- La imagen Docker está optimizada para tamaño y rendimiento