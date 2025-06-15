// Debug: Check if required variables are available
console.log('Map Token:', mapToken);
console.log('Listing:', listing);
console.log('Listing Coordinates:', listing?.geometry?.coordinates);

// Check if mapToken and listing are defined
if (!mapToken) {
    console.error('Map token is not defined. Check your environment variables.');
    document.getElementById('map').innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Map token not available</div>';
}

if (!listing || !listing.geometry || !listing.geometry.coordinates) {
    console.error('Listing coordinates are not available.');
    document.getElementById('map').innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Location data not available</div>';
}

// Only initialize map if we have the required data
if (mapToken && listing && listing.geometry && listing.geometry.coordinates) {
    try {
        // Set Mapbox access token
        mapboxgl.accessToken = mapToken;

        // Get coordinates from listing
        const listingCoordinates = listing.geometry.coordinates;
        
        // Validate coordinates format [longitude, latitude]
        if (!Array.isArray(listingCoordinates) || listingCoordinates.length !== 2) {
            throw new Error('Invalid coordinates format');
        }

        console.log('Initializing map with coordinates:', listingCoordinates);

        // Initialize the map
        const map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v12',
            center: listingCoordinates,
            zoom: 12, // Increased zoom for better view
            attributionControl: false // Optional: hide attribution for cleaner look
        });

        // Add navigation controls
        map.addControl(new mapboxgl.NavigationControl());

        // Create a marker with popup
        const marker = new mapboxgl.Marker({ 
            color: '#FF385C', // Airbnb-style red color
            scale: 1.2 
        })
        .setLngLat(listingCoordinates)
        .setPopup(
            new mapboxgl.Popup({ 
                offset: 25,
                closeButton: false,
                closeOnClick: false 
            })
            .setHTML(`
                <div style="padding: 10px; text-align: center;">
                    <h4 style="margin: 0 0 8px 0; font-size: 16px;">${listing.location}</h4>
                    <p style="margin: 0; font-size: 14px; color: #666;">Exact location provided after booking</p>
                </div>
            `)
        )
        .addTo(map);

        // Size of the pulsing dot
        const size = 200;

        // Pulsing dot animation
        const pulsingDot = {
            width: size,
            height: size,
            data: new Uint8Array(size * size * 4),

            onAdd: function () {
                const canvas = document.createElement('canvas');
                canvas.width = this.width;
                canvas.height = this.height;
                this.context = canvas.getContext('2d');
            },

            render: function () {
                const duration = 1000;
                const t = (performance.now() % duration) / duration;

                const radius = (size / 2) * 0.3;
                const outerRadius = (size / 2) * 0.7 * t + radius;
                const context = this.context;

                // Draw the outer circle
                context.clearRect(0, 0, this.width, this.height);
                context.beginPath();
                context.arc(
                    this.width / 2,
                    this.height / 2,
                    outerRadius,
                    0,
                    Math.PI * 2
                );
                context.fillStyle = `rgba(255, 56, 92, ${1 - t})`; // Airbnb red color
                context.fill();

                // Draw the inner circle
                context.beginPath();
                context.arc(
                    this.width / 2,
                    this.height / 2,
                    radius,
                    0,
                    Math.PI * 2
                );
                context.fillStyle = 'rgba(255, 56, 92, 1)'; // Airbnb red color
                context.strokeStyle = 'white';
                context.lineWidth = 2 + 4 * (1 - t);
                context.fill();
                context.stroke();

                // Update image data
                this.data = context.getImageData(0, 0, this.width, this.height).data;

                // Trigger repaint
                map.triggerRepaint();

                return true;
            }
        };

        // Add pulsing dot when map loads
        map.on('load', () => {
            console.log('Map loaded successfully');
            
            map.addImage('pulsing-dot', pulsingDot, { pixelRatio: 2 });

            map.addSource('dot-point', {
                'type': 'geojson',
                'data': {
                    'type': 'FeatureCollection',
                    'features': [
                        {
                            'type': 'Feature',
                            'geometry': {
                                'type': 'Point',
                                'coordinates': listingCoordinates
                            }
                        }
                    ]
                }
            });

            map.addLayer({
                'id': 'layer-with-pulsing-dot',
                'type': 'symbol',
                'source': 'dot-point',
                'layout': {
                    'icon-image': 'pulsing-dot'
                }
            });
        });

        // Handle map errors
        map.on('error', (e) => {
            console.error('Map error:', e);
            document.getElementById('map').innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Failed to load map</div>';
        });

        // Show popup on marker click
        marker.getElement().addEventListener('click', () => {
            marker.togglePopup();
        });

    } catch (error) {
        console.error('Error initializing map:', error);
        document.getElementById('map').innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Error loading map</div>';
    }
} else {
    // Fallback content when map can't be loaded
    document.getElementById('map').innerHTML = `
        <div style="padding: 40px; text-align: center; background: #f8f9fa; border-radius: 8px; border: 2px dashed #dee2e6;">
            <h5 style="color: #6c757d; margin-bottom: 10px;">📍 Location</h5>
            <p style="color: #6c757d; margin: 0;">${listing?.location || 'Location information not available'}</p>
        </div>
    `;
}