import React, { useCallback } from 'react'
import useShowToast from '@/hooks/useShowToast';
import { router, useFocusEffect } from 'expo-router';

const Logout = () => {
    useFocusEffect(useCallback(() => {
        router.replace("/(home)");
        useShowToast("info", "ออกจากระบบ", "ออกจากระบบแล้ว 👋");
    }, []))
    return (
        <React.Fragment></React.Fragment>
    )
}

export default Logout