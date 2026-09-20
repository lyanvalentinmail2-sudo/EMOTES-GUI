--[[
    ===================================================================
    🔥 ROBLOX FE EMOTES HUB (Filtering Enabled) 🔥
    ===================================================================
    Características:
      - Hub Grande con diseño moderno y soporte para arrastrar (Drag).
      - Botón para Cambiar de Color (8 Temas vibrantes: Neón, Cyan, etc.).
      - Botón flotante para Abrir / Cerrar el Hub (con atajo de teclado [K]).
      - Botones de emotes pequeños distribuidos exactamente a 8 POR FILA.
      - Al tocar un emote se EQUIPA y reproduce (100% FE para que todos lo vean).
      - Tocar de nuevo el emote equipado lo desequipa / para la animación.
      - Estrellita (⭐) en cada emote para marcarlo como FAVORITO.
      - Sección / Pestaña exclusiva de "Favoritos".
      - Barra de búsqueda rápida de emotes en tiempo real.
      - Compatible tanto con Roblox Studio (StarterGui/StarterPlayerScripts)
        como con cualquier Executor (Solara, Wave, Delta, Hydrogen, etc.).
    ===================================================================
]]--

local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")
local UserInputService = game:GetService("UserInputService")
local RunService = game:GetService("RunService")
local CoreGui = game:GetService("CoreGui")

local LocalPlayer = Players.LocalPlayer

-- Determinar el contenedor adecuado (CoreGui para executors como Delta, PlayerGui para Studio)
local targetParent
local successCore = pcall(function()
    local test = Instance.new("Folder")
    test.Parent = CoreGui
    test:Destroy()
end)

if successCore then
    targetParent = CoreGui
else
    targetParent = LocalPlayer:WaitForChild("PlayerGui")
end

-- Limpiar instancia anterior si existe
local existingGui = targetParent:FindFirstChild("FE_EmotesHub_ScreenGui")
if existingGui then
    existingGui:Destroy()
end

local camera = workspace.CurrentCamera
local isTouchDevice = UserInputService.TouchEnabled and not UserInputService.KeyboardEnabled

-- Notificación al cargar en Delta
pcall(function()
    game:GetService("StarterGui"):SetCore("SendNotification", {
        Title = "🎭 FE Emotes Hub";
        Text = "¡Cargado con éxito en Delta! Toca el botón flotante para abrir/cerrar.";
        Duration = 4;
    })
end)

-- ===================================================================
-- PALETAS DE COLORES (8 TEMAS)
-- ===================================================================
local THEMES = {
    {
        name = "Neón Violeta",
        primary = Color3.fromRGB(138, 43, 226),
        secondary = Color3.fromRGB(168, 85, 247),
        accent = Color3.fromRGB(216, 180, 254),
        background = Color3.fromRGB(18, 14, 28),
        card = Color3.fromRGB(28, 22, 44),
        cardHover = Color3.fromRGB(45, 34, 72)
    },
    {
        name = "Cyber Cyan",
        primary = Color3.fromRGB(6, 182, 212),
        secondary = Color3.fromRGB(34, 211, 238),
        accent = Color3.fromRGB(165, 243, 252),
        background = Color3.fromRGB(10, 22, 30),
        card = Color3.fromRGB(16, 36, 48),
        cardHover = Color3.fromRGB(24, 54, 72)
    },
    {
        name = "Verde Esmeralda",
        primary = Color3.fromRGB(16, 185, 129),
        secondary = Color3.fromRGB(52, 211, 153),
        accent = Color3.fromRGB(167, 243, 208),
        background = Color3.fromRGB(10, 26, 20),
        card = Color3.fromRGB(18, 42, 32),
        cardHover = Color3.fromRGB(28, 64, 48)
    },
    {
        name = "Naranja Fuego",
        primary = Color3.fromRGB(249, 115, 22),
        secondary = Color3.fromRGB(251, 146, 60),
        accent = Color3.fromRGB(254, 215, 170),
        background = Color3.fromRGB(28, 16, 10),
        card = Color3.fromRGB(44, 24, 16),
        cardHover = Color3.fromRGB(68, 38, 24)
    },
    {
        name = "Rojo Carmesí",
        primary = Color3.fromRGB(225, 29, 72),
        secondary = Color3.fromRGB(244, 63, 94),
        accent = Color3.fromRGB(254, 205, 211),
        background = Color3.fromRGB(28, 12, 16),
        card = Color3.fromRGB(44, 18, 24),
        cardHover = Color3.fromRGB(68, 28, 38)
    },
    {
        name = "Azul Real",
        primary = Color3.fromRGB(37, 99, 235),
        secondary = Color3.fromRGB(96, 165, 250),
        accent = Color3.fromRGB(191, 219, 254),
        background = Color3.fromRGB(12, 18, 32),
        card = Color3.fromRGB(20, 30, 52),
        cardHover = Color3.fromRGB(32, 48, 82)
    },
    {
        name = "Cyberpunk Rosa",
        primary = Color3.fromRGB(236, 72, 153),
        secondary = Color3.fromRGB(244, 114, 182),
        accent = Color3.fromRGB(251, 207, 232),
        background = Color3.fromRGB(28, 12, 24),
        card = Color3.fromRGB(44, 20, 38),
        cardHover = Color3.fromRGB(68, 32, 58)
    },
    {
        name = "Dorado Mítico",
        primary = Color3.fromRGB(217, 119, 6),
        secondary = Color3.fromRGB(245, 158, 11),
        accent = Color3.fromRGB(253, 230, 138),
        background = Color3.fromRGB(28, 22, 10),
        card = Color3.fromRGB(44, 34, 16),
        cardHover = Color3.fromRGB(68, 52, 24)
    }
}

