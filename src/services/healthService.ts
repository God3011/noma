/**
 * Stub for unsupported platforms (web, etc.)
 */

export type HealthPlatform = 'apple' | 'google' | 'none';
export type HealthPermissionResult = 'granted' | 'denied' | 'not_installed';

export async function requestHealthPermissions(_platform: HealthPlatform): Promise<HealthPermissionResult> {
    return 'denied';
}

export function openHealthConnectPlayStore() {}

export async function fetchTodaySteps(): Promise<number> {
    return 0;
}

export function getSupportedHealthPlatform(): HealthPlatform {
    return 'none';
}
