/**
 * Calculate cross rect of the two input react
 * @param {Number} l1 left of 1st rect
 * @param {Number} t1 top of 1st rect
 * @param {Number} r1 right of 1st rect
 * @param {Number} b1 bottom of 1st rect
 * @param {Number} l2 left of 2nd rect
 * @param {Number} t2 top of 2nd rect
 * @param {Number} r2 right of 2nd rect
 * @param {Number} b2 bottom of 2nd rect
 * return rect object if exist, else null
 */
export function getCrossRect(l1, t1, r1, b1, l2, t2, r2, b2) {
  if (
    typeof l1 !== 'number' || typeof t1 !== 'number' || typeof r1 !== 'number' || typeof b1 !== 'number' ||
    typeof l2 !== 'number' || typeof t2 !== 'number' || typeof r2 !== 'number' || typeof b2 !== 'number'
  ) {
    return null;
  }
  if (l1 >= r2 || t1 >= b2 || r1 <= l2 || b1 <= t2) return null;
  let l = Math.max(l1, l2);
  let t = Math.max(t1, t2);
  let r = Math.min(r1, r2);
  let b = Math.min(b1, b2);
  if (l >= r || t >= b) return null;
  return { left: l, top: t, right: r, bottom: b };
}