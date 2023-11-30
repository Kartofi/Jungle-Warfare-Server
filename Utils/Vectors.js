function subVectors(a, b) {
  return new Vector3(a.x - b.x, a.y - b.y, a.z - b.z);
}
function compareVectors(a, b) {
  if (a.x == b.x && a.y == b.y && a.z == b.z) {
    return true;
  }
  return false;
}
class Vector3 {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  get magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }
  static fromJSON(json) {
    const { x, y, z } = json;
    return new Vector3(x, y, z);
  }
  get JsonObj() {
    return { x: this.x, y: this.y, z: this.z };
  }
}
module.exports = { subVectors, compareVectors, Vector3 };
