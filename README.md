# 🎭 ROBLOX FE EMOTES HUB (Filtering Enabled)

Un **Hub de Emotes** moderno, intuitivo y completo para Roblox y Web, diseñado cumpliendo al 100% con todos los requisitos solicitados:

1. **Hub Grande y Personalizable:**
   - Ventana amplia y espaciosa con estética moderna de Roblox (esquinas redondeadas, modo oscuro y efecto neón).
   - **Botón de Cambio de Color:** Permite alternar de forma dinámica entre **8 temas de color vibrantes** (Neón Violeta, Cyber Cyan, Verde Esmeralda, Naranja Fuego, Rojo Carmesí, Azul Real, Cyberpunk Rosa y Dorado Mítico).
   - **Botón para Abrir / Cerrar:** Botón flotante estilizado accesible en todo momento + soporte para la tecla de atajo rápido **[K]**.
   - Soporte para arrastrar (Drag) la ventana y el botón flotante en Roblox.

2. **Emotes y Cuadrícula (8 por fila):**
   - Más de **64 emotes populares de Roblox** organizados en botones pequeños.
   - Distribución exacta de **8 emotes por fila** tanto en la versión Lua de Roblox (`UIGridLayout`) como en la versión Web (`grid-template-columns: repeat(8, minmax(0, 1fr))`).
   - **Equipamiento Inmediato (FE):** Al hacer clic o tocar el emote se equipa y se reproduce la animación de inmediato.
   - **100% Filtering Enabled (FE):** Las animaciones cargadas mediante el `Animator` del personaje se replican automáticamente para que todos los jugadores en el servidor puedan ver tus bailes y poses.
   - Al tocar nuevamente el emote equipado, se desequipa / detiene la animación. También incluye un botón dedicado **"⏹️ Parar Emote / Desequipar"**.

3. **Sistema de Favoritos (⭐):**
   - Cada botón de emote cuenta con una pequeña **estrellita (⭐)** en su esquina superior derecha.
   - Al tocar la estrellita, se agrega o quita inmediatamente de Favoritos sin activar ni equipar el emote.
   - **Pestaña / Sección de Favoritos:** Permite ver exclusivamente tus emotes favoritos en la cuadrícula de 8 por fila, con contador en tiempo real.

---

## 📁 Estructura del Proyecto

```
EMOTES-GUI/
├── EmotesHub.lua       # Script completo en Luau para Roblox (Studio / Executors)
├── index.html          # Interfaz Web interactiva del Hub de Emotes
├── styles.css          # Estilos CSS con las 8 paletas de colores y cuadrícula de 8 columnas
├── app.js             # Lógica interactiva: favoritos, equipar, temas, sonidos, filtros
├── avatar.js          # Simulador procedural de avatar de Roblox en Canvas 2D
├── server.js          # Servidor Node.js para la vista previa en vivo (0.0.0.0:3000)
└── README.md          # Documentación detallada
```

---

## 🚀 Cómo Usar en Roblox (Script FE)

El archivo `EmotesHub.lua` es totalmente autónomo y no requiere dependencias externas.

### Opción A: En Roblox Studio
1. Abre tu lugar de juego en **Roblox Studio**.
2. Dirígete al Explorador (`Explorer`) y busca la carpeta `StarterPlayer` > `StarterPlayerScripts` (o en `StarterGui`).
3. Añade un nuevo **`LocalScript`**.
4. Pega el contenido de `EmotesHub.lua` dentro del `LocalScript`.
5. Pulsa **Play** (F5). La interfaz aparecerá automáticamente en pantalla y se abrirá/cerrará con el botón flotante o la tecla **K**.

### Opción B: Mediante Script Executor (Solara, Wave, Delta, Hydrogen, etc.)
1. Entra a cualquier juego de Roblox con soporte R15 o R6.
2. Abre tu ejecutor de scripts preferido.
3. Copia y pega el código completo de `EmotesHub.lua` y presiona **Execute / Inject**.
4. ¡Listo! El Hub se inyectará de forma segura en `CoreGui` (o `PlayerGui`).

---

## 🎨 Paletas de Color Disponibles (8 Temas)

Puedes alternar los colores haciendo clic en el botón **"🎨 Color: [Nombre]"** dentro del header del Hub:
1. **Neón Violeta** (Predeterminado)
2. **Cyber Cyan**
3. **Verde Esmeralda**
4. **Naranja Fuego**
5. **Rojo Carmesí**
6. **Azul Real**
7. **Cyberpunk Rosa**
8. **Dorado Mítico**

---

## 🕺 Lista de Emotes Incluidos (64 Emotes FE)