local currentThemeIndex = 1

-- ===================================================================
-- LISTA DE 64 EMOTES POPULARES (FE / ANIMATION IDS)
-- ===================================================================
local EMOTES_DATA = {
    { id = "5917570207", name = "Floss", icon = "💃", looped = true },
    { id = "507771019",  name = "Dance 1", icon = "🕺", looped = true },
    { id = "507771955",  name = "Dance 2", icon = "🎶", looped = true },
    { id = "507772104",  name = "Dance 3", icon = "🎵", looped = true },
    { id = "3696757129", name = "Hype", icon = "⚡", looped = true },
    { id = "3762641826", name = "Side 2 Side", icon = "↔️", looped = true },
    { id = "3570535774", name = "Top Rock", icon = "👟", looped = true },
    { id = "4212499637", name = "Dorky", icon = "🤪", looped = true },
    { id = "4272484885", name = "Baby Dance", icon = "👶", looped = true },
    { id = "4049037604", name = "Line Dance", icon = "🤠", looped = true },
    { id = "5938394742", name = "Old Town", icon = "🐎", looped = true },
    { id = "3338025566", name = "Robot", icon = "🤖", looped = true },
    { id = "3338042785", name = "Twist", icon = "🌪️", looped = true },
    { id = "3334946789", name = "Arm Wave", icon = "🌊", looped = true },
    { id = "3333495152", name = "Monkey", icon = "🐒", looped = true },
    { id = "3338066761", name = "Jumping Jacks", icon = "🤸", looped = true },
    { id = "507770239",  name = "Wave", icon = "👋", looped = false },
    { id = "507770677",  name = "Cheer", icon = "🎉", looped = false },
    { id = "507770453",  name = "Point", icon = "👉", looped = false },
    { id = "507770818",  name = "Laugh", icon = "😂", looped = false },
    { id = "3360692915", name = "Shrug", icon = "🤷", looped = false },
    { id = "3360686498", name = "Tilt", icon = "📐", looped = false },
    { id = "3360689775", name = "Stadium", icon = "🏟️", looped = false },
    { id = "3823158757", name = "Hero Pose", icon = "🦸", looped = true },
    { id = "3303162756", name = "Godlike", icon = "✨", looped = true },
    { id = "3576686195", name = "Zombie", icon = "🧟", looped = true },
    { id = "3338010159", name = "Applaud", icon = "👏", looped = true },
    { id = "3338034509", name = "Sneaky", icon = "🥷", looped = true },
    { id = "3344650532", name = "Hello", icon = "🙋", looped = false },
    { id = "3338077874", name = "T-Pose", icon = "🧍", looped = true },
    { id = "4686925241", name = "Sleep", icon = "💤", looped = true },
    { id = "3303391864", name = "Spin", icon = "🌀", looped = true },
    { id = "17746270218", name = "Sturdy", icon = "🔥", looped = true },
    { id = "3570535774", name = "Breakdance", icon = "🤸‍♂️", looped = true },
    { id = "4212499637", name = "Moonwalk", icon = "🌙", looped = true },
    { id = "3762641826", name = "Shuffle", icon = "🔀", looped = true },
    { id = "3823158757", name = "Backflip", icon = "🔄", looped = false },
    { id = "3570535774", name = "Headspin", icon = "💫", looped = true },
    { id = "3696757129", name = "Electro", icon = "⚡", looped = true },
    { id = "4049037604", name = "Carlton", icon = "🕺", looped = true },
    { id = "5917570207", name = "Orange Just.", icon = "🍊", looped = true },
    { id = "507770453",  name = "Take The L", icon = "🤡", looped = false },
    { id = "3762641826", name = "Smooth Move", icon = "🕶️", looped = true },
    { id = "3338042785", name = "Pop Dance", icon = "🍿", looped = true },
    { id = "3570535774", name = "B-Boy", icon = "🧢", looped = true },
    { id = "3360686498", name = "Dab", icon = "🙅‍♂️", looped = false },
    { id = "3360692915", name = "Facepalm", icon = "🤦", looped = false },
    { id = "3360686498", name = "Confused", icon = "❓", looped = false },
    { id = "507770818",  name = "Cry", icon = "😭", looped = false },
    { id = "3823158757", name = "Flex", icon = "💪", looped = true },
    { id = "3360689775", name = "Respect", icon = "🫡", looped = false },
    { id = "3344650532", name = "Bow", icon = "🙇", looped = false },
    { id = "507770453",  name = "RPS", icon = "✊", looped = false },
    { id = "507771019",  name = "Victory", icon = "🏆", looped = true },
    { id = "507770239",  name = "High Five", icon = "✋", looped = false },
    { id = "3338042785", name = "Air Guitar", icon = "🎸", looped = true },
    { id = "4212499637", name = "Silly Dance", icon = "😜", looped = true },
    { id = "3823158757", name = "Ninja Pose", icon = "⚔️", looped = true },
    { id = "3360692915", name = "Mind Blown", icon = "🤯", looped = false },
    { id = "507770677",  name = "Heart Sign", icon = "🫶", looped = false },
    { id = "3333495152", name = "Chicken", icon = "🐔", looped = true },
    { id = "507771955",  name = "Disco", icon = "🪩", looped = true },
    { id = "3360689775", name = "Salute", icon = "🎖️", looped = false },
    { id = "3823158757", name = "Champion", icon = "👑", looped = true }
}

