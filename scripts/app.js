 // Canvas drawing functionality
        const canvas = document.getElementById('drawingCanvas');
        const ctx = canvas.getContext('2d');
        let isDrawing = false;
        
        // Set canvas background to white
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        
        // Drawing event listeners
        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseout', stopDrawing);
        
        // Touch support for mobile devices
        canvas.addEventListener('touchstart', handleTouchStart);
        canvas.addEventListener('touchmove', handleTouchMove);
        canvas.addEventListener('touchend', stopDrawing);
        
        function handleTouchStart(e) {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            canvas.dispatchEvent(mouseEvent);
        }
        
        function handleTouchMove(e) {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            canvas.dispatchEvent(mouseEvent);
        }
        
        function startDrawing(e) {
            isDrawing = true;
            draw(e);
        }
        
        function draw(e) {
            if (!isDrawing) return;
            
            // Get mouse position relative to canvas
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            ctx.lineTo(x, y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x, y);
        }
        
        function stopDrawing() {
            isDrawing = false;
            ctx.beginPath();
        }
        
        // Clear canvas
        document.getElementById('clearBtn').addEventListener('click', function() {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            document.getElementById('predictionResult').textContent = 'Draw a shape and click Classify';
            document.getElementById('confidenceBars').innerHTML = '';
        });
        
        // Load TensorFlow.js model and classify
        let model;
        
        async function loadModel() {
            try {
                // Load your model (replace with your actual model URL)
                model = await tf.loadLayersModel('../model/model.json');
                console.log('Model loaded successfully');
            } catch (error) {
                console.error('Error loading model:', error);
                document.getElementById('predictionResult').textContent = 'Error loading model. See console for details.';
            }
        }
        
        // Load model when page loads
        loadModel();
        
        // Classify drawing
        document.getElementById('classifyBtn').addEventListener('click', async function() {
            const loadingIndicator = document.getElementById('loadingIndicator');
            loadingIndicator.classList.add('active');
            
            try {
                // Preprocess the canvas image
                const imageData = preprocessCanvas(canvas);
                
                // Make prediction
                const prediction = await model.predict(imageData).data();
                
                // Get class names (these should match your model's classes)
                const classes = ['circle', 'square', 'triangle'];
                const predictedClass = classes[prediction.indexOf(Math.max(...prediction))];
                
                // Display results
                document.getElementById('predictionResult').textContent = `This looks like a ${predictedClass}!`;
                
                // Display confidence bars
                displayConfidenceBars(prediction, classes);
                
            } catch (error) {
                console.error('Classification error:', error);
                document.getElementById('predictionResult').textContent = 'Error during classification. See console for details.';
            } finally {
                loadingIndicator.classList.remove('active');
            }
        });
        
        function preprocessCanvas(canvasElement) {
            // Create a temporary canvas to resize the drawing to 128x128 (model's expected input)
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = 128;
            tempCanvas.height = 128;
            
            // Draw the original canvas content to the temp canvas and scale it down
            tempCtx.drawImage(canvasElement, 0, 0, 128, 128);
            
            // Get image data and convert to tensor
            const imageData = tempCtx.getImageData(0, 0, 128, 128);
            const tensor = tf.browser.fromPixels(imageData)
                .toFloat()
                .div(255.0)  // Normalize to [0,1]
                .expandDims();  // Add batch dimension
            
            return tensor;
        }
        
        function displayConfidenceBars(predictions, classes) {
            const confidenceBars = document.getElementById('confidenceBars');
            confidenceBars.innerHTML = '';
            
            // Create a confidence bar for each class
            classes.forEach((className, index) => {
                const confidence = predictions[index] * 100;
                
                const container = document.createElement('div');
                container.style.width = '100%';
                container.style.marginBottom = '10px';
                
                const label = document.createElement('div');
                label.className = 'confidence-label';
                label.innerHTML = `<span>${className}</span><span>${confidence.toFixed(1)}%</span>`;
                
                const barContainer = document.createElement('div');
                barContainer.className = 'confidence-bar';
                
                const barFill = document.createElement('div');
                barFill.className = 'confidence-fill';
                barFill.style.width = `${confidence}%`;
                barFill.style.backgroundColor = getColorForClass(className);
                
                barContainer.appendChild(barFill);
                container.appendChild(label);
                container.appendChild(barContainer);
                confidenceBars.appendChild(container);
            });
        }
        
        function getColorForClass(className) {
            const colors = {
                'circle': '#3498db',
                'square': '#2ecc71',
                'triangle': '#e74c3c'
            };
            return colors[className] || '#9b59b6';
        }