| # | Emote | ID de Animación | Tipo |
|---|---|---|---|
| 1 | Floss Dance 💃 | `5917570207` | Bucle |
| 2 | Dance 1 🕺 | `507771019` | Bucle |
| 3 | Dance 2 🎶 | `507771955` | Bucle |
| 4 | Dance 3 🎵 | `507772104` | Bucle |
| 5 | Hype Dance ⚡ | `3696757129` | Bucle |
| 6 | Side to Side ↔️ | `3762641826` | Bucle |
| 7 | Top Rock 👟 | `3570535774` | Bucle |
| 8 | Dorky Dance 🤪 | `4212499637` | Bucle |
| 9 | Baby Dance 👶 | `4272484885` | Bucle |
| 10 | Line Dance 🤠 | `4049037604` | Bucle |
| 11 | Old Town 🐎 | `5938394742` | Bucle |
| 12 | Robot 🤖 | `3338025566` | Bucle |
| 13 | Twist 🌪️ | `3338042785` | Bucle |
| 14 | Arm Wave 🌊 | `3334946789` | Bucle |
| 15 | Monkey 🐒 | `3333495152` | Bucle |
| 16 | Jumping Jacks 🤸 | `3338066761` | Bucle |
| 17 | Wave 👋 | `507770239` | Gesto |
| 18 | Cheer 🎉 | `507770677` | Gesto |
| 19 | Point 👉 | `507770453` | Gesto |
| 20 | Laugh 😂 | `507770818` | Gesto |
| 21 | Shrug 🤷 | `3360692915` | Gesto |
| 22 | Tilt 📐 | `3360686498` | Gesto |
| 23 | Stadium 🏟️ | `3360689775` | Gesto |
| 24 | Hero Pose 🦸 | `3823158757` | Bucle |
| 25 | Godlike ✨ | `3303162756` | Bucle |
| 26 | Zombie 🧟 | `3576686195` | Bucle |
| 27 | Applaud 👏 | `3338010159` | Bucle |
| 28 | Sneaky 🥷 | `3338034509` | Bucle |
| 29 | Hello 🙋 | `3344650532` | Gesto |
| 30 | T-Pose 🧍 | `3338077874` | Bucle |
| 31 | Sleep 💤 | `4686925241` | Bucle |
| 32 | Spin 🌀 | `3303391864` | Bucle |
| 33 | Sturdy Dance 🔥 | `17746270218` | Bucle |
| 34 | Breakdance 🤸‍♂️ | `3570535774` | Bucle |
| 35 | Moonwalk 🌙 | `4212499637` | Bucle |
| 36 | Shuffle 🔀 | `3762641826` | Bucle |
| 37 | Backflip 🔄 | `3823158757` | Gesto |
| 38 | Headspin 💫 | `3570535774` | Bucle |
| 39 | Electro Shuffle ⚡ | `3696757129` | Bucle |
| 40 | Carlton Dance 🕺 | `4049037604` | Bucle |
| 41 | Orange Justice 🍊 | `5917570207` | Bucle |
| 42 | Take The L 🤡 | `507770453` | Gesto |
| 43 | Smooth Moves 🕶️ | `3762641826` | Bucle |
| 44 | Pop Dance 🍿 | `3338042785` | Bucle |
| 45 | B-Boy 🧢 | `3570535774` | Bucle |
| 46 | Dab 🙅‍♂️ | `3360686498` | Gesto |
| 47 | Facepalm 🤦 | `3360692915` | Gesto |
| 48 | Confused ❓ | `3360686498` | Gesto |
| 49 | Cry 😭 | `507770818` | Gesto |
| 50 | Flex 💪 | `3823158757` | Bucle |
| 51 | Respect 🫡 | `3360689775` | Gesto |
| 52 | Bow 🙇 | `3344650532` | Gesto |
| 53 | RPS ✊ | `507770453` | Gesto |
| 54 | Victory Dance 🏆 | `507771019` | Bucle |
| 55 | High Five ✋ | `507770239` | Gesto |
| 56 | Air Guitar 🎸 | `3338042785` | Bucle |
| 57 | Silly Dance 😜 | `4212499637` | Bucle |
| 58 | Ninja Pose ⚔️ | `3823158757` | Bucle |
| 59 | Mind Blown 🤯 | `3360692915` | Gesto |
| 60 | Heart Sign 🫶 | `507770677` | Gesto |
| 61 | Chicken Dance 🐔 | `3333495152` | Bucle |
| 62 | Disco Fever 🪩 | `507771955` | Bucle |
| 63 | Salute 🎖️ | `3360689775` | Gesto |
| 64 | Champion Pose 👑 | `3823158757` | Bucle |

---

## ⚡ Explicación Técnica: ¿Por qué es FE (Filtering Enabled)?

En Roblox con **FilteringEnabled** (activado por defecto de forma obligatoria en todos los juegos modernos):
- Cuando el cliente carga y reproduce una animación en el objeto `Animator` dentro del `Humanoid` de su propio personaje (`Animator:LoadAnimation(animTrack)`), Roblox **replica automáticamente el estado de reproducción y las transformaciones de las articulaciones (Motor6D) a través de la red hacia el servidor y los demás clientes**.
- Por ello, **todos los demás jugadores ven tu animación** sin necesidad de disparar RemoteEvents inseguros o crear scripts en el servidor.
- La prioridad se establece en `Enum.AnimationPriority.Action4` para garantizar que no sea interrumpida por animaciones de caminar o idle básicas.

---

## 🌐 Vista Previa Interactiva Web

El proyecto incluye una aplicación web completa en vivo con:
- **Simulador de Avatar en Canvas**: Ejecuta proceduralmente los bailes y poses equipados.
- **Efectos de Sonido con Web Audio API**: Sonidos para clics, selección de estrellas ⭐, equipamiento de emotes y desequipamiento.
- **Visor y Copiado de Script**: Botón modal para copiar el código Lua de Roblox con 1 solo clic o descargarlo.
