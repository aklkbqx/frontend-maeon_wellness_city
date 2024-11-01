import React from 'react';
import { FontAwesome5 } from '@expo/vector-icons';

interface IconProps {
    name: string;
    color: string;
    transform?: { [key: string]: any };
}

type DirectionResult = string | JSX.Element;

export const getTurnDirection = (maneuver: string, type: 'text' | 'icon' = 'text'): DirectionResult => {
    const getIconProps = (name: string, color: string, transform?: { [key: string]: any }): IconProps => ({
        name,
        color,
        transform
    });

    const getDirection = (text: string, icon: IconProps): DirectionResult => {
        if (type === 'icon') {
            return <FontAwesome5 name={icon.name} size={20} color={icon.color} style={icon.transform ? { transform: icon.transform } : undefined} />;
        }
        return text;
    };

    switch (maneuver) {
        case 'DEPART':
            return getDirection('ออกเดินทาง', getIconProps('car', 'green'));
        case 'DESTINATION':
        case 'DESTINATION_LEFT':
        case 'DESTINATION_RIGHT':
            return getDirection('ถึงจุดหมาย', getIconProps('flag-checkered', 'red'));
        case 'FERRY_BOAT':
            return getDirection('ขึ้นเรือเฟอร์รี่', getIconProps('ship', 'blue'));
        case 'FERRY_TRAIN':
            return getDirection('ขึ้นรถไฟเฟอร์รี่', getIconProps('train', 'blue'));
        case 'FORK_LEFT':
            return getDirection('แยกซ้ายเล็กน้อย', getIconProps('code-branch', 'orange', [{ rotate: '180deg' }]));
        case 'FORK_RIGHT':
            return getDirection('แยกขวาเล็กน้อย', getIconProps('code-branch', 'orange'));
        case 'MERGE_LEFT':
        case 'MERGE_RIGHT':
        case 'MERGE_UNSPECIFIED':
            return getDirection('เข้าสู่ถนนหลัก', getIconProps('sign-in-alt', 'blue'));
        case 'NAME_CHANGE':
            return getDirection('ชื่อถนนเปลี่ยน', getIconProps('exchange-alt', 'purple'));
        case 'OFF_RAMP_KEEP_LEFT':
            return getDirection('ชิดซ้ายเพื่อออกจากทางด่วน', getIconProps('sign-out-alt', 'green', [{ rotate: '270deg' }]));
        case 'OFF_RAMP_KEEP_RIGHT':
            return getDirection('ชิดขวาเพื่อออกจากทางด่วน', getIconProps('sign-out-alt', 'green', [{ rotate: '90deg' }]));
        case 'OFF_RAMP_LEFT':
            return getDirection('เลี้ยวซ้ายเพื่อออกจากทางด่วน', getIconProps('turn-left', 'green'));
        case 'OFF_RAMP_RIGHT':
            return getDirection('เลี้ยวขวาเพื่อออกจากทางด่วน', getIconProps('turn-right', 'green'));
        case 'OFF_RAMP_SHARP_LEFT':
            return getDirection('เลี้ยวซ้ายแบบหักศอกเพื่อออกจากทางด่วน', getIconProps('undo', 'green'));
        case 'OFF_RAMP_SHARP_RIGHT':
            return getDirection('เลี้ยวขวาแบบหักศอกเพื่อออกจากทางด่วน', getIconProps('redo', 'green'));
        case 'OFF_RAMP_SLIGHT_LEFT':
            return getDirection('เลี้ยวซ้ายเล็กน้อยเพื่อออกจากทางด่วน', getIconProps('arrow-alt-circle-left', 'green'));
        case 'OFF_RAMP_SLIGHT_RIGHT':
            return getDirection('เลี้ยวขวาเล็กน้อยเพื่อออกจากทางด่วน', getIconProps('arrow-alt-circle-right', 'green'));
        case 'OFF_RAMP_UNSPECIFIED':
            return getDirection('ออกจากทางด่วน', getIconProps('sign-out-alt', 'green'));
        case 'ON_RAMP_KEEP_LEFT':
            return getDirection('ชิดซ้ายเพื่อขึ้นทางด่วน', getIconProps('sign-in-alt', 'blue', [{ rotate: '270deg' }]));
        case 'ON_RAMP_KEEP_RIGHT':
            return getDirection('ชิดขวาเพื่อขึ้นทางด่วน', getIconProps('sign-in-alt', 'blue', [{ rotate: '90deg' }]));
        case 'ON_RAMP_LEFT':
            return getDirection('เลี้ยวซ้ายเพื่อขึ้นทางด่วน', getIconProps('turn-left', 'blue'));
        case 'ON_RAMP_RIGHT':
            return getDirection('เลี้ยวขวาเพื่อขึ้นทางด่วน', getIconProps('turn-right', 'blue'));
        case 'ON_RAMP_SHARP_LEFT':
            return getDirection('เลี้ยวซ้ายแบบหักศอกเพื่อขึ้นทางด่วน', getIconProps('undo', 'blue'));
        case 'ON_RAMP_SHARP_RIGHT':
            return getDirection('เลี้ยวขวาแบบหักศอกเพื่อขึ้นทางด่วน', getIconProps('redo', 'blue'));
        case 'ON_RAMP_SLIGHT_LEFT':
            return getDirection('เลี้ยวซ้ายเล็กน้อยเพื่อขึ้นทางด่วน', getIconProps('arrow-alt-circle-left', 'blue'));
        case 'ON_RAMP_SLIGHT_RIGHT':
            return getDirection('เลี้ยวขวาเล็กน้อยเพื่อขึ้นทางด่วน', getIconProps('arrow-alt-circle-right', 'blue'));
        case 'ON_RAMP_UNSPECIFIED':
            return getDirection('ขึ้นทางด่วน', getIconProps('sign-in-alt', 'blue'));
        case 'ROUNDABOUT_CLOCKWISE':
        case 'ROUNDABOUT_COUNTERCLOCKWISE':
            return getDirection('เข้าสู่วงเวียน', getIconProps('sync', 'orange'));
        case 'ROUNDABOUT_EXIT_CLOCKWISE':
        case 'ROUNDABOUT_EXIT_COUNTERCLOCKWISE':
            return getDirection('ออกจากวงเวียน', getIconProps('sign-out-alt', 'orange'));
        case 'ROUNDABOUT_LEFT_CLOCKWISE':
        case 'ROUNDABOUT_LEFT_COUNTERCLOCKWISE':
            return getDirection('เข้าวงเวียนแล้วเลี้ยวซ้าย', getIconProps('undo', 'orange'));
        case 'ROUNDABOUT_RIGHT_CLOCKWISE':
        case 'ROUNDABOUT_RIGHT_COUNTERCLOCKWISE':
            return getDirection('เข้าวงเวียนแล้วเลี้ยวขวา', getIconProps('redo', 'orange'));
        case 'ROUNDABOUT_SHARP_LEFT_CLOCKWISE':
        case 'ROUNDABOUT_SHARP_LEFT_COUNTERCLOCKWISE':
            return getDirection('เข้าวงเวียนแล้วเลี้ยวซ้ายแบบหักศอก', getIconProps('undo', 'orange'));
        case 'ROUNDABOUT_SHARP_RIGHT_CLOCKWISE':
        case 'ROUNDABOUT_SHARP_RIGHT_COUNTERCLOCKWISE':
            return getDirection('เข้าวงเวียนแล้วเลี้ยวขวาแบบหักศอก', getIconProps('redo', 'orange'));
        case 'ROUNDABOUT_SLIGHT_LEFT_CLOCKWISE':
        case 'ROUNDABOUT_SLIGHT_LEFT_COUNTERCLOCKWISE':
            return getDirection('เข้าวงเวียนแล้วเลี้ยวซ้ายเล็กน้อย', getIconProps('arrow-alt-circle-left', 'orange'));
        case 'ROUNDABOUT_SLIGHT_RIGHT_CLOCKWISE':
        case 'ROUNDABOUT_SLIGHT_RIGHT_COUNTERCLOCKWISE':
            return getDirection('เข้าวงเวียนแล้วเลี้ยวขวาเล็กน้อย', getIconProps('arrow-alt-circle-right', 'orange'));
        case 'ROUNDABOUT_STRAIGHT_CLOCKWISE':
        case 'ROUNDABOUT_STRAIGHT_COUNTERCLOCKWISE':
            return getDirection('เข้าวงเวียนแล้วตรงไป', getIconProps('arrow-up', 'orange'));
        case 'ROUNDABOUT_U_TURN_CLOCKWISE':
        case 'ROUNDABOUT_U_TURN_COUNTERCLOCKWISE':
            return getDirection('เข้าวงเวียนแล้วกลับรถ', getIconProps('undo', 'orange'));
        case 'STRAIGHT':
            return getDirection('ตรงไป', getIconProps('arrow-up', 'blue'));
        case 'TURN_KEEP_LEFT':
            return getDirection('ชิดซ้าย', getIconProps('arrow-left', 'blue'));
        case 'TURN_KEEP_RIGHT':
            return getDirection('ชิดขวา', getIconProps('arrow-right', 'blue'));
        case 'TURN_LEFT':
            return getDirection('เลี้ยวซ้าย', getIconProps('arrow-left', 'blue'));
        case 'TURN_RIGHT':
            return getDirection('เลี้ยวขวา', getIconProps('arrow-right', 'blue'));
        case 'TURN_SHARP_LEFT':
            return getDirection('เลี้ยวซ้ายแบบหักศอก', getIconProps('undo', 'blue'));
        case 'TURN_SHARP_RIGHT':
            return getDirection('เลี้ยวขวาแบบหักศอก', getIconProps('redo', 'blue'));
        case 'TURN_SLIGHT_LEFT':
            return getDirection('เลี้ยวซ้ายเล็กน้อย', getIconProps('arrow-alt-circle-left', 'blue'));
        case 'TURN_SLIGHT_RIGHT':
            return getDirection('เลี้ยวขวาเล็กน้อย', getIconProps('arrow-alt-circle-right', 'blue'));
        case 'TURN_U_TURN_CLOCKWISE':
        case 'TURN_U_TURN_COUNTERCLOCKWISE':
            return getDirection('กลับรถ', getIconProps('undo', 'blue'));
        default:
            return getDirection('ไม่ทราบทิศทาง', getIconProps('question-circle', 'gray'));
    }
};