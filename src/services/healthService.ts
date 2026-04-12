/**
 * healthService.ts
 *
 * Abstracts Apple HealthKit (iOS) and Google Health Connect (Android)
 * for fetching today's step count.
 */

import { Platform } from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

export type HealthPlatform = 'apple' | 'google' | 'none';

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

async function requestAppleHealthPermissions(): Promise<boolean> {
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
                resolve(!err);
            });
        });
    } catch {
        return false;
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
                    if (err || !result) {
                        resolve(0);
                    } else {
                        resolve(Math.round(result.value));
                    }
                }
            );
        });
    } catch {
        return 0;
    }
}

// ─── Google Health Connect (Android) ─────────────────────────────────────────

async function requestGoogleHealthPermissions(): Promise<boolean> {
    try {
        const {
            initialize,
            requestPermission,
            getSdkStatus,
            SdkAvailabilityStatus,
        } = require('react-native-health-connect');

        const status = await getSdkStatus();
        if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) {
            return false;
        }

        await initialize();
        const granted = await requestPermission([
            { accessType: 'read', recordType: 'Steps' },
        ]);
        return Array.isArray(granted) && granted.length > 0;
    } catch {
        return false;
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
            timeRangeFilter: {
                operator: 'between',
                startTime,
                endTime,
            },
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
 * Request permissions from whichever health platform is appropriate.
 * Returns true if permissions were granted.
 */
export async function requestHealthPermissions(
    platform: HealthPlatform
): Promise<boolean> {
    if (platform === 'apple' && Platform.OS === 'ios') {
        return requestAppleHealthPermissions();
    }
    if (platform === 'google' && Platform.OS === 'android') {
        return requestGoogleHealthPermissions();
    }
    return false;
}

/**
 * Fetch today's step count from the active health platform.
 * Returns 0 on any error or if unsupported.
 */
export async function fetchTodaySteps(): Promise<number> {
    if (Platform.OS === 'ios') {
        return fetchAppleHealthSteps();
    }
    if (Platform.OS === 'android') {
        return fetchGoogleHealthSteps();
    }
    return 0;
}

/**
 * Returns which health platform is supported on the current device.
 */
export function getSupportedHealthPlatform(): HealthPlatform {
    if (Platform.OS === 'ios') return 'apple';
    if (Platform.OS === 'android') return 'google';
    return 'none';
}