-- Estado de Favoritos (ID -> true)
local favorites = {
    ["5917570207"] = true, -- Floss por defecto en favoritos
    ["507771019"] = true,  -- Dance 1 por defecto
}

local currentTab = "todos" -- "todos" o "favoritos"
local searchQuery = ""
local equippedEmote = nil
local currentAnimationTrack = nil

-- ===================================================================
-- CREACIÓN DE LA INTERFAZ (ScreenGui)
-- ===================================================================
local ScreenGui = Instance.new("ScreenGui")
ScreenGui.Name = "FE_EmotesHub_ScreenGui"
ScreenGui.ResetOnSpawn = false
ScreenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
ScreenGui.Parent = targetParent

-- ===================================================================
-- BOTÓN FLOTANTE PARA ABRIR / CERRAR EL HUB
-- ===================================================================
local ToggleButton = Instance.new("TextButton")
ToggleButton.Name = "ToggleButton"
ToggleButton.Size = UDim2.new(0, 160, 0, 44)
ToggleButton.Position = UDim2.new(0, 20, 0, 80)
ToggleButton.BackgroundColor3 = THEMES[currentThemeIndex].primary
ToggleButton.Text = "🎭 Emotes Hub [K]"
ToggleButton.TextColor3 = Color3.fromRGB(255, 255, 255)
ToggleButton.Font = Enum.Font.GothamBold
ToggleButton.TextSize = 14
ToggleButton.AutoButtonColor = false
ToggleButton.Parent = ScreenGui

local ToggleCorner = Instance.new("UICorner")
ToggleCorner.CornerRadius = UDim.new(0, 12)
ToggleCorner.Parent = ToggleButton

local ToggleStroke = Instance.new("UIStroke")
ToggleStroke.Color = THEMES[currentThemeIndex].secondary
ToggleStroke.Thickness = 2
ToggleStroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
ToggleStroke.Parent = ToggleButton

-- ===================================================================
-- CONTENEDOR PRINCIPAL: HUB GRANDE (ADAPTATIVO PARA DELTA MÓVIL Y PC)
-- ===================================================================
local function getResponsiveHubDimensions()
    local vp = (workspace.CurrentCamera and workspace.CurrentCamera.ViewportSize) or Vector2.new(1024, 768)
    local hubW = math.clamp(vp.X - 30, 340, 840)
    local hubH = math.clamp(vp.Y - 30, 300, 560)
    return hubW, hubH
end

local initW, initH = getResponsiveHubDimensions()

local MainHub = Instance.new("Frame")
MainHub.Name = "MainHub"
MainHub.Size = UDim2.new(0, initW, 0, initH)
MainHub.Position = UDim2.new(0.5, -math.floor(initW / 2), 0.5, -math.floor(initH / 2))
MainHub.BackgroundColor3 = THEMES[currentThemeIndex].background
MainHub.BorderSizePixel = 0
MainHub.ClipsDescendants = true
MainHub.Parent = ScreenGui

local MainCorner = Instance.new("UICorner")
MainCorner.CornerRadius = UDim.new(0, 16)
MainCorner.Parent = MainHub

local MainStroke = Instance.new("UIStroke")
MainStroke.Color = THEMES[currentThemeIndex].primary
MainStroke.Thickness = 2
MainStroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
MainStroke.Parent = MainHub

-- ===================================================================
-- BARRA SUPERIOR (HEADER)
-- ===================================================================
local Header = Instance.new("Frame")
Header.Name = "Header"
Header.Size = UDim2.new(1, 0, 0, 60)
Header.BackgroundColor3 = THEMES[currentThemeIndex].card
Header.BorderSizePixel = 0
Header.Parent = MainHub

local HeaderCorner = Instance.new("UICorner")
HeaderCorner.CornerRadius = UDim.new(0, 16)
HeaderCorner.Parent = Header

-- Parche para esquinas inferiores del header
local HeaderBottomPatch = Instance.new("Frame")
HeaderBottomPatch.Size = UDim2.new(1, 0, 0, 16)
HeaderBottomPatch.Position = UDim2.new(0, 0, 1, -16)
HeaderBottomPatch.BackgroundColor3 = THEMES[currentThemeIndex].card
HeaderBottomPatch.BorderSizePixel = 0
HeaderBottomPatch.Parent = Header

-- Título del Hub
local TitleLabel = Instance.new("TextLabel")
TitleLabel.Name = "TitleLabel"
TitleLabel.Size = UDim2.new(0, 300, 1, 0)
TitleLabel.Position = UDim2.new(0, 20, 0, 0)
TitleLabel.BackgroundTransparency = 1
TitleLabel.Text = "🎭 HUB DE EMOTES <font color=\"#22d3ee\">FE</font>"
TitleLabel.RichText = true
TitleLabel.Font = Enum.Font.GothamBlack
TitleLabel.TextSize = 20
TitleLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
TitleLabel.TextXAlignment = Enum.TextXAlignment.Left
TitleLabel.Parent = Header

