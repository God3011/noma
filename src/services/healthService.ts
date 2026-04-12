/**
 * healthService.ts
 *
 * Abstracts Apple HealthKit (iOS) and Google Health Connect (Android)
 * for fetching today's step count.
 */

import { Platform, Linking } from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

export type HealthPlatform = 'apple' | 'google' | 'none';

/** 'granted' | 'denied' | 'not_installed' (Health Connect not on device) */
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

// ─── Apple HealthKit (iOS) ────────────────────────────────────────────────────

async function requestAppleHealthPermissions(): Promise<HealthPermissionResult> {
    try {
        const AppleHealthKit = require('react-native-health').default;
        const { Permissions } = require('react-native-health').default.Constants;

        const permissions = {
            permissions: {
                read: [Permissions.StepCount],
                write: [],
            },
        };

        return new Promise((resolve) => {
            AppleHealthKit.initHealthKit(permissions, (err: string) => {
                resolve(err ? 'denied' : 'granted');
            });
        });
    } catch {
        return 'denied';
    }
}

async function fetchAppleHealthSteps(): Promise<number> {
    try {
        const AppleHealthKit = require('react-native-health').default;
        const startOfToday = getStartOfToday();

        return new Promise((resolve) => {
            AppleHealthKit.getStepCount(
                { date: startOfToday.toISOString(), includeManuallyAdded: true },
                (err: string, result: { value: number }) => {
                    resolve(!err && result ? Math.round(result.value) : 0);
                }
            );
        });
    } catch {
        return 0;
    }
}

// ─── Google Health Connect (Android) ─────────────────────────────────────────

async function requestGoogleHealthPermissions(): Promise<HealthPermissionResult> {
    try {
        const {
            initialize,
            requestPermission,
            getSdkStatus,
            SdkAvailabilityStatus,
        } = require('react-native-health-connect');

        const status = await getSdkStatus();

        // SDK not installed — Health Connect app is missing from the device
        if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE) {
            return 'not_installed';
        }

        // SDK needs an update to Health Connect
        if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
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

async function fetchGoogleHealthSteps(): Promise<number> {
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

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Request permissions from the appropriate health platform.
 * Returns 'granted', 'denied', or 'not_installed'.
 */
export async function requestHealthPermissions(
    platform: HealthPlatform
): Promise<HealthPermissionResult> {
    if (platform === 'apple' && Platform.OS === 'ios') {
        return requestAppleHealthPermissions();
    }
    if (platform === 'google' && Platform.OS === 'android') {
        return requestGoogleHealthPermissions();
    }
    return 'denied';
}

/**
 * Opens the Play Store page to install / update Health Connect.
 */
export function openHealthConnectPlayStore() {
    Linking.openURL(
        'https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata'
    ).catch(() => {
        Linking.openURL('market://details?id=com.google.android.apps.healthdata');
    });
}

/**
 * Fetch today's step count from the active health platform.
 */
export async function fetchTodaySteps(): Promise<number> {
    if (Platform.OS === 'ios') return fetchAppleHealthSteps();
    if (Platform.OS === 'android') return fetchGoogleHealthSteps();
    return 0;
}

/**
 * Returns which health platform is relevant for the current device.
 */
export function getSupportedHealthPlatform(): HealthPlatform {
    if (Platform.OS === 'ios') return 'apple';
    if (Platform.OS === 'android') return 'google';
    return 'none';
}
