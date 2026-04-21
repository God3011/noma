/**
 * Apple HealthKit implementation (iOS only).
 * Metro automatically uses this file on iOS builds.
 */

import { Alert } from 'react-native';

// react-native-health uses module.exports so must be required, not imported
// eslint-disable-next-line @typescript-eslint/no-var-requires
const AppleHealthKit = require('react-native-health');

export type HealthPlatform = 'apple' | 'google' | 'none';
export type HealthPermissionResult = 'granted' | 'denied' | 'not_installed';

const PERMISSIONS = {
    permissions: {
        read: [AppleHealthKit.Constants.Permissions.StepCount],
        write: [],
    },
};

function getStartOfToday(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

export async function requestHealthPermissions(
    _platform: HealthPlatform
): Promise<HealthPermissionResult> {
    try {
        return await new Promise((resolve) => {
            AppleHealthKit.initHealthKit(PERMISSIONS, (err: string) => {
                resolve(err ? 'denied' : 'granted');
            });
        });
    } catch (e: any) {
        Alert.alert('HealthKit Error', e?.message ?? String(e));
        return 'denied';
    }
}

export function openHealthConnectPlayStore() {
    // Not applicable on iOS
}

export async function fetchTodaySteps(): Promise<number> {
    try {
        return await new Promise((resolve) => {
            AppleHealthKit.getStepCount(
                { date: getStartOfToday().toISOString(), includeManuallyAdded: true },
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