-- Botón para Cambiar de Color
local ColorThemeButton = Instance.new("TextButton")
ColorThemeButton.Name = "ColorThemeButton"
ColorThemeButton.Size = UDim2.new(0, 150, 0, 36)
ColorThemeButton.Position = UDim2.new(1, -280, 0.5, -18)
ColorThemeButton.BackgroundColor3 = THEMES[currentThemeIndex].primary
ColorThemeButton.Text = "🎨 Color: " .. THEMES[currentThemeIndex].name
ColorThemeButton.TextColor3 = Color3.fromRGB(255, 255, 255)
ColorThemeButton.Font = Enum.Font.GothamBold
ColorThemeButton.TextSize = 12
ColorThemeButton.AutoButtonColor = false
ColorThemeButton.Parent = Header

local ColorBtnCorner = Instance.new("UICorner")
ColorBtnCorner.CornerRadius = UDim.new(0, 8)
ColorBtnCorner.Parent = ColorThemeButton

local ColorBtnStroke = Instance.new("UIStroke")
ColorBtnStroke.Color = Color3.fromRGB(255, 255, 255)
ColorBtnStroke.Thickness = 1
ColorBtnStroke.Transparency = 0.6
ColorBtnStroke.Parent = ColorThemeButton

-- Botón Cerrar [X]
local CloseButton = Instance.new("TextButton")
CloseButton.Name = "CloseButton"
CloseButton.Size = UDim2.new(0, 36, 0, 36)
CloseButton.Position = UDim2.new(1, -56, 0.5, -18)
CloseButton.BackgroundColor3 = Color3.fromRGB(225, 29, 72)
CloseButton.Text = "✕"
CloseButton.TextColor3 = Color3.fromRGB(255, 255, 255)
CloseButton.Font = Enum.Font.GothamBold
CloseButton.TextSize = 16
CloseButton.AutoButtonColor = false
CloseButton.Parent = Header

local CloseCorner = Instance.new("UICorner")
CloseCorner.CornerRadius = UDim.new(0, 8)
CloseCorner.Parent = CloseButton

-- ===================================================================
-- BARRA DE CONTROL (PESTAÑAS, BÚSQUEDA Y PARAR EMOTE)
-- ===================================================================
local ControlBar = Instance.new("Frame")
ControlBar.Name = "ControlBar"
ControlBar.Size = UDim2.new(1, -40, 0, 48)
ControlBar.Position = UDim2.new(0, 20, 0, 72)
ControlBar.BackgroundTransparency = 1
ControlBar.Parent = MainHub

-- Pestaña Todos
local TabTodos = Instance.new("TextButton")
TabTodos.Name = "TabTodos"
TabTodos.Size = UDim2.new(0, 120, 0, 38)
TabTodos.Position = UDim2.new(0, 0, 0, 5)
TabTodos.BackgroundColor3 = THEMES[currentThemeIndex].primary
TabTodos.Text = "📁 Todos (" .. #EMOTES_DATA .. ")"
TabTodos.TextColor3 = Color3.fromRGB(255, 255, 255)
TabTodos.Font = Enum.Font.GothamBold
TabTodos.TextSize = 13
TabTodos.Parent = ControlBar

local TabTodosCorner = Instance.new("UICorner")
TabTodosCorner.CornerRadius = UDim.new(0, 8)
TabTodosCorner.Parent = TabTodos

-- Pestaña Favoritos
local TabFavs = Instance.new("TextButton")
TabFavs.Name = "TabFavs"
TabFavs.Size = UDim2.new(0, 130, 0, 38)
TabFavs.Position = UDim2.new(0, 130, 0, 5)
TabFavs.BackgroundColor3 = THEMES[currentThemeIndex].card
TabFavs.Text = "⭐ Favoritos"
TabFavs.TextColor3 = Color3.fromRGB(200, 200, 200)
TabFavs.Font = Enum.Font.GothamBold
TabFavs.TextSize = 13
TabFavs.Parent = ControlBar

local TabFavsCorner = Instance.new("UICorner")
TabFavsCorner.CornerRadius = UDim.new(0, 8)
TabFavsCorner.Parent = TabFavs

-- Barra de Búsqueda
local SearchBox = Instance.new("TextBox")
SearchBox.Name = "SearchBox"
SearchBox.Size = UDim2.new(0, 220, 0, 38)
SearchBox.Position = UDim2.new(0, 270, 0, 5)
SearchBox.BackgroundColor3 = THEMES[currentThemeIndex].card
SearchBox.PlaceholderText = "🔍 Buscar emote..."
SearchBox.PlaceholderColor3 = Color3.fromRGB(150, 150, 150)
SearchBox.Text = ""
SearchBox.TextColor3 = Color3.fromRGB(255, 255, 255)
SearchBox.Font = Enum.Font.Gotham
SearchBox.TextSize = 13
SearchBox.ClearTextOnFocus = false
SearchBox.Parent = ControlBar

local SearchCorner = Instance.new("UICorner")
SearchCorner.CornerRadius = UDim.new(0, 8)
SearchCorner.Parent = SearchBox

local SearchStroke = Instance.new("UIStroke")
SearchStroke.Color = Color3.fromRGB(255, 255, 255)
SearchStroke.Thickness = 1
SearchStroke.Transparency = 0.8
SearchStroke.Parent = SearchBox

