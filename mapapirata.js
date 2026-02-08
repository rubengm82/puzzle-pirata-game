// ============================================
// JUEGO DEL MAPA PIRATA - CÓDIGO SIMPLIFICADO
// ============================================

// Cuando la página está lista, ejecutamos el juego
document.addEventListener('DOMContentLoaded', function() {
    
    // Elementos del HTML que usamos
    var contenedorPiezas = document.getElementById('contenedor-piezas');
    var celdasGrid = document.querySelectorAll('.celda-rejilla');
    var mensajeDiv = document.getElementById('mensaje');
    var botonReiniciar = document.getElementById('boton-reiniciar');
    var botonMusica = document.getElementById('boton-musica');
    
    // Variables del juego
    var piezasColocadas = [];  // Lista de piezas que ya se colocaron
    var totalPiezas = 8;        // Hay 8 piezas en el puzzle
    
    // Variables para la música
    var musicaFondo = new Audio('sounds/music.mp3');
    musicaFondo.loop = true;      // La música se repite
    musicaFondo.volume = 0.3;      // Volumen al 30%
    var musicaActivada = false;
    
    // Botón de música starts en OFF
    botonMusica.classList.add('music-off');
    
    // ============================================
    // FUNCIÓN: Barajar un array (mezclar piezas)
    // ============================================
    function barajar(array) {
        // Copiamos el array para no modificar el original
        var resultado = array.slice();
        
        // Recorremos el array y intercambiamos posiciones
        for (var i = resultado.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = resultado[i];
            resultado[i] = resultado[j];
            resultado[j] = temp;
        }
        
        return resultado;
    }
    
    // ============================================
    // FUNCIÓN: Crear una pieza del puzzle
    // ============================================
    function crearPieza(numero) {
        var pieza = document.createElement('div');
        pieza.className = 'pieza-puzzle';
        pieza.draggable = true;
        pieza.dataset.pieza = numero;  // Guardamos el número de la pieza
        
        // Creamos la imagen de la pieza
        var imagen = document.createElement('img');
        // Nombre del archivo: mapa_trozo_01.png, mapa_trozo_02.png, etc.
        imagen.src = 'images/mapa_trozo_' + String(numero).padStart(2, '0') + '.png';
        imagen.alt = 'Trozo ' + numero;
        
        // Si la imagen no carga, mostramos el número
        imagen.onerror = function() {
            pieza.innerHTML = '<span style="color: #d4af37; font-size: 1rem; display: flex; align-items: center; justify-content: center; height: 100%; width: 100%;">' + numero + '</span>';
        };
        
        pieza.appendChild(imagen);
        
        // Evento cuando empieza a arrastrar (ratón)
        pieza.addEventListener('dragstart', function(e) {
            e.target.classList.add('dragging');
            e.dataTransfer.setData('text/plain', e.target.dataset.pieza);
            e.dataTransfer.effectAllowed = 'move';
        });
        
        // Evento cuando termina de arrastrar
        pieza.addEventListener('dragend', function(e) {
            e.target.classList.remove('dragging');
        });
        
        // Evento touch para móviles (arrastrar con el dedo)
        pieza.addEventListener('touchstart', iniciarTouch, { passive: false });
        
        return pieza;
    }
    
    // ============================================
    // FUNCIÓN: Iniciar el juego
    // ============================================
    function iniciarJuego() {
        // Limpiamos todo
        piezasColocadas = [];
        contenedorPiezas.innerHTML = '';
        
        // Limpiamos las celdas del grid
        for (var i = 0; i < celdasGrid.length; i++) {
            celdasGrid[i].innerHTML = '';
            celdasGrid[i].classList.remove('correct');
        }
        
        // Creamos las 8 piezas
        var piezas = [];
        for (var i = 1; i <= totalPiezas; i++) {
            piezas.push(crearPieza(i));
        }
        
        // Las barajamos (mezclamos) para que estén en orden aleatorio
        piezas = barajar(piezas);
        
        // Añadimos las piezas al contenedor
        for (var i = 0; i < piezas.length; i++) {
            contenedorPiezas.appendChild(piezas[i]);
        }
        
        // Ocultamos el mensaje de victoria si estaba mostrado
        mensajeDiv.classList.remove('show');
    }
    
    // ============================================
    // EVENTOS DE DRAG & DROP (RATÓN)
    // ============================================
    
    // Cuando arrastramos sobre una celda
    function sobreCelda(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }
    
    // Cuando entramos en una celda
    function entrarCelda(e) {
        var celda = e.target.closest('.celda-rejilla');
        if (celda) {
            celda.classList.add('drag-over');
        }
    }
    
    // Cuando salimos de una celda
    function salirCelda(e) {
        var celda = e.target.closest('.celda-rejilla');
        if (celda && !celda.contains(e.relatedTarget)) {
            celda.classList.remove('drag-over');
        }
    }
    
    // Cuando soltamos la pieza en una celda
    function soltarPieza(e) {
        e.preventDefault();
        
        var celda = e.target.closest('.celda-rejilla');
        if (celda) {
            celda.classList.remove('drag-over');
            
            // Cogemos el número de la pieza que soltamos
            var numeroPieza = e.dataTransfer.getData('text/plain');
            var numeroEsperado = celda.dataset.pieza;
            
            // Si la celda ya tiene algo, no hacemos nada
            if (!celda.hasChildNodes()) {
                // Buscamos la pieza que se estaba arrastrando
                var piezaArrastrada = document.querySelector('.pieza-puzzle.dragging[data-pieza="' + numeroPieza + '"]');
                
                // Si la pieza es la correcta (número coincide)
                if (numeroPieza === numeroEsperado) {
                    // Clonamos la pieza
                    var clon = piezaArrastrada.cloneNode(true);
                    clon.classList.remove('dragging');
                    clon.draggable = false;
                    clon.style.cursor = 'default';
                    clon.style.position = 'absolute';
                    clon.style.top = '0';
                    clon.style.left = '0';
                    clon.style.width = '100%';
                    clon.style.height = '100%';
                    clon.style.border = 'none';
                    clon.style.borderRadius = '0';
                    clon.style.transform = 'none';
                    
                    // Ponemos la pieza en la celda
                    celda.appendChild(clon);
                    
                    // Eliminamos la pieza del contenedor original
                    piezaArrastrada.remove();
                    
                    // Marcamos la celda como correcta
                    celda.classList.add('correct');
                    piezasColocadas.push(numeroPieza);
                    
                    // Reproducimos sonido de splat
                    var audio = new Audio('sounds/splat.mp3');
                    audio.volume = 0.5;
                    audio.play().catch(function() {});
                    
                    // Si todas las piezas están colocadas, ganar
                    if (piezasColocadas.length === totalPiezas) {
                        // Reproducimos sonido de victoria
                        var aplausos = new Audio('sounds/claps.mp3');
                        aplausos.volume = 0.5;
                        aplausos.play().catch(function() {});
                        
                        // Mostramos mensaje después de un pequeño delay
                        setTimeout(function() {
                            mensajeDiv.classList.add('show');
                        }, 300);
                    }
                }
            }
        }
    }

    // Añadimos los eventos a cada celda del grid
    for (var i = 0; i < celdasGrid.length; i++) {
        celdasGrid[i].addEventListener('dragover', sobreCelda);
        celdasGrid[i].addEventListener('dragenter', entrarCelda);
        celdasGrid[i].addEventListener('dragleave', salirCelda);
        celdasGrid[i].addEventListener('drop', soltarPieza);
    }
    
    // ============================================
    // TOUCH PARA MÓVILES (ARRASTRAR CON EL DEDO)
    // ============================================
    var piezaTouch = null;      // Pieza que se está tocando
    var clonTouch = null;       // Clon de la pieza que se mueve
    var offsetX = 0;            // Offset horizontal
    var offsetY = 0;            // Offset vertical
    
    // Empezar a tocar una pieza
    function iniciarTouch(e) {
        e.preventDefault();
        
        var toque = e.touches[0];
        var pieza = e.target.closest('.pieza-puzzle');
        
        // Si es una pieza válida y no está colocada
        if (pieza && !pieza.parentElement.classList.contains('celda-rejilla')) {
            piezaTouch = pieza;
            var rect = pieza.getBoundingClientRect();
            offsetX = toque.clientX - rect.left;
            offsetY = toque.clientY - rect.top;
            
            // Creamos un clon para ver mientras arrastramos
            clonTouch = pieza.cloneNode(true);
            clonTouch.classList.add('dragging');
            clonTouch.style.position = 'fixed';
            clonTouch.style.zIndex = '1000';
            clonTouch.style.width = rect.width + 'px';
            clonTouch.style.height = rect.height + 'px';
            clonTouch.style.pointerEvents = 'none';
            document.body.appendChild(clonTouch);
            
            // Posicionamos el clon donde está el dedo
            clonTouch.style.left = (toque.clientX - offsetX) + 'px';
            clonTouch.style.top = (toque.clientY - offsetY) + 'px';
            
            // Hacemos la pieza original más transparente
            pieza.style.opacity = '0.5';
            
            // Escuchamos movimiento y fin del toque
            document.addEventListener('touchmove', moverTouch, { passive: false });
            document.addEventListener('touchend', terminarTouch);
        }
    }
    
    // Mover el dedo por la pantalla
    function moverTouch(e) {
        e.preventDefault();
        if (clonTouch && piezaTouch) {
            var toque = e.touches[0];
            clonTouch.style.left = (toque.clientX - offsetX) + 'px';
            clonTouch.style.top = (toque.clientY - offsetY) + 'px';
            
            // Quitamos marca de todas las celdas
            for (var i = 0; i < celdasGrid.length; i++) {
                celdasGrid[i].classList.remove('drag-over');
            }
            
            // Vemos qué hay bajo el dedo
            var elemento = document.elementFromPoint(toque.clientX, toque.clientY);
            var celda = elemento ? elemento.closest('.celda-rejilla') : null;
            if (celda) {
                celda.classList.add('drag-over');
            }
        }
    }
    
    // Terminar de tocar (soltar la pieza)
    function terminarTouch(e) {
        e.preventDefault();
        
        document.removeEventListener('touchmove', moverTouch);
        document.removeEventListener('touchend', terminarTouch);
        
        if (clonTouch && piezaTouch) {
            var toque = e.changedTouches[0];
            var elemento = document.elementFromPoint(toque.clientX, toque.clientY);
            var celda = elemento ? elemento.closest('.celda-rejilla') : null;
            
            // Si soltamos sobre una celda vacía
            if (celda && !celda.hasChildNodes()) {
                var numeroPieza = piezaTouch.dataset.pieza;
                var numeroEsperado = celda.dataset.pieza;
                
                // Si es la pieza correcta
                if (numeroPieza === numeroEsperado) {
                    var clon = piezaTouch.cloneNode(true);
                    clon.classList.remove('dragging');
                    clon.draggable = false;
                    clon.style.cursor = 'default';
                    clon.style.position = 'absolute';
                    clon.style.top = '0';
                    clon.style.left = '0';
                    clon.style.width = '100%';
                    clon.style.height = '100%';
                    clon.style.border = 'none';
                    clon.style.borderRadius = '0';
                    clon.style.transform = 'none';
                    
                    celda.appendChild(clon);
                    piezaTouch.remove();
                    
                    celda.classList.add('correct');
                    piezasColocadas.push(numeroPieza);
                    
                    // Sonido de splat
                    var audio = new Audio('sounds/splat.mp3');
                    audio.volume = 0.5;
                    audio.play().catch(function() {});
                    
                    // Victoria
                    if (piezasColocadas.length === totalPiezas) {
                        var aplausos = new Audio('sounds/claps.mp3');
                        aplausos.volume = 0.5;
                        aplausos.play().catch(function() {});
                        
                        setTimeout(function() {
                            mensajeDiv.classList.add('show');
                        }, 300);
                    }
                } else {
                    // Piece was wrong, restore opacity
                    piezaTouch.style.opacity = '1';
                }
            } else {
                // Suelto en otro sitio, restaurar
                piezaTouch.style.opacity = '1';
            }
            
            // Limpiamos
            if (clonTouch) {
                clonTouch.remove();
                clonTouch = null;
            }
            piezaTouch = null;
            
            for (var i = 0; i < celdasGrid.length; i++) {
                celdasGrid[i].classList.remove('drag-over');
            }
        }
    }
    
    // ============================================
    // BOTÓN DE MÚSICA
    // ============================================
    botonMusica.addEventListener('click', function(e) {
        e.stopPropagation();
        
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
    botonReiniciar.addEventListener('click', iniciarJuego);
    
    // INICIAMOS EL JUEGO AL CARGAR
    iniciarJuego();
});
