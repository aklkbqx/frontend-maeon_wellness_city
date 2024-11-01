import React, { useEffect } from 'react';
import { Redirect, router } from 'expo-router';
import { VersionCheckProvider } from '@/context/VersionCheckProvider';
import * as Linking from 'expo-linking';

export default function IndexRootApp() {

    useEffect(() => {
        const handleDeepLink = (url: string) => {
            try {
                const receiptPattern = /\/receipt\/([^\/]+)/;
                const match = url.match(receiptPattern);

                if (match) {
                    const receiptId = match[1];
                    router.push(`/payments/receipt/${receiptId}`);
                    return;
                }
            } catch (error) {
                console.error('Error handling deep link:', error);
            }
        };

        const checkInitialURL = async () => {
            const initialUrl = await Linking.getInitialURL();
            if (initialUrl) {
                handleDeepLink(initialUrl);
            }
        };
        const subscription = Linking.addEventListener('url', (event) => {
            handleDeepLink(event.url);
        });

        checkInitialURL();
        return () => {
            subscription.remove();
        };
    }, [router]);

    // return (
    //     <VersionCheckProvider>
    //         <Redirect href="/(home)" />
    //     </VersionCheckProvider>
    // );
    return (
        <Redirect href="/(home)" />
    );
}

export const createReceiptDeepLink = (receiptId: string | number) => {
    return `maeonwellness://receipt/${receiptId}`;
};

export const createReceiptWebLink = (receiptId: string | number) => {
    return `https://maeonwellnesscity.com/receipt/${receiptId}`;
};