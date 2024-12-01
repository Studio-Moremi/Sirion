/* License is GPL 3.0.
- Made by Studio Moremi.
 - op@kkutu.store
*/

const maxLevel = 200;
const levelTable = Array(maxLevel + 1).fill(0);

for (let i = 1; i <= maxLevel; i++) {
    levelTable[i] = Math.round(levelTable[i - 1] * 1.5) || 100; // 1레벨의 기준 경험치 = 100
}

/**
 * 현재 레벨과 다음 레벨까지 필요한 경험치를 반환
 * @param {number} experience - 누적 경험치
 * @returns {object} 현재 레벨, 현재 경험치, 다음 레벨까지 필요한 경험치
 */
function getLevelInfo(experience) {
    let level = 0;

    while (level < maxLevel && experience >= levelTable[level]) {
        level++;
    }

    level--;

    return {
        level,
        currentExp: experience - levelTable[level],
        nextLevelExp: levelTable[level + 1] - levelTable[level] || 0,
    };
}

module.exports = { getLevelInfo };
