import { ref, computed } from 'vue';
import { database } from '../firebase';
import { ref as dbRef, update } from 'firebase/database';
import { SKILL_TYPES, isSkillUsable } from '../config/skills';

/**
 * 技能管理Hook
 * 提供技能相关的所有功能
 * @param {Object} gameLogic - 游戏逻辑对象（包含roomData等）
 * @param {string} playerId - 当前玩家ID
 * @param {string} roomId - 房间ID
 */
export function useSkill(gameLogic, playerId, roomId) {
  const room = computed(() => gameLogic?.roomData?.value || null);
  const currentPlayerId = playerId;

  // 技能激活模式
  const skillModeActive = ref(false);

  // 检查当前玩家是否有可用技能
  const currentPlayerHasSkill = computed(() => {
    if (!room.value || !room.value.players || !currentPlayerId) return false;

    const player = room.value.players[currentPlayerId];
    return player?.skill?.hasSkill && !player?.skill?.skillUsed;
  });

  // 检查技能是否可用
  const canUseSkill = computed(() => {
    if (!room.value || !room.value.players || !currentPlayerId) return false;

    const player = room.value.players[currentPlayerId];
    return player?.skill?.hasSkill && !player?.skill?.skillUsed;
  });

  // 获取当前玩家的技能类型
  const currentPlayerSkillType = computed(() => {
    if (!room.value || !room.value.players || !currentPlayerId) return null;

    const player = room.value.players[currentPlayerId];
    return player?.skill?.skillType || null;
  });

  // 激活技能选择模式
  const activateSkillMode = () => {
    if (!canUseSkill.value) return;

    skillModeActive.value = true;

    // 延迟一小段时间后自动退出模式，避免重复触发
    setTimeout(() => {
      skillModeActive.value = false;
    }, 5000);
  };

  // 退出技能模式
  const exitSkillMode = () => {
    skillModeActive.value = false;
  };

  // 对指定楼层使用技能
  const useSkillOnFloor = async (floor) => {
    if (!canUseSkill.value || !room.value || !currentPlayerId || !roomId) return;

    const player = room.value.players[currentPlayerId];

    // 检查楼层是否未揭示
    const scenarioCards = room.value.scenarioCards;
    if (!scenarioCards || !scenarioCards[floor] || scenarioCards[floor].revealed) {
      alert('只能查看未揭示的楼层！');
      return;
    }

    // 检查技能类型
    if (player.skill.skillType === SKILL_TYPES.VIEW_FLOOR) {
      const now = Date.now();
      const expireAt = now + 2000; // 2秒后过期

      try {
        // 更新房间数据，标记正在查看的楼层
        const roomRef = dbRef(database, `rooms/${roomId}`);
        await update(roomRef, {
          skillViewing: {
            floor: floor,
            playerId: currentPlayerId,
            expireAt: expireAt,
            timestamp: now
          }
        });

        // 更新玩家技能状态为已使用
        const playerRef = dbRef(database, `rooms/${roomId}/players/${currentPlayerId}`);
        await update(playerRef, {
          'skill/skillUsed': true
        });

        // 退出技能模式
        skillModeActive.value = false;

        // 2秒后自动清理skillViewing状态
        setTimeout(async () => {
          const currentRoom = gameLogic?.roomData?.value;
          if (currentRoom?.skillViewing?.floor === floor) {
            await update(roomRef, {
              skillViewing: null
            });
          }
        }, 2000);
      } catch (err) {
        console.error('使用技能失败:', err);
        alert('使用技能失败: ' + err.message);
      }
    }
  };

  // 检查指定楼层是否正在被当前玩家的技能查看
  const isFloorBeingViewed = (floor) => {
    if (!room.value?.skillViewing) return false;
    // 只有当查看者是当前玩家时才返回true，实现权限控制
    return room.value.skillViewing.floor === floor &&
           room.value.skillViewing.playerId === currentPlayerId;
  };

  // 获取楼层查看的剩余时间
  const getSkillViewingTimeLeft = (floor) => {
    if (!isFloorBeingViewed(floor)) return 0;

    const expireAt = room.value.skillViewing.expireAt;
    const now = Date.now();
    return Math.max(0, expireAt - now);
  };

  // 检查是否是当前玩家的技能查看
  const isCurrentPlayerViewing = () => {
    if (!room.value?.skillViewing || !currentPlayerId) return false;
    return room.value.skillViewing.playerId === currentPlayerId;
  };

  return {
    // 状态
    skillModeActive: skillModeActive,
    canUseSkill: canUseSkill,
    currentPlayerHasSkill: currentPlayerHasSkill,
    currentPlayerSkillType: currentPlayerSkillType,

    // 方法
    activateSkillMode: activateSkillMode,
    exitSkillMode: exitSkillMode,
    useSkillOnFloor: useSkillOnFloor,
    isFloorBeingViewed: isFloorBeingViewed,
    getSkillViewingTimeLeft: getSkillViewingTimeLeft,
    isCurrentPlayerViewing: isCurrentPlayerViewing
  };
}
