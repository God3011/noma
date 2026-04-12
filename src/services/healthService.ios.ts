/**
 * Apple HealthKit implementation (iOS only).
 * Metro automatically uses this file on iOS builds.
 */

import { Linking } from 'react-native';

export type HealthPlatform = 'apple' | 'google' | 'none';
export type HealthPermissionResult = 'granted' | 'denied' | 'not_installed';

function getStartOfToday(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

export async function requestHealthPermissions(
    _platform: HealthPlatform
): Promise<HealthPermissionResult> {
    try {
        const AppleHealthKit = require('react-native-health').default;
        const { Permissions } = AppleHealthKit.Constants;

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

export function openHealthConnectPlayStore() {
    // Not applicable on iOS — no-op
}

export async function fetchTodaySteps(): Promise<number> {
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

export function getSupportedHealthPlatform(): HealthPlatform {
    return 'apple';
}
