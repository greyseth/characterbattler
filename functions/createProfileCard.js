const { createCanvas, loadImage } = require("canvas");
const { AttachmentBuilder } = require("discord.js");

module.exports = async (user, profile) => {
  const canvas = createCanvas(800, 300);
  const ctx = canvas.getContext("2d");

  // Gradient background: navy to green
  const gradient = ctx.createLinearGradient(0, 0, 800, 300);
  gradient.addColorStop(0, "#000080"); // Navy
  gradient.addColorStop(0.5, "#008000"); // Green
  gradient.addColorStop(1, "#000080"); // Navy
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Load user avatar
  let avatarURL = user.displayAvatarURL({ format: "png", size: 128 });
  avatarURL = avatarURL.replace(/\.webp/, ".png");
  console.log(avatarURL);
  const avatar = await loadImage(avatarURL);

  // Draw circular avatar
  ctx.save();
  ctx.beginPath();
  ctx.arc(150, 150, 100, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar, 50, 50, 200, 200);
  ctx.restore();

  // Username
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 36px Sans";
  ctx.fillText(user.username, 280, 120);

  // "To Next Rank" label
  ctx.font = "24px Sans";
  ctx.fillText(
    `Rank ${profile.rank} - ${ranks[profile.rank - 1]} | To Next Rank`,
    280,
    160
  );

  // Progress bar
  const barX = 280;
  const barY = 180;
  const barWidth = 400;
  const barHeight = 30;
  const progress = profile.exp / profile.nextLevel; // 60%

  // Win Rate text
  ctx.font = "24px Sans";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(
    `Win Rate: ${
      profile.battles.total > 0
        ? Math.floor(profile.battles.won / profile.battles.total)
        : 0
    }%`,
    280,
    240
  );

  ctx.fillStyle = "#333";
  ctx.fillRect(barX, barY, barWidth, barHeight);
  ctx.fillStyle = "#00FF00";
  ctx.fillRect(barX, barY, barWidth * progress, barHeight);

  // Return image buffer
  return new AttachmentBuilder(canvas.toBuffer(), { name: "profile-card.png" });
};
