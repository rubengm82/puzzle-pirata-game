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
            e.preventDefault(); // Cancelar drag nativo
            iniciarArrastreRaton(e, pieza);
        });
        
        // Evento cuando termina de arrastrar
        pieza.addEventListener('dragend', function(e) {
            e.preventDefault();
            terminarArrastreRaton(e);
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
    
    // ====================================
    // EVENTOS DE DRAG & DROP (RATÓN)
    // ============================================
    
    var piezaRaton = null;
    var celdaOrigen = null;
    var rectOriginal = null;
    
    function iniciarArrastreRaton(e, pieza) {
        piezaRaton = pieza;
        celdaOrigen = pieza.parentElement;
        rectOriginal = pieza.getBoundingClientRect();
        
        // Cambiar a fixed
        pieza.style.position = 'fixed';
        pieza.style.left = rectOriginal.left + 'px';
        pieza.style.top = rectOriginal.top + 'px';
        pieza.style.zIndex = '1000';
        pieza.style.width = rectOriginal.width + 'px';
        pieza.style.height = rectOriginal.height + 'px';
        pieza.style.margin = '0';
        pieza.style.transform = 'translate3d(0,0,0)';
        pieza.style.pointerEvents = 'none';
        document.body.appendChild(pieza);
        
        // Mover al cursor
        moverAPiezaRaton(e.clientX, e.clientY);
        
        // Eventos globales
        document.addEventListener('mousemove', moverRaton);
        document.addEventListener('mouseup', terminarArrastreRaton);
    }
    
    function moverRaton(e) {
        if (piezaRaton) {
            moverAPiezaRaton(e.clientX, e.clientY);
        }
    }
    
    function moverAPiezaRaton(x, y) {
        if (piezaRaton) {
            piezaRaton.style.left = (x - piezaRaton.offsetWidth / 2) + 'px';
            piezaRaton.style.top = (y - piezaRaton.offsetHeight / 2) + 'px';
        }
    }
    
    function terminarArrastreRaton(e) {
        document.removeEventListener('mousemove', moverRaton);
        document.removeEventListener('mouseup', terminarArrastreRaton);
        
        if (piezaRaton) {
            var elemento = document.elementFromPoint(e.clientX, e.clientY);
            var celda = elemento ? elemento.closest('.celda-rejilla') : null;
            
            if (celda && !celda.hasChildNodes()) {
                var numeroPieza = piezaRaton.dataset.pieza;
                var numeroEsperado = celda.dataset.pieza;
                
                if (numeroPieza === numeroEsperado) {
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
                    
                    celda.classList.add('correct');
                    piezasColocadas.push(numeroPieza);
                    
                    // Sonido
                    var audio = new Audio('sounds/splat.mp3');
                    audio.volume = 0.5;
                    audio.play().catch(function() {});
                    
                    if (piezasColocadas.length === totalPiezas) {
                        var aplausos = new Audio('sounds/claps.mp3');
                        aplausos.volume = 0.5;
                        aplausos.play().catch(function() {});
                        setTimeout(function() {
                            mensajeDiv.classList.add('show');
                        }, 300);
                    }
                } else {
                    devolverRatonOrigen();
                }
            } else {
                devolverRatonOrigen();
            }
            
            piezaRaton = null;
            celdaOrigen = null;
            rectOriginal = null;
        }
    }
    
    function devolverRatonOrigen() {
        if (piezaRaton && celdaOrigen) {
            piezaRaton.style.position = '';
            piezaRaton.style.left = '';
            piezaRaton.style.top = '';
            piezaRaton.style.zIndex = '';
            piezaRaton.style.width = '';
            piezaRaton.style.height = '';
            piezaRaton.style.margin = '';
            piezaRaton.style.transform = '';
            piezaRaton.style.pointerEvents = '';
            celdaOrigen.appendChild(piezaRaton);
        }
    }
    
    // ============================================
    // TOUCH PARA MÓVILES (ARRASTRAR CON EL DEDO)
    // ============================================
    // Variables para touch
    var piezaTouch = null;
    var celdaOriginal = null;
    var xOriginal = 0;
    var yOriginal = 0;
    
    // Empezar a tocar una pieza
    function iniciarTouch(e) {
        e.preventDefault();
        
        var toque = e.touches[0];
        var pieza = e.target.closest('.pieza-puzzle');
        
        if (pieza && !pieza.parentElement.classList.contains('celda-rejilla')) {
            piezaTouch = pieza;
            celdaOriginal = pieza.parentElement;
            
            // Posición actual
            var rect = pieza.getBoundingClientRect();
            xOriginal = toque.clientX;
            yOriginal = toque.clientY;
            
            // Cambiar a fixed
            pieza.style.position = 'fixed';
            pieza.style.left = rect.left + 'px';
            pieza.style.top = rect.top + 'px';
            pieza.style.zIndex = '1000';
            pieza.style.width = rect.width + 'px';
            pieza.style.height = rect.height + 'px';
            pieza.style.margin = '0';
            pieza.style.transform = 'translate3d(0,0,0)';
            pieza.style.transition = 'none';
            pieza.style.pointerEvents = 'none'; // Permite detectar celda bajo el dedo
            document.body.appendChild(pieza);
            
            // Mover al dedo
            pieza.style.left = (toque.clientX - rect.width / 2) + 'px';
            pieza.style.top = (toque.clientY - rect.height / 2) + 'px';
            
            document.addEventListener('touchmove', moverTouch, { passive: false });
            document.addEventListener('touchend', terminarTouch);
        }
    }
    
    // Mover el dedo
    function moverTouch(e) {
        e.preventDefault();
        
        if (piezaTouch) {
            var toque = e.touches[0];
            piezaTouch.style.left = (toque.clientX - piezaTouch.offsetWidth / 2) + 'px';
            piezaTouch.style.top = (toque.clientY - piezaTouch.offsetHeight / 2) + 'px';
        }
    }
    
    // Terminar de tocar
    function terminarTouch(e) {
        e.preventDefault();
        
        document.removeEventListener('touchmove', moverTouch);
        document.removeEventListener('touchend', terminarTouch);
        
        if (piezaTouch) {
            var toque = e.changedTouches[0];
            var elemento = document.elementFromPoint(toque.clientX, toque.clientY);
            var celda = elemento ? elemento.closest('.celda-rejilla') : null;
            
            if (celda && !celda.hasChildNodes()) {
                var numeroPieza = piezaTouch.dataset.pieza;
                var numeroEsperado = celda.dataset.pieza;
                
                if (numeroPieza === numeroEsperado) {
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
                    
                    celda.classList.add('correct');
                    piezasColocadas.push(numeroPieza);
                    
                    // Sonido
                    var audio = new Audio('sounds/splat.mp3');
                    audio.volume = 0.5;
                    audio.play().catch(function() {});
                    
                    if (piezasColocadas.length === totalPiezas) {
                        var aplausos = new Audio('sounds/claps.mp3');
                        aplausos.volume = 0.5;
                        aplausos.play().catch(function() {});
                        setTimeout(function() {
                            mensajeDiv.classList.add('show');
                        }, 300);
                    }
                } else {
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
            
            piezaTouch = null;
            celdaOriginal = null;
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