-- Botón Desequipar / Parar Emote
local StopButton = Instance.new("TextButton")
StopButton.Name = "StopButton"
StopButton.Size = UDim2.new(0, 160, 0, 38)
StopButton.Position = UDim2.new(1, -160, 0, 5)
StopButton.BackgroundColor3 = Color3.fromRGB(220, 38, 38)
StopButton.Text = "⏹️ Parar Emote"
StopButton.TextColor3 = Color3.fromRGB(255, 255, 255)
StopButton.Font = Enum.Font.GothamBold
StopButton.TextSize = 13
StopButton.Parent = ControlBar

local StopCorner = Instance.new("UICorner")
StopCorner.CornerRadius = UDim.new(0, 8)
StopCorner.Parent = StopButton

-- ===================================================================
-- BARRA DE ESTADO / EMOTE ACTUALMENTE EQUIPADO
-- ===================================================================
local StatusBar = Instance.new("Frame")
StatusBar.Name = "StatusBar"
StatusBar.Size = UDim2.new(1, -40, 0, 34)
StatusBar.Position = UDim2.new(0, 20, 0, 126)
StatusBar.BackgroundColor3 = THEMES[currentThemeIndex].card
StatusBar.BorderSizePixel = 0
StatusBar.Parent = MainHub

local StatusCorner = Instance.new("UICorner")
StatusCorner.CornerRadius = UDim.new(0, 8)
StatusCorner.Parent = StatusBar

local StatusLabel = Instance.new("TextLabel")
StatusLabel.Name = "StatusLabel"
StatusLabel.Size = UDim2.new(1, -20, 1, 0)
StatusLabel.Position = UDim2.new(0, 10, 0, 0)
StatusLabel.BackgroundTransparency = 1
StatusLabel.Text = "Estado: <b>Ningún emote equipado</b> | Haz clic en un emote para equiparlo (FE)"
StatusLabel.RichText = true
StatusLabel.Font = Enum.Font.Gotham
StatusLabel.TextSize = 12
StatusLabel.TextColor3 = Color3.fromRGB(220, 220, 220)
StatusLabel.TextXAlignment = Enum.TextXAlignment.Left
StatusLabel.Parent = StatusBar

-- ===================================================================
-- ÁREA DE SCROLL Y GRID DE 8 EMOTES POR FILA
-- ===================================================================
local ScrollArea = Instance.new("ScrollingFrame")
ScrollArea.Name = "ScrollArea"
-- Tamaño disponible dentro del Hub grande
ScrollArea.Size = UDim2.new(1, -40, 1, -180)
ScrollArea.Position = UDim2.new(0, 20, 0, 168)
ScrollArea.BackgroundTransparency = 1
ScrollArea.BorderSizePixel = 0
ScrollArea.ScrollBarThickness = 6
ScrollArea.ScrollBarImageColor3 = THEMES[currentThemeIndex].primary
ScrollArea.CanvasSize = UDim2.new(0, 0, 0, 0)
ScrollArea.AutomaticCanvasSize = Enum.AutomaticSize.Y
ScrollArea.Parent = MainHub

-- UIGridLayout: configurado con exactitud para 8 botones por fila
-- Calcula automáticamente el tamaño para que SIEMPRE quepan 8 exactos por fila
local function calculateCellDimensions()
    local currentHubW = MainHub.AbsoluteSize.X > 0 and MainHub.AbsoluteSize.X or initW
    local scrollW = math.max(280, currentHubW - 40)
    local padding = 6
    local cellWidth = math.max(34, math.floor((scrollW - (7 * padding) - 12) / 8))
    local cellHeight = math.floor(cellWidth * 0.95)
    return cellWidth, cellHeight, padding
end

local cellW, cellH, pad = calculateCellDimensions()

local GridLayout = Instance.new("UIGridLayout")
GridLayout.Name = "GridLayout"
GridLayout.CellSize = UDim2.new(0, cellW, 0, cellH)
GridLayout.CellPadding = UDim2.new(0, pad, 0, pad)
GridLayout.SortOrder = Enum.SortOrder.LayoutOrder
GridLayout.Parent = ScrollArea

-- Ajustar si la pantalla cambia de orientación (Delta móvil horizontal/vertical)
if camera then
    camera:GetPropertyChangedSignal("ViewportSize"):Connect(function()
        local newW, newH = getResponsiveHubDimensions()
        MainHub.Size = UDim2.new(0, newW, 0, newH)
        local cW, cH, p = calculateCellDimensions()
        GridLayout.CellSize = UDim2.new(0, cW, 0, cH)
        GridLayout.CellPadding = UDim2.new(0, p, 0, p)
    end)
end

local EmptyNotice = Instance.new("TextLabel")
EmptyNotice.Name = "EmptyNotice"
EmptyNotice.Size = UDim2.new(1, 0, 0, 120)
EmptyNotice.Position = UDim2.new(0, 0, 0, 40)
EmptyNotice.BackgroundTransparency = 1
EmptyNotice.Text = "⭐ No tienes emotes en Favoritos todavía.\n¡Haz clic en la estrellita (⭐) de cualquier emote para añadirlo!"
EmptyNotice.Font = Enum.Font.GothamMedium
EmptyNotice.TextSize = 14
EmptyNotice.TextColor3 = Color3.fromRGB(160, 160, 160)
EmptyNotice.Visible = false
EmptyNotice.Parent = ScrollArea

