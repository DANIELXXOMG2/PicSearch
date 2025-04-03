document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const imageCountSelect = document.getElementById('image-count-select');
    const resultsContainer = document.getElementById('results');
    const loadingIndicator = document.getElementById('loading');
    const selectedImagesContainer = document.getElementById('selected-images');
    const selectedCountElement = document.getElementById('selected-count');
    const saveButton = document.getElementById('save-button');
    
    // Estado de la aplicación
    let selectedImages = [];
    
    // Evento para buscar imágenes
    searchButton.addEventListener('click', searchImages);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchImages();
        }
    });
    
    // Función para buscar imágenes
    function searchImages() {
        const query = searchInput.value.trim();
        const perPage = imageCountSelect.value;
        
        if (!query) {
            showNotification('Por favor, ingresa un término de búsqueda', 'error');
            return;
        }
        
        // Mostrar indicador de carga
        loadingIndicator.classList.remove('hidden');
        resultsContainer.innerHTML = '';
        
        // Realizar petición al backend
        fetch('/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query, per_page: perPage })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la búsqueda');
            }
            return response.json();
        })
        .then(data => {
            // Ocultar indicador de carga
            loadingIndicator.classList.add('hidden');
            
            // Mostrar resultados
            if (data.hits && data.hits.length > 0) {
                displayResults(data.hits);
            } else {
                resultsContainer.innerHTML = '<p class="no-results">No se encontraron imágenes para esta búsqueda</p>';
            }
        })
        .catch(error => {
            loadingIndicator.classList.add('hidden');
            showNotification(error.message, 'error');
            console.error('Error:', error);
        });
    }
    
    // Función para mostrar resultados
    function displayResults(images) {
        resultsContainer.innerHTML = '';
        
        images.forEach(image => {
            const imageCard = document.createElement('div');
            imageCard.className = 'image-card';
            imageCard.dataset.id = image.id;
            
            // Verificar si la imagen ya está seleccionada
            const isSelected = selectedImages.some(img => img.id === image.id);
            
            imageCard.innerHTML = `
                <img src="${image.webformatURL}" alt="${image.tags}">
                <div class="image-info">
                    <h3 class="image-title">ID: ${image.id}</h3>
                    <p class="image-tags">${image.tags}</p>
                </div>
                <div class="image-select ${isSelected ? 'selected' : ''}">
                    <i class="fas ${isSelected ? 'fa-check' : 'fa-plus'}"></i>
                </div>
                <div class="download-button" title="Descargar imagen">
                    <img src="/static/download-icon.svg" alt="Descargar" width="24" height="24">
                </div>
            `;
            
            // Evento para seleccionar/deseleccionar imagen
            const selectButton = imageCard.querySelector('.image-select');
            selectButton.addEventListener('click', () => {
                toggleImageSelection(image, selectButton);
            });
            
            // Evento para descargar imagen
            const downloadButton = imageCard.querySelector('.download-button');
            downloadButton.addEventListener('click', (e) => {
                e.stopPropagation();
                downloadImage(image.largeImageURL, `pixabay-image-${image.id}`);
            });
            
            resultsContainer.appendChild(imageCard);
        });
    }
    
    // Función para alternar selección de imagen
    function toggleImageSelection(image, button) {
        const index = selectedImages.findIndex(img => img.id === image.id);
        
        if (index === -1) {
            // Añadir a seleccionados
            selectedImages.push({
                id: image.id,
                webformatURL: image.webformatURL,
                largeImageURL: image.largeImageURL,
                tags: image.tags,
                user: image.user,
                pageURL: image.pageURL
            });
            button.classList.add('selected');
            button.innerHTML = '<i class="fas fa-check"></i>';
        } else {
            // Quitar de seleccionados
            selectedImages.splice(index, 1);
            button.classList.remove('selected');
            button.innerHTML = '<i class="fas fa-plus"></i>';
        }
        
        updateSelectedImagesUI();
    }
    
    // Función para actualizar UI de imágenes seleccionadas
    function updateSelectedImagesUI() {
        selectedImagesContainer.innerHTML = '';
        selectedCountElement.textContent = selectedImages.length;
        
        // Habilitar/deshabilitar botón de guardar
        if (selectedImages.length > 0) {
            saveButton.disabled = false;
        } else {
            saveButton.disabled = true;
        }
        
        // Mostrar imágenes seleccionadas
        selectedImages.forEach(image => {
            const selectedImage = document.createElement('div');
            selectedImage.className = 'selected-image';
            selectedImage.dataset.id = image.id;
            
            selectedImage.innerHTML = `
                <img src="${image.webformatURL}" alt="${image.tags}">
                <div class="remove-image">
                    <i class="fas fa-times"></i>
                </div>
            `;
            
            // Evento para quitar imagen de seleccionados
            const removeButton = selectedImage.querySelector('.remove-image');
            removeButton.addEventListener('click', () => {
                removeSelectedImage(image.id);
            });
            
            selectedImagesContainer.appendChild(selectedImage);
        });
    }
    
    // Función para quitar imagen de seleccionados
    function removeSelectedImage(id) {
        // Actualizar array de seleccionados
        selectedImages = selectedImages.filter(image => image.id !== id);
        
        // Actualizar UI de seleccionados
        updateSelectedImagesUI();
        
        // Actualizar UI de resultados si la imagen está visible
        const imageCard = resultsContainer.querySelector(`.image-card[data-id="${id}"]`);
        if (imageCard) {
            const selectButton = imageCard.querySelector('.image-select');
            selectButton.classList.remove('selected');
            selectButton.innerHTML = '<i class="fas fa-plus"></i>';
        }
    }
    
    // Evento para guardar imágenes en MongoDB
    saveButton.addEventListener('click', () => {
        if (selectedImages.length === 0) {
            showNotification('No hay imágenes seleccionadas', 'error');
            return;
        }
        
        // Mostrar indicador de carga
        saveButton.disabled = true;
        saveButton.textContent = 'Guardando...';
        
        // Realizar petición al backend
        fetch('/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ images: selectedImages })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al guardar imágenes');
            }
            return response.json();
        })
        .then(data => {
            showNotification(data.message, 'success');
            
            // Limpiar seleccionados
            selectedImages = [];
            updateSelectedImagesUI();
            
            // Actualizar UI de resultados
            const selectButtons = resultsContainer.querySelectorAll('.image-select.selected');
            selectButtons.forEach(button => {
                button.classList.remove('selected');
                button.innerHTML = '<i class="fas fa-plus"></i>';
            });
        })
        .catch(error => {
            showNotification(error.message, 'error');
            console.error('Error:', error);
        })
        .finally(() => {
            saveButton.disabled = false;
            saveButton.textContent = 'Guardar en MongoDB';
        });
    });
    
    // Función para mostrar notificaciones
    function showNotification(message, type) {
        // Eliminar notificaciones existentes
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => {
            notification.remove();
        });
        
        // Crear nueva notificación
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Mostrar notificación
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Ocultar notificación después de 3 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    // Función para descargar imagen
    function downloadImage(url, filename) {
        fetch(url)
            .then(response => response.blob())
            .then(blob => {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showNotification('Imagen descargada correctamente', 'success');
            })
            .catch(error => {
                console.error('Error al descargar la imagen:', error);
                showNotification('Error al descargar la imagen', 'error');
            });
    }
});