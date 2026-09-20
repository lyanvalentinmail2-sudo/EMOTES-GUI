/**
 * Roblox Avatar Canvas Animator
 * Renderiza un avatar tipo Roblox (cabeza, torso, brazos, piernas)
 * y ejecuta animaciones procedurales en base al emote equipado.
 */

(function () {
  const canvas = document.getElementById('avatar-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let currentEmote = null;
  let animTime = 0;
  let rafId = null;

  // Colores del personaje tipo Roblox
  const avatarColors = {
    head: '#ffd166',
    torso: '#3b82f6',
    leftArm: '#ffd166',
    rightArm: '#ffd166',
    leftLeg: '#1e293b',
    rightLeg: '#1e293b',
    face: '#1e293b'
  };

  function setAvatarThemeColor(primaryHex) {
    if (primaryHex) {
      avatarColors.torso = primaryHex;
    }
  }

  function setEmote(emote) {
    currentEmote = emote;
    animTime = 0;
  }

  function stopEmote() {
    currentEmote = null;
    animTime = 0;
  }

  function drawAvatar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    animTime += 0.05;
    const t = animTime;

    // Posición central base
    const cx = canvas.width / 2;
    const cy = canvas.height / 2 + 10;

    // Valores dinámicos según el emote
    let bodyY = cy;
    let bodyRot = 0;
    let headRot = 0;
    let headYOffset = 0;
    let leftArmRot = 0;
    let rightArmRot = 0;
    let leftArmY = 0;
    let rightArmY = 0;
    let leftLegRot = 0;
    let rightLegRot = 0;

    const emoteName = currentEmote ? currentEmote.name.toLowerCase() : '';

    if (!currentEmote) {
      // Estado Idle / En reposo
      bodyY = cy + Math.sin(t * 1.5) * 1.5;
      leftArmRot = Math.sin(t * 1.5) * 0.08;
      rightArmRot = -Math.sin(t * 1.5) * 0.08;
      headRot = Math.sin(t * 0.8) * 0.05;
    } else if (emoteName.includes('floss')) {
      // Floss Dance: balanceo de brazos y caderas alternadas
      bodyRot = Math.sin(t * 4) * 0.15;
      const armSwing = Math.sin(t * 4) * 0.85;
      leftArmRot = armSwing - 0.2;
      rightArmRot = armSwing + 0.2;
      bodyY = cy + Math.abs(Math.sin(t * 4)) * 2;
      leftLegRot = -armSwing * 0.2;
      rightLegRot = armSwing * 0.2;
    } else if (emoteName.includes('robot')) {
      // Robot Dance: movimientos rígidos a pasos
      const step = Math.floor(t * 2) % 4;
      bodyY = cy;
      if (step === 0) {
        leftArmRot = -1.5;
        rightArmRot = 0;
        headRot = 0.2;
      } else if (step === 1) {
        leftArmRot = -1.5;
        rightArmRot = 1.5;
        headRot = -0.2;
      } else if (step === 2) {
        leftArmRot = 0;
        rightArmRot = 1.5;
        headRot = 0;
      } else {
        leftArmRot = 0.8;
        rightArmRot = -0.8;
        headRot = 0.3;
      }
    } else if (emoteName.includes('wave') || emoteName.includes('hello')) {
      // Wave / Saludo
      bodyY = cy + Math.sin(t * 2) * 1;
      rightArmRot = -2.2 + Math.sin(t * 8) * 0.4;
      leftArmRot = 0.1;
      headRot = 0.1;
    } else if (emoteName.includes('laugh')) {
      // Laugh / Risa
      bodyY = cy + Math.abs(Math.sin(t * 8)) * 3;
      headRot = -0.3 + Math.sin(t * 8) * 0.15;
      leftArmRot = 0.4 + Math.sin(t * 8) * 0.1;
      rightArmRot = -0.4 - Math.sin(t * 8) * 0.1;
    } else if (emoteName.includes('t-pose')) {
      // T-Pose
      bodyY = cy;
      leftArmRot = 1.57;
      rightArmRot = -1.57;
      headRot = 0;
    } else if (emoteName.includes('cheer') || emoteName.includes('victory')) {
      // Cheer / Victoria
      bodyY = cy - Math.abs(Math.sin(t * 5)) * 6;
      leftArmRot = -2.4 + Math.sin(t * 5) * 0.3;
      rightArmRot = 2.4 - Math.sin(t * 5) * 0.3;
      headRot = Math.sin(t * 5) * 0.1;
    } else if (emoteName.includes('spin') || emoteName.includes('breakdance')) {
      // Spin / Giro rápido
      bodyRot = (t * 6) % (Math.PI * 2);
      bodyY = cy + Math.sin(t * 6) * 3;
      leftArmRot = 1.2;
      rightArmRot = -1.2;
    } else if (emoteName.includes('hype') || emoteName.includes('sturdy')) {
      // Hype / Baile enérgico
      bodyY = cy - Math.abs(Math.sin(t * 6)) * 5;
      leftArmRot = Math.sin(t * 6) * 1.2;
      rightArmRot = -Math.sin(t * 6) * 1.2;
      leftLegRot = Math.sin(t * 6) * 0.6;
      rightLegRot = -Math.sin(t * 6) * 0.6;
    } else {
      // Baile genérico rítmico (Dance 1, Dance 2, Dance 3, etc.)
      bodyY = cy + Math.sin(t * 4) * 3;
      bodyRot = Math.sin(t * 2) * 0.1;
      leftArmRot = Math.sin(t * 4) * 0.7;
      rightArmRot = -Math.sin(t * 4) * 0.7;
      leftLegRot = -Math.sin(t * 4) * 0.3;
      rightLegRot = Math.sin(t * 4) * 0.3;
      headRot = Math.sin(t * 4) * 0.12;
    }

    // =======================================================
    // DIBUJAR RIG ESTILO ROBLOX (BLOCKY)
    // =======================================================
    ctx.save();
    ctx.translate(cx, bodyY);
    ctx.rotate(bodyRot);

    // Sombra en el suelo
    ctx.save();
    ctx.translate(0, 48 - (bodyY - cy));
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 1. Pierna Izquierda
    ctx.save();
    ctx.translate(-7, 18);
    ctx.rotate(leftLegRot);
    ctx.fillStyle = avatarColors.leftLeg;
    ctx.fillRect(-5, 0, 10, 24);
    ctx.restore();

    // 2. Pierna Derecha
    ctx.save();
    ctx.translate(7, 18);
    ctx.rotate(rightLegRot);
    ctx.fillStyle = avatarColors.rightLeg;
    ctx.fillRect(-5, 0, 10, 24);
    ctx.restore();

    // 3. Torso
    ctx.fillStyle = avatarColors.torso;
    ctx.fillRect(-14, -8, 28, 26);
    // Borde sutil del torso
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-14, -8, 28, 26);

    // 4. Brazo Izquierdo
    ctx.save();
    ctx.translate(-16, -6);
    ctx.rotate(leftArmRot);
    ctx.fillStyle = avatarColors.leftArm;
    ctx.fillRect(-5, 0, 9, 22);
    ctx.restore();

    // 5. Brazo Derecho
    ctx.save();
    ctx.translate(16, -6);
    ctx.rotate(rightArmRot);
    ctx.fillStyle = avatarColors.rightArm;
    ctx.fillRect(-4, 0, 9, 22);
    ctx.restore();

    // 6. Cabeza
    ctx.save();
    ctx.translate(0, -22 + headYOffset);
    ctx.rotate(headRot);
    ctx.fillStyle = avatarColors.head;
    ctx.fillRect(-11, -11, 22, 22);

    // Cara clásica de Roblox (Ojos y sonrisa)
    ctx.fillStyle = avatarColors.face;
    // Ojos
    ctx.fillRect(-6, -4, 3, 4);
    ctx.fillRect(3, -4, 3, 4);
    // Sonrisa
    ctx.beginPath();
    ctx.arc(0, 1, 5, 0.2, Math.PI - 0.2);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = avatarColors.face;
    ctx.stroke();

    ctx.restore();

    ctx.restore();

    rafId = requestAnimationFrame(drawAvatar);
  }

  // Iniciar loop
  drawAvatar();

  window.RobloxAvatar = {
    setEmote,
    stopEmote,
    setAvatarThemeColor
  };
})();