-- Referencias a los botones de emotes instanciados
local emoteButtonsMap = {}

-- ===================================================================
-- LÓGICA FE DE ANIMACIÓN / EQUIPAMIENTO DE EMOTES
-- ===================================================================
local function stopEmote()
    if currentAnimationTrack then
        pcall(function()
            currentAnimationTrack:Stop(0.25)
            currentAnimationTrack:Destroy()
        end)
        currentAnimationTrack = nil
    end
    equippedEmote = nil
    StatusLabel.Text = "Estado: <b>Ningún emote equipado</b> | Selecciona un emote abajo para equiparlo"
    
    -- Limpiar borde iluminado de botones
    for _, btnData in pairs(emoteButtonsMap) do
        if btnData and btnData.stroke then
            btnData.stroke.Color = Color3.fromRGB(255, 255, 255)
            btnData.stroke.Transparency = 0.9
            btnData.stroke.Thickness = 1
        end
    end
end

local function equipEmote(emote)
    -- Si ya está equipado el mismo emote, se desequipa (toggle)
    if equippedEmote and equippedEmote.id == emote.id then
        stopEmote()
        return
    end

    stopEmote()

    local character = LocalPlayer.Character
    if not character then return end

    local humanoid = character:FindFirstChildOfClass("Humanoid")
    if not humanoid then return end

    local animator = humanoid:FindFirstChildOfClass("Animator")
    if not animator then
        animator = Instance.new("Animator")
        animator.Parent = humanoid
    end

    -- En Roblox FE, cargar una animación en el Animator del cliente
    -- se replica automáticamente al servidor y a todos los jugadores.
    local anim = Instance.new("Animation")
    anim.AnimationId = "rbxassetid://" .. emote.id

    local success, track = pcall(function()
        return animator:LoadAnimation(anim)
    end)

    if success and track then
        track.Priority = Enum.AnimationPriority.Action4
        track.Looped = (emote.looped ~= false)
        track:Play(0.2)
        currentAnimationTrack = track
        equippedEmote = emote

        StatusLabel.Text = "Equipado: <font color=\"#22d3ee\"><b>" .. emote.name .. "</b></font> " .. emote.icon .. " | 100% FE Activo"

        -- Resaltar botón en la interfaz
        for id, btnData in pairs(emoteButtonsMap) do
            if btnData and btnData.stroke then
                if id == emote.id then
                    btnData.stroke.Color = THEMES[currentThemeIndex].secondary
                    btnData.stroke.Transparency = 0
                    btnData.stroke.Thickness = 2
                else
                    btnData.stroke.Color = Color3.fromRGB(255, 255, 255)
                    btnData.stroke.Transparency = 0.9
                    btnData.stroke.Thickness = 1
                end
            end
        end
    else
        StatusLabel.Text = "⚠️ Error al cargar emote: " .. emote.name .. " (ID: " .. emote.id .. ")"
    end
end

-- Detener emote si el personaje muere o respawnea
LocalPlayer.CharacterAdded:Connect(function()
    stopEmote()
end)

StopButton.Activated:Connect(function()
    stopEmote()
end)

