// ============================================
// JUEGO DEL MAPA PIRATA
// ============================================
// Este archivo contiene toda la lógica del juego del puzzle del mapa pirata.
// El juego consiste en arrastrar piezas del puzzle a su posición correcta.

// ============================================
// INICIALIZACIÓN DEL JUEGO
// ============================================
// Cuando la página está lista, ejecutamos el juego
document.addEventListener('DOMContentLoaded', function() {
    
    // --- REFERENCIAS A ELEMENTOS DEL DOM ---
    // Obtenemos referencias a los elementos HTML que necesitamos manipular
    var contenedorPiezas = document.getElementById('contenedor-piezas');  // Donde se muestran las piezas sueltas
    var celdasGrid = document.querySelectorAll('.celda-rejilla');        // Las 8 celdas del mapa
    var mensajeDiv = document.getElementById('mensaje');                   // Mensaje de victoria
    var botonReiniciar = document.getElementById('boton-reiniciar');       // Botón para reiniciar
    var botonMusica = document.getElementById('boton-musica');             // Botón para música
    
    // --- VARIABLES DE ESTADO DEL JUEGO ---
    var piezasColocadas = [];  // Array que guarda los números de las piezas colocadas correctamente
    var totalPiezas = 8;        // Total de piezas que tiene el puzzle (no cambiar)
    
    // --- CONFIGURACIÓN DE AUDIO ---
    // Música de fondo
    var musicaFondo = new Audio('sounds/music.mp3');
    musicaFondo.loop = true;      // La música se repite en bucle
    musicaFondo.volume = 0.3;      // Volumen al 30% para que no tape los efectos
    var musicaActivada = false;    // Estado de la música (inicialmente desactivada)
    
    // Efectos de sonido pre-cargados
    // Se pre-cargan al inicio para que suenen inmediatamente cuando se necesiten
    var audioSplat = new Audio('sounds/splat.mp3');    // Sonido al colocar pieza correcta
    var audioAplausos = new Audio('sounds/claps.mp3');  // Sonido al ganar el juego
    audioSplat.volume = 0.3;       // Volumen del sonido de splat
    audioAplausos.volume = 0.3;    // Volumen del sonido de aplausos
    var audioInicializado = false; // Bandera para evitar inicializar audio múltiples veces
    
    // --- INICIALIZACIÓN DE AUDIO PARA iOS ---
    // iOS tiene restricciones estrictas: requiere un gesto del usuario para reproducir audio.
    // Esta función reproduce un sonido muy breve (50ms) para desbloquear el audio.
    // Se llama la primera vez que el usuario toca una pieza.
    function inicializarAudioiOS() {
        if (audioInicializado === false) {
            audioSplat.volume = 0.01;  // Volumen casi inaudible (1%)
            audioSplat.play().then(function() {
                // Después de 50ms, pausamos y restauramos volumen
                setTimeout(function() {
                    audioSplat.pause();
                    audioSplat.currentTime = 0;  // Reiniciar posición
                    audioSplat.volume = 0.2;     // Restaurar volumen normal
                }, 50);
            }).catch(function() {});  // Ignorar errores si falla
            audioInicializado = true;
        }
    }
    
    // Marcamos el botón de música visualmente como desactivado
    botonMusica.classList.add('music-off');
    
    // --- FUNCIÓN AUXILIAR PARA REPRODUCIR SONIDOS ---
    // Reproduce un sonido de forma segura, manejando errores
    // Parámetros:
    //   - audio: objeto Audio a reproducir
    //   - nombre: nombre del sonido (para logs de depuración)
    function reproducirSonido(audio, nombre) {
        console.log('Intentando reproducir:', nombre);
        audio.currentTime = 0;  // Reiniciar audio al inicio
        var promesa = audio.play();
        if (promesa !== undefined) {
            promesa.then(function() {
                console.log('Reproducido:', nombre);
            }).catch(function(error) {
                console.log('Error reproduciendo ' + nombre + ':', error);
            });
        }
    }
    
    // ============================================
    // FUNCIÓN: Barajar un array (mezclar piezas)
    // ============================================
    // Algoritmo de Fisher-Yates para barajar un array de forma aleatoria
    // Parámetros:
    //   - array: el array original a barajar
    // Retorna: un nuevo array con los elementos en orden aleatorio
    function barajar(array) {
        // Creamos una copia del array para no modificar el original
        var resultado = array.slice();
        
        // Recorremos el array desde el final hacia el principio
        // Por cada posición, intercambiamos con una posición aleatoria anterior
        for (var i = resultado.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));  // Índice aleatorio entre 0 y i
            var temp = resultado[i];
            resultado[i] = resultado[j];
            resultado[j] = temp;
        }
        
        return resultado;
    }
    
    // ============================================
    // FUNCIÓN: Crear una pieza del puzzle
    // ============================================
    // Crea un elemento DOM completo para una pieza del puzzle
    // Parámetros:
    //   - numero: número de la pieza (1-8)
    // Retorna: elemento DIV que representa la pieza
    function crearPieza(numero) {
        var pieza = document.createElement('div');
        pieza.className = 'pieza-puzzle';
        pieza.draggable = true;  // Habilitamos drag nativo (usado por ratón)
        pieza.dataset.pieza = numero;  // Guardamos el número como dato en el elemento
        
        // Creamos la imagen de la pieza
        var imagen = document.createElement('img');
        // Los archivos se llaman: mapa_trozo_01.png, mapa_trozo_02.png, etc.
        // Usamos padStart(2, '0') para asegurar que tenga 2 dígitos
        imagen.src = 'images/mapa_trozo_' + String(numero).padStart(2, '0') + '.png';
        imagen.alt = 'Trozo ' + numero;
        
        // Si la imagen no carga (por error 404 o conexión), mostramos el número
        imagen.onerror = function() {
            pieza.innerHTML = '<span style="color: #d4af37; font-size: 1rem; display: flex; align-items: center; justify-content: center; height: 100%; width: 100%;">' + numero + '</span>';
        };
        
        pieza.appendChild(imagen);
        
        // --- EVENTOS DE RATÓN ---
        // Evento dragstart: cuando empieza a arrastrar con ratón
        pieza.addEventListener('dragstart', function(e) {
            e.preventDefault(); // Cancelar drag nativo (usamos nuestro propio sistema)
            iniciarArrastreRaton(e, pieza);
        });
        
        // Evento dragend: cuando termina de arrastrar con ratón
        pieza.addEventListener('dragend', function(e) {
            e.preventDefault();
            terminarArrastreRaton(e);
        });
        
        // --- EVENTOS TÁCTILES (MÓVILES) ---
        // Evento touchstart: cuando el dedo toca la pantalla
        pieza.addEventListener('touchstart', iniciarTouch, { passive: false });
        
        return pieza;
    }
    
    // ============================================
    // FUNCIÓN: Iniciar el juego
    // ============================================
    // Reinicia el juego: limpia todo, crea y baraja las piezas
    function iniciarJuego() {
        // Limpiar estado
        piezasColocadas = [];
        contenedorPiezas.innerHTML = '';
        
        // Limpiar celdas del grid (quitar piezas y clases 'correct')
        for (var i = 0; i < celdasGrid.length; i++) {
            celdasGrid[i].innerHTML = '';
            celdasGrid[i].classList.remove('correct');
        }
        
        // Crear las 8 piezas
        var piezas = [];
        for (var i = 1; i <= totalPiezas; i++) {
            piezas.push(crearPieza(i));
        }
        
        // Barajar las piezas (mezclarlas aleatoriamente)
        piezas = barajar(piezas);
        
        // Añadir las piezas al contenedor (se mostrarán en el lateral)
        for (var i = 0; i < piezas.length; i++) {
            contenedorPiezas.appendChild(piezas[i]);
        }
        
        // Ocultar mensaje de victoria si estaba mostrado
        mensajeDiv.classList.remove('show');
    }
    
    // ============================================
    // SISTEMA DE DRAG & DROP (RATÓN)
    // ============================================
    // Usamos position: fixed en lugar del API nativo de drag & drop
    // porque el API nativo tiene problemas de rendimiento en móviles
    
    var piezaRaton = null;    // Pieza que se está arrastrando
    var celdaOrigen = null;   // Celda de origen (donde estaba la pieza)
    var rectOriginal = null;  // Dimensiones originales de la pieza
    
    // --- Función: Iniciar arrastre con ratón ---
    // Se llama cuando el usuario empieza a arrastrar una pieza
    function iniciarArrastreRaton(e, pieza) {
        piezaRaton = pieza;
        celdaOrigen = pieza.parentElement;
        rectOriginal = pieza.getBoundingClientRect();
        
        // Cambiar a position: fixed para queflote sobre todo
        pieza.style.position = 'fixed';
        pieza.style.left = rectOriginal.left + 'px';
        pieza.style.top = rectOriginal.top + 'px';
        pieza.style.zIndex = '1000';
        pieza.style.width = rectOriginal.width + 'px';
        pieza.style.height = rectOriginal.height + 'px';
        pieza.style.margin = '0';
        pieza.style.transform = 'translate3d(0,0,0)';  // Aceleración GPU
        pieza.style.pointerEvents = 'none';  // Permite detectar qué hay debajo
        
        // Mover la pieza al body (para queflote sobre todo)
        document.body.appendChild(pieza);
        
        // Mover la pieza al cursor
        moverAPiezaRaton(e.clientX, e.clientY);
        
        // Añadir eventos globales para mover y soltar
        document.addEventListener('mousemove', moverRaton);
        document.addEventListener('mouseup', terminarArrastreRaton);
    }
    
    // --- Función: Mover con ratón ---
    // Se llama mientras el usuario mueve el ratón
    function moverRaton(e) {
        if (piezaRaton) {
            moverAPiezaRaton(e.clientX, e.clientY);
        }
    }
    
    // --- Función: Mover pieza a posición ---
    // Actualiza la posición de la pieza arrastrada
    function moverAPiezaRaton(x, y) {
        if (piezaRaton) {
            // Centrar la pieza en el cursor
            piezaRaton.style.left = (x - piezaRaton.offsetWidth / 2) + 'px';
            piezaRaton.style.top = (y - piezaRaton.offsetHeight / 2) + 'px';
        }
    }
    
    // --- Función: Terminar arrastre ---
    // Se llama cuando el usuario suelta la pieza
    function terminarArrastreRaton(e) {
        // Eliminar eventos globales
        document.removeEventListener('mousemove', moverRaton);
        document.removeEventListener('mouseup', terminarArrastreRaton);
        
        if (piezaRaton) {
            // Detectar qué elemento está bajo el cursor
            var elemento = document.elementFromPoint(e.clientX, e.clientY);
            var celda = elemento ? elemento.closest('.celda-rejilla') : null;
            
            // Si hay una celda y está vacía
            if (celda && !celda.hasChildNodes()) {
                var numeroPieza = piezaRaton.dataset.pieza;
                var numeroEsperado = celda.dataset.pieza;
                
                // Si la pieza es la correcta
                if (numeroPieza === numeroEsperado) {
                    // Restaurar estilos y poner en la celda
                    piezaRaton.style.position = 'absolute';
                    piezaRaton.style.left = '0';
                    piezaRaton.style.top = '0';
                    piezaRaton.style.zIndex = '';
                    piezaRaton.style.width = '';
                    piezaRaton.style.height = '';
                    piezaRaton.style.margin = '';
                    piezaRaton.style.transform = '';
                    piezaRaton.style.pointerEvents = '';
                    celda.appendChild(piezaRaton);
                    
                    // Marcar como correcta y reproducir sonido
                    celda.classList.add('correct');
                    piezasColocadas.push(numeroPieza);
                    reproducirSonido(audioSplat, 'splat');
                    
                    console.log('Piezas colocadas:', piezasColocadas.length, 'de', totalPiezas);
                    
                    // Si todas las piezas están colocadas, ganar
                    if (piezasColocadas.length === totalPiezas) {
                        console.log('¡GANASTE! Reproduciendo aplausos');
                        reproducirSonido(audioAplausos, 'aplausos');
                        setTimeout(function() {
                            mensajeDiv.classList.add('show');
                        }, 300);
                    }
                } else {
                    // Pieza incorrecta, devolver al origen
                    devolverRatonOrigen();
                }
            } else {
                // Soltó fuera de una celda válida, devolver al origen
                devolverRatonOrigen();
            }
            
            // Limpiar variables
            piezaRaton = null;
            celdaOrigen = null;
            rectOriginal = null;
        }
    }
    
    // --- Función: Devolver pieza al origen ---
    // Restaura la pieza a su posición original si el drop fue incorrecto
    function devolverRatonOrigen() {
        if (piezaRaton && celdaOrigen) {
            // Restaurar estilos
            piezaRaton.style.position = '';
            piezaRaton.style.left = '';
            piezaRaton.style.top = '';
            piezaRaton.style.zIndex = '';
            piezaRaton.style.width = '';
            piezaRaton.style.height = '';
            piezaRaton.style.margin = '';
            piezaRaton.style.transform = '';
            piezaRaton.style.pointerEvents = '';
            // Volver a poner en la celda original
            celdaOrigen.appendChild(piezaRaton);
        }
    }
    
    // ============================================
    // SISTEMA TÁCTIL (MÓVILES/TABLETS)
    // ============================================
    // El API de drag & drop no funciona bien en móviles.
    // Usamos eventos touch directamente para mayor control y rendimiento.
    
    // Variables de estado del touch
    var piezaTouch = null;      // Pieza que se está tocando
    var celdaOriginal = null;   // Celda de origen de la pieza
    var xOriginal = 0;         // Posición X inicial del toque
    var yOriginal = 0;          // Posición Y inicial del toque
    
    // --- Función: Iniciar toque ---
    // Se llama cuando el dedo toca la pantalla sobre una pieza
    function iniciarTouch(e) {
        // Inicializar audio para iOS (si es la primera vez)
        inicializarAudioiOS();
        
        e.preventDefault(); // Evitar scroll mientras se arrastra
        
        var toque = e.touches[0];  // Primer punto de toque
        var pieza = e.target.closest('.pieza-puzzle');  // Buscar pieza ancestro
        
        // Solo procesar si es una pieza y no está ya en el grid
        if (pieza && !pieza.parentElement.classList.contains('celda-rejilla')) {
            piezaTouch = pieza;
            celdaOriginal = pieza.parentElement;
            
            // Guardar posición actual
            var rect = pieza.getBoundingClientRect();
            xOriginal = toque.clientX;
            yOriginal = toque.clientY;
            
            // Cambiar a position: fixed paraflotar sobre todo
            pieza.style.position = 'fixed';
            pieza.style.left = rect.left + 'px';
            pieza.style.top = rect.top + 'px';
            pieza.style.zIndex = '1000';
            pieza.style.width = rect.width + 'px';
            pieza.style.height = rect.height + 'px';
            pieza.style.margin = '0';
            pieza.style.transform = 'translate3d(0,0,0)';
            pieza.style.transition = 'none'; // Sin transición para respuesta inmediata
            pieza.style.pointerEvents = 'none'; // Permite detectar celda bajo el dedo
            document.body.appendChild(pieza);
            
            // Centrar en el dedo
            pieza.style.left = (toque.clientX - rect.width / 2) + 'px';
            pieza.style.top = (toque.clientY - rect.height / 2) + 'px';
            
            // Añadir eventos para movimiento y fin del toque
            document.addEventListener('touchmove', moverTouch, { passive: false });
            document.addEventListener('touchend', terminarTouch);
        }
    }
    
    // --- Función: Mover toque ---
    // Se llama mientras el dedo se mueve por la pantalla
    function moverTouch(e) {
        e.preventDefault(); // Evitar scroll
        
        if (piezaTouch) {
            var toque = e.touches[0];
            // Actualizar posición de la pieza
            piezaTouch.style.left = (toque.clientX - piezaTouch.offsetWidth / 2) + 'px';
            piezaTouch.style.top = (toque.clientY - piezaTouch.offsetHeight / 2) + 'px';
        }
    }
    
    // --- Función: Terminar toque ---
    // Se llama cuando el dedo se levanta de la pantalla
    function terminarTouch(e) {
        e.preventDefault();
        
        // Eliminar eventos globales
        document.removeEventListener('touchmove', moverTouch);
        document.removeEventListener('touchend', terminarTouch);
        
        if (piezaTouch) {
            var toque = e.changedTouches[0];
            // Detectar qué hay bajo el dedo
            var elemento = document.elementFromPoint(toque.clientX, toque.clientY);
            var celda = elemento ? elemento.closest('.celda-rejilla') : null;
            
            // Si hay una celda y está vacía
            if (celda && !celda.hasChildNodes()) {
                var numeroPieza = piezaTouch.dataset.pieza;
                var numeroEsperado = celda.dataset.pieza;
                
                // Si la pieza es correcta
                if (numeroPieza === numeroEsperado) {
                    // Restaurar estilos y poner en la celda
                    piezaTouch.style.position = 'absolute';
                    piezaTouch.style.left = '0';
                    piezaTouch.style.top = '0';
                    piezaTouch.style.zIndex = '';
                    piezaTouch.style.width = '';
                    piezaTouch.style.height = '';
                    piezaTouch.style.margin = '';
                    piezaTouch.style.transform = '';
                    piezaTouch.style.pointerEvents = '';
                    celda.appendChild(piezaTouch);
                    
                    // Marcar como correcta y reproducir sonido
                    celda.classList.add('correct');
                    piezasColocadas.push(numeroPieza);
                    reproducirSonido(audioSplat, 'splat');
                    
                    console.log('Piezas colocadas:', piezasColocadas.length, 'de', totalPiezas);
                    
                    // Si todas las piezas están colocadas, ganar
                    if (piezasColocadas.length === totalPiezas) {
                        console.log('¡GANASTE! Reproduciendo aplausos');
                        reproducirSonido(audioAplausos, 'aplausos');
                        setTimeout(function() {
                            mensajeDiv.classList.add('show');
                        }, 300);
                    }
                } else {
                    // Pieza incorrecta, devolver al origen
                    piezaTouch.style.position = '';
                    piezaTouch.style.left = '';
                    piezaTouch.style.top = '';
                    piezaTouch.style.zIndex = '';
                    piezaTouch.style.width = '';
                    piezaTouch.style.height = '';
                    piezaTouch.style.margin = '';
                    piezaTouch.style.transform = '';
                    piezaTouch.style.pointerEvents = '';
                    celdaOriginal.appendChild(piezaTouch);
                }
            } else {
                // Soltó fuera de una celda válida, devolver al origen
                piezaTouch.style.position = '';
                piezaTouch.style.left = '';
                piezaTouch.style.top = '';
                piezaTouch.style.zIndex = '';
                piezaTouch.style.width = '';
                piezaTouch.style.height = '';
                piezaTouch.style.margin = '';
                piezaTouch.style.transform = '';
                piezaTouch.style.pointerEvents = '';
                celdaOriginal.appendChild(piezaTouch);
            }
            
            // Limpiar variables
            piezaTouch = null;
            celdaOriginal = null;
        }
    }
    
    // ============================================
    // BOTÓN DE MÚSICA
    // ============================================
    // Alterna la música de fondo entre activada y desactivada
    botonMusica.addEventListener('click', function(e) {
        e.stopPropagation(); // Evitar que el clic se propague
        
        if (!musicaActivada) {
            // Activar música
            musicaFondo.play().then(function() {
                musicaActivada = true;
                botonMusica.innerHTML = '<i class="fa-solid fa-music"></i> Música ON';
                botonMusica.classList.remove('music-off');
                botonMusica.classList.add('music-on');
            }).catch(function() {});
        } else {
            // Desactivar música
            musicaFondo.pause();
            musicaActivada = false;
            botonMusica.innerHTML = '<i class="fa-solid fa-music"></i> Música OFF';
            botonMusica.classList.remove('music-on');
            botonMusica.classList.add('music-off');
        }
    });
    
    // ============================================
    // BOTÓN DE REINICIAR
    // ============================================
    // Reinicia el juego从头开始
    botonReiniciar.addEventListener('click', iniciarJuego);
    
    // ============================================
    // INICIO DEL JUEGO
    // ============================================
    // Llamamos a iniciarJuego cuando se carga la página
    iniciarJuego();
});

