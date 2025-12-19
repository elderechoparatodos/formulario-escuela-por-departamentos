/**
 * La Otra Politica - Formulario de Inscripcion
 * JavaScript Principal
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('inscripcionForm');
    const profesionSelect = document.getElementById('profesion');
    const profesionOtraContainer = document.getElementById('profesionOtraContainer');
    const profesionOtraInput = document.getElementById('profesionOtra');
    const messageContainer = document.getElementById('messageContainer');
    const submitBtn = form.querySelector('.submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');

    // Mostrar/ocultar campo de "Otra profesion"
    profesionSelect.addEventListener('change', () => {
        if (profesionSelect.value === 'Otro') {
            profesionOtraContainer.classList.remove('hidden');
            profesionOtraInput.required = true;
        } else {
            profesionOtraContainer.classList.add('hidden');
            profesionOtraInput.required = false;
            profesionOtraInput.value = '';
        }
    });

    // Formatear numero de telefono
    const telefonoInput = document.getElementById('telefono');
    telefonoInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 10) {
            value = value.slice(0, 10);
        }
        e.target.value = value;
    });

    // Formatear cedula (solo numeros)
    const cedulaInput = document.getElementById('cedula');
    cedulaInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 12) {
            value = value.slice(0, 12);
        }
        e.target.value = value;
    });

    // Manejar envio del formulario
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validacion adicional
        if (profesionSelect.value === 'Otro' && !profesionOtraInput.value.trim()) {
            showMessage('Por favor especifica tu profesion', 'error');
            profesionOtraInput.focus();
            return;
        }

        // Mostrar loader
        setLoading(true);

        const formData = {
            nombre: document.getElementById('nombre').value,
            cedula: document.getElementById('cedula').value,
            telefono: document.getElementById('telefono').value,
            ciudad: document.getElementById('ciudad').value,
            departamento: document.getElementById('departamento').value,
            profesion: profesionSelect.value,
            profesionOtra: profesionOtraInput.value,
            nombreEmprendimiento: document.getElementById('nombreEmprendimiento').value,
            redesSociales: document.getElementById('redesSociales').value,
            retosEmprendimiento: document.getElementById('retosEmprendimiento').value
        };

        try {
            const response = await fetch('/api/inscripcion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                showMessage('Inscripcion realizada exitosamente. Bienvenido a La Otra Politica.', 'success');
                form.reset();
                profesionOtraContainer.classList.add('hidden');
            } else {
                showMessage(data.message || 'Error al procesar la inscripcion', 'error');
            }

        } catch (error) {
            console.error('Error:', error);
            showMessage('Error de conexion. Por favor intenta nuevamente.', 'error');
        } finally {
            setLoading(false);
        }
    });

    // Funcion para mostrar mensajes
    function showMessage(text, type) {
        messageContainer.classList.remove('hidden', 'success', 'error');
        messageContainer.classList.add(type);
        messageContainer.querySelector('.message-text').textContent = text;

        // Ocultar mensaje despues de 8 segundos
        setTimeout(() => {
            messageContainer.classList.add('hidden');
        }, 8000);
    }

    // Funcion para manejar estado de carga
    function setLoading(isLoading) {
        if (isLoading) {
            submitBtn.disabled = true;
            btnText.classList.add('hidden');
            btnLoader.classList.remove('hidden');
        } else {
            submitBtn.disabled = false;
            btnText.classList.remove('hidden');
            btnLoader.classList.add('hidden');
        }
    }

    // Efecto de entrada suave para los campos del formulario
    const formGroups = document.querySelectorAll('.form-group');
    formGroups.forEach((group, index) => {
        group.style.opacity = '0';
        group.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            group.style.transition = 'all 0.4s ease';
            group.style.opacity = '1';
            group.style.transform = 'translateY(0)';
        }, 100 + (index * 50));
    });

    // Efecto de brillo siguiendo el mouse en el formulario
    const glassForm = document.querySelector('.glass-form');
    
    glassForm.addEventListener('mousemove', (e) => {
        const rect = glassForm.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        glassForm.style.background = `
            radial-gradient(circle at ${x}% ${y}%, rgba(68, 46, 125, 0.15) 0%, transparent 50%),
            rgba(26, 26, 31, 0.7)
        `;
    });

    glassForm.addEventListener('mouseleave', () => {
        glassForm.style.background = 'rgba(26, 26, 31, 0.7)';
    });

    // Efecto 3D Card para la imagen del candidato
    const candidateCard = document.querySelector('.candidate-image-container');
    
    if (candidateCard) {
        const maxRotation = 15; // Grados maximos de rotacion

        candidateCard.addEventListener('mousemove', (e) => {
            const rect = candidateCard.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            // Calcular posicion relativa del mouse desde el centro
            const mouseX = e.clientX - centerX;
            const mouseY = e.clientY - centerY;
            
            // Normalizar valores (-1 a 1)
            const rotateY = (mouseX / (rect.width / 2)) * maxRotation;
            const rotateX = -(mouseY / (rect.height / 2)) * maxRotation;
            
            // Aplicar transformacion 3D
            candidateCard.style.transform = `
                perspective(1000px) 
                rotateX(${rotateX}deg) 
                rotateY(${rotateY}deg)
                scale3d(1.02, 1.02, 1.02)
            `;
        });

        candidateCard.addEventListener('mouseleave', () => {
            // Restaurar posicion original con transicion suave
            candidateCard.style.transform = `
                perspective(1000px) 
                rotateX(0deg) 
                rotateY(0deg)
                scale3d(1, 1, 1)
            `;
        });

        // Efecto inicial al entrar
        candidateCard.addEventListener('mouseenter', () => {
            candidateCard.style.transition = 'transform 0.1s ease-out, box-shadow 0.3s ease';
        });

        // Efecto de confeti al cargar
        createConfettiEffect(candidateCard);
    }

    // Funcion para crear efecto de confeti
    function createConfettiEffect(container) {
        const colors = ['#442e7d', '#5a3d9e', '#7c5fc4', '#9d84d4', '#ffffff', '#ffd700', '#ff6b6b', '#4ecdc4'];
        const confettiCount = 50;
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        confettiContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            overflow: hidden;
            border-radius: inherit;
            z-index: 10;
        `;
        container.appendChild(confettiContainer);

        for (let i = 0; i < confettiCount; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                const size = Math.random() * 10 + 5;
                const color = colors[Math.floor(Math.random() * colors.length)];
                const startX = Math.random() * 100;
                const startY = -10;
                const endX = startX + (Math.random() - 0.5) * 60;
                const endY = 110 + Math.random() * 20;
                const rotation = Math.random() * 720 - 360;
                const duration = Math.random() * 2 + 2;
                const delay = Math.random() * 0.5;
                const shape = Math.random() > 0.5 ? '50%' : '0';

                confetti.style.cssText = `
                    position: absolute;
                    width: ${size}px;
                    height: ${size}px;
                    background: ${color};
                    border-radius: ${shape};
                    left: ${startX}%;
                    top: ${startY}%;
                    opacity: 1;
                    transform: rotate(0deg);
                    animation: confettiFall${i} ${duration}s ease-out ${delay}s forwards;
                `;

                // Crear keyframes dinamicos
                const keyframes = `
                    @keyframes confettiFall${i} {
                        0% {
                            left: ${startX}%;
                            top: ${startY}%;
                            opacity: 1;
                            transform: rotate(0deg) scale(1);
                        }
                        50% {
                            opacity: 1;
                        }
                        100% {
                            left: ${endX}%;
                            top: ${endY}%;
                            opacity: 0;
                            transform: rotate(${rotation}deg) scale(0.5);
                        }
                    }
                `;

                const styleSheet = document.createElement('style');
                styleSheet.textContent = keyframes;
                document.head.appendChild(styleSheet);

                confettiContainer.appendChild(confetti);

                // Limpiar confeti despues de la animacion
                setTimeout(() => {
                    confetti.remove();
                    styleSheet.remove();
                }, (duration + delay) * 1000 + 100);
            }, i * 30);
        }

        // Limpiar contenedor despues de todas las animaciones
        setTimeout(() => {
            confettiContainer.remove();
        }, 5000);
    }
});