-- ===================================================================
-- FUNCIÓN PARA RENDERIZAR LOS BOTONES DE EMOTES (8 POR FILA)
-- ===================================================================
local function refreshEmotesGrid()
    -- Limpiar botones existentes
    for _, child in ipairs(ScrollArea:GetChildren()) do
        if child:IsA("TextButton") then
            child:Destroy()
        end
    end
    emoteButtonsMap = {}

    local visibleCount = 0

    for i, emote in ipairs(EMOTES_DATA) do
        -- Filtrado por Pestaña
        local isFav = favorites[emote.id] == true
        local passesTab = (currentTab == "todos") or (currentTab == "favoritos" and isFav)

        -- Filtrado por Búsqueda
        local passesSearch = true
        if searchQuery ~= "" then
            passesSearch = string.find(string.lower(emote.name), string.lower(searchQuery), 1, true) ~= nil
        end

        if passesTab and passesSearch then
            visibleCount = visibleCount + 1

            -- Contenedor del Emote (Botón Pequeño)
            local Card = Instance.new("TextButton")
            Card.Name = "Emote_" .. emote.id
            Card.Size = UDim2.new(0, 92, 0, 88)
            Card.BackgroundColor3 = THEMES[currentThemeIndex].card
            Card.Text = ""
            Card.AutoButtonColor = false
            Card.ClipsDescendants = true
            Card.LayoutOrder = i
            Card.Parent = ScrollArea

            local CardCorner = Instance.new("UICorner")
            CardCorner.CornerRadius = UDim.new(0, 10)
            CardCorner.Parent = Card

            local CardStroke = Instance.new("UIStroke")
            CardStroke.Color = (equippedEmote and equippedEmote.id == emote.id) and THEMES[currentThemeIndex].secondary or Color3.fromRGB(255, 255, 255)
            CardStroke.Transparency = (equippedEmote and equippedEmote.id == emote.id) and 0 or 0.9
            CardStroke.Thickness = (equippedEmote and equippedEmote.id == emote.id) and 2 or 1
            CardStroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
            CardStroke.Parent = Card

            -- Ícono / Emoji del Emote
            local IconLabel = Instance.new("TextLabel")
            IconLabel.Name = "IconLabel"
            IconLabel.Size = UDim2.new(1, 0, 0, 38)
            IconLabel.Position = UDim2.new(0, 0, 0, 10)
            IconLabel.BackgroundTransparency = 1
            IconLabel.Text = emote.icon
            IconLabel.Font = Enum.Font.GothamBold
            IconLabel.TextSize = 28
            IconLabel.Parent = Card

            -- Nombre del Emote
            local NameLabel = Instance.new("TextLabel")
            NameLabel.Name = "NameLabel"
            NameLabel.Size = UDim2.new(1, -8, 0, 24)
            NameLabel.Position = UDim2.new(0, 4, 1, -28)
            NameLabel.BackgroundTransparency = 1
            NameLabel.Text = emote.name
            NameLabel.Font = Enum.Font.GothamMedium
            NameLabel.TextSize = 11
            NameLabel.TextColor3 = Color3.fromRGB(240, 240, 240)
            NameLabel.TextTruncate = Enum.TextTruncate.AtEnd
            NameLabel.Parent = Card

            -- Estrellita de Favoritos (⭐) en la esquina superior derecha
            local StarButton = Instance.new("TextButton")
            StarButton.Name = "StarButton"
            StarButton.Size = UDim2.new(0, 24, 0, 24)
            StarButton.Position = UDim2.new(1, -26, 0, 2)
            StarButton.BackgroundTransparency = 1
            StarButton.Text = isFav and "⭐" or "☆"
            StarButton.TextColor3 = isFav and Color3.fromRGB(250, 204, 21) or Color3.fromRGB(150, 150, 150)
            StarButton.Font = Enum.Font.GothamBold
            StarButton.TextSize = 15
            StarButton.ZIndex = 5
            StarButton.Parent = Card

            -- Efectos de Hover al pasar el mouse sobre la tarjeta
            Card.MouseEnter:Connect(function()
                if not (equippedEmote and equippedEmote.id == emote.id) then
                    Card.BackgroundColor3 = THEMES[currentThemeIndex].cardHover
                end
            end)

            Card.MouseLeave:Connect(function()
                if not (equippedEmote and equippedEmote.id == emote.id) then
                    Card.BackgroundColor3 = THEMES[currentThemeIndex].card
                end
            end)

            -- Al tocar el emote se EQUIPA (funciona en PC y en Delta móvil)
            Card.Activated:Connect(function()
                equipEmote(emote)
            end)

            -- Al tocar la estrellita se añade/quita de FAVORITOS
            StarButton.Activated:Connect(function()
                if favorites[emote.id] then
                    favorites[emote.id] = nil
                    StarButton.Text = "☆"
                    StarButton.TextColor3 = Color3.fromRGB(150, 150, 150)
                else
                    favorites[emote.id] = true
                    StarButton.Text = "⭐"
                    StarButton.TextColor3 = Color3.fromRGB(250, 204, 21)
                end

                -- Actualizar contador de pestaña favoritos
                local favCount = 0
                for _ in pairs(favorites) do favCount = favCount + 1 end
                TabFavs.Text = "⭐ Favoritos (" .. favCount .. ")"

                -- Si estamos en la pestaña favoritos, refrescar inmediatamente
                if currentTab == "favoritos" then
                    refreshEmotesGrid()
                end
            end)

            emoteButtonsMap[emote.id] = {
                button = Card,
                stroke = CardStroke,
                star = StarButton
            }
        end
    end

    -- Contar favoritos actuales
    local favCount = 0
    for _ in pairs(favorites) do favCount = favCount + 1 end
    TabFavs.Text = "⭐ Favoritos (" .. favCount .. ")"

    -- Mostrar mensaje si no hay favoritos
    if currentTab == "favoritos" and visibleCount == 0 then
        EmptyNotice.Visible = true
    else
        EmptyNotice.Visible = false
    end
end

-- ===================================================================
-- FUNCIÓN PARA CAMBIAR DE COLOR (TEMA)
-- ===================================================================
local function applyTheme(themeIndex)
    currentThemeIndex = themeIndex
    local theme = THEMES[currentThemeIndex]

    -- Animación suave de transición de colores
    local tweenInfo = TweenInfo.new(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)

    TweenService:Create(MainHub, tweenInfo, { BackgroundColor3 = theme.background }):Play()
    TweenService:Create(MainStroke, tweenInfo, { Color = theme.primary }):Play()
    TweenService:Create(Header, tweenInfo, { BackgroundColor3 = theme.card }):Play()
    TweenService:Create(HeaderBottomPatch, tweenInfo, { BackgroundColor3 = theme.card }):Play()
    TweenService:Create(ToggleButton, tweenInfo, { BackgroundColor3 = theme.primary }):Play()
    TweenService:Create(ToggleStroke, tweenInfo, { Color = theme.secondary }):Play()
    TweenService:Create(ColorThemeButton, tweenInfo, { BackgroundColor3 = theme.primary }):Play()
    TweenService:Create(ScrollArea, tweenInfo, { ScrollBarImageColor3 = theme.primary }):Play()
    TweenService:Create(StatusBar, tweenInfo, { BackgroundColor3 = theme.card }):Play()

    ColorThemeButton.Text = "🎨 Color: " .. theme.name

    if currentTab == "todos" then
        TabTodos.BackgroundColor3 = theme.primary
        TabFavs.BackgroundColor3 = theme.card
    else
        TabTodos.BackgroundColor3 = theme.card
        TabFavs.BackgroundColor3 = theme.primary
    end

    -- Actualizar colores de las tarjetas
    refreshEmotesGrid()
end

ColorThemeButton.Activated:Connect(function()
    local nextIndex = (currentThemeIndex % #THEMES) + 1
    applyTheme(nextIndex)
end)

-- ===================================================================
-- CONTROL DE PESTAÑAS (TODOS / FAVORITOS)
-- ===================================================================
TabTodos.Activated:Connect(function()
    currentTab = "todos"
    TabTodos.BackgroundColor3 = THEMES[currentThemeIndex].primary
    TabTodos.TextColor3 = Color3.fromRGB(255, 255, 255)
    TabFavs.BackgroundColor3 = THEMES[currentThemeIndex].card
    TabFavs.TextColor3 = Color3.fromRGB(200, 200, 200)
    refreshEmotesGrid()
end)

TabFavs.Activated:Connect(function()
    currentTab = "favoritos"
    TabFavs.BackgroundColor3 = THEMES[currentThemeIndex].primary
    TabFavs.TextColor3 = Color3.fromRGB(255, 255, 255)
    TabTodos.BackgroundColor3 = THEMES[currentThemeIndex].card
    TabTodos.TextColor3 = Color3.fromRGB(200, 200, 200)
    refreshEmotesGrid()
end)

-- Búsqueda en tiempo real
SearchBox:GetPropertyChangedSignal("Text"):Connect(function()
    searchQuery = SearchBox.Text
    refreshEmotesGrid()
end)

-- ===================================================================
-- LÓGICA DE ABRIR / CERRAR EL HUB
-- ===================================================================
local isHubOpen = true

local function toggleHub()
    isHubOpen = not isHubOpen
    local curW, curH = getResponsiveHubDimensions()
    local halfW = math.floor(curW / 2)
    local halfH = math.floor(curH / 2)

    if isHubOpen then
        MainHub.Visible = true
        MainHub.Position = UDim2.new(0.5, -halfW, 0.5, -halfH + 30)
        TweenService:Create(MainHub, TweenInfo.new(0.25, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
            Position = UDim2.new(0.5, -halfW, 0.5, -halfH)
        }):Play()
        ToggleButton.Text = "🎭 Cerrar Hub [K]"
    else
        local tween = TweenService:Create(MainHub, TweenInfo.new(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
            Position = UDim2.new(0.5, -halfW, 0.5, -halfH + 30)
        })
        tween:Play()
        tween.Completed:Connect(function()
            if not isHubOpen then
                MainHub.Visible = false
            end
        end)
        ToggleButton.Text = "🎭 Abrir Hub [K]"
    end
end

ToggleButton.Activated:Connect(toggleHub)
CloseButton.Activated:Connect(toggleHub)

-- Atajo de teclado: Tecla 'K' para abrir/cerrar
UserInputService.InputBegan:Connect(function(input, gameProcessed)
    if not gameProcessed and input.KeyCode == Enum.KeyCode.K then
        toggleHub()
    end
end)

-- ===================================================================
-- SISTEMA PARA ARRASTRAR EL HUB (DRAGGABLE)
-- ===================================================================
local dragging, dragInput, dragStart, startPos

Header.InputBegan:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
        dragging = true
        dragStart = input.Position
        startPos = MainHub.Position

        input.Changed:Connect(function()
            if input.UserInputState == Enum.UserInputState.End then
                dragging = false
            end
        end)
    end
end)

Header.InputChanged:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseMovement or input.UserInputType == Enum.UserInputType.Touch then
        dragInput = input
    end
end)

UserInputService.InputChanged:Connect(function(input)
    if input == dragInput and dragging then
        local delta = input.Position - dragStart
        MainHub.Position = UDim2.new(
            startPos.X.Scale,
            startPos.X.Offset + delta.X,
            startPos.Y.Scale,
            startPos.Y.Offset + delta.Y
        )
    end
end)

-- Permitir arrastrar también el botón flotante
local tDragging, tDragInput, tDragStart, tStartPos
ToggleButton.InputBegan:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
        tDragging = true
        tDragStart = input.Position
        tStartPos = ToggleButton.Position

        input.Changed:Connect(function()
            if input.UserInputState == Enum.UserInputState.End then
                tDragging = false
            end
        end)
    end
end)

ToggleButton.InputChanged:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseMovement or input.UserInputType == Enum.UserInputType.Touch then
        tDragInput = input
    end
end)

UserInputService.InputChanged:Connect(function(input)
    if input == tDragInput and tDragging then
        local delta = input.Position - tDragStart
        ToggleButton.Position = UDim2.new(
            tStartPos.X.Scale,
            tStartPos.X.Offset + delta.X,
            tStartPos.Y.Scale,
            tStartPos.Y.Offset + delta.Y
        )
    end
end)

-- ===================================================================
-- INICIALIZACIÓN
-- ===================================================================
applyTheme(1)
refreshEmotesGrid()

print("=====================================================")
print("🔥 [FE EMOTES HUB] Cargado exitosamente!")
print("✨ Presiona [K] o usa el botón flotante para abrir/cerrar.")
print("🎨 Botón de Color: 8 temas disponibles.")
print("⭐ Marca emotes con la estrellita para guardarlos en Favoritos.")
print("=====================================================")
