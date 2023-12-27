async function Wait(time) {
  await new Promise((resolve) => setTimeout(resolve, time)); // Wait
}
const Clamp = (num, min, max) => Math.min(Math.max(num, min), max);
module.exports = { Wait, Clamp };
