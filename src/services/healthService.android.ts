/**
 * Google Health Connect implementation (Android only).
 * Metro automatically uses this file on Android builds.
 */

import { Linking } from 'react-native';

export type HealthPlatform = 'apple' | 'google' | 'none';
export type HealthPermissionResult = 'granted' | 'denied' | 'not_installed';

function getStartOfToday(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

function getEndOfToday(): Date {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
}

export async function requestHealthPermissions(
    _platform: HealthPlatform
): Promise<HealthPermissionResult> {
    try {
        const {
            initialize,
            requestPermission,
            getSdkStatus,
            SdkAvailabilityStatus,
        } = require('react-native-health-connect');

        const status = await getSdkStatus();

        if (
            status === SdkAvailabilityStatus.SDK_UNAVAILABLE ||
            status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED
        ) {
            return 'not_installed';
        }

        await initialize();
        const granted = await requestPermission([
            { accessType: 'read', recordType: 'Steps' },
        ]);
        return Array.isArray(granted) && granted.length > 0 ? 'granted' : 'denied';
    } catch {
        return 'denied';
    }
}

export function openHealthConnectPlayStore() {
    Linking.openURL(
        'https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata'
    ).catch(() => {
        Linking.openURL('market://details?id=com.google.android.apps.healthdata');
    });
}

export async function fetchTodaySteps(): Promise<number> {
    try {
        const { initialize, readRecords, getSdkStatus, SdkAvailabilityStatus } =
            require('react-native-health-connect');

        const status = await getSdkStatus();
        if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) return 0;

        await initialize();

        const startTime = getStartOfToday().toISOString();
        const endTime = getEndOfToday().toISOString();

        const { records } = await readRecords('Steps', {
            timeRangeFilter: { operator: 'between', startTime, endTime },
        });

        return records.reduce(
            (sum: number, r: { count: number }) => sum + (r.count ?? 0),
            0
        );
    } catch {
        return 0;
    }
}

export function getSupportedHealthPlatform(): HealthPlatform {
    return 'google';
}
