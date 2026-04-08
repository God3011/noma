import React, { useEffect, useRef, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Alert, StatusBar,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { lookupBarcode } from '../../services/openFoodFactsService';
import { analyzeWithGemini } from '../../services/geminiService';
import { saveToHistory } from '../../services/scanHistoryService';
import { calculateRating } from '../../utils/nutritionRating';
import ScanFrame from '../../components/foodrating/ScanFrame';
import { theme } from '../../constants/theme';
import { FoodRatingStackParamList } from '../../navigation/FoodRatingNavigator';

type Nav = StackNavigationProp<FoodRatingStackParamList, 'Scanner'>;

export default function ScannerScreen() {
    const navigation = useNavigation<Nav>();
    const [permission, requestPermission] = useCameraPermissions();
    const [loading, setLoading] = useState(false);
    const [statusText, setStatusText] = useState('Point camera at a barcode');
    const lastScanned = useRef<string | null>(null);
    const isProcessing = useRef(false);

    useEffect(() => {
        if (!permission?.granted) {
            requestPermission();
        }
    }, []);

    const handleBarcodeScanned = async ({ data: barcode }: { data: string }) => {
        if (isProcessing.current || !barcode || barcode === lastScanned.current) return;

        isProcessing.current = true;
        lastScanned.current = barcode;
        setLoading(true);

        try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            setStatusText('Looking up product...');
            let product = await lookupBarcode(barcode);

            if (product) {
                setStatusText('Product found!');
            } else {
                setStatusText('Not in database — asking AI...');
                product = await analyzeWithGemini(barcode);
                setStatusText(product.name !== 'Unknown Product' ? 'AI identified product!' : 'Using estimated values...');
            }

            const { rating, reasons } = calculateRating(product.nutrition);
            product.rating = rating;
            product.rating_reasons = reasons;

            await saveToHistory(product);
            isProcessing.current = false;
            navigation.replace('ProductResult', { product });
        } catch (err: any) {
            const msg = err?.message ?? String(err);
            console.error('[ScannerScreen] lookup failed:', msg);
            Alert.alert('Scan Failed', msg, [
                {
                    text: 'Retry',
                    onPress: () => {
                        lastScanned.current = null;
                        isProcessing.current = false;
                        setLoading(false);
                        setStatusText('Point camera at a barcode');
                    },
                },
            ]);
        }
    };

    if (!permission) {
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
        return (
            <View style={[styles.container, styles.centred]}>
                <StatusBar barStyle="light-content" />
                <Ionicons name="camera-outline" size={48} color="#fff" style={{ marginBottom: 16 }} />
                <Text style={styles.permissionTitle}>Camera Access Needed</Text>
                <Text style={styles.permissionSub}>
                    Allow camera access to scan barcodes.
                </Text>
                <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
                    <Text style={styles.permissionBtnText}>Grant Permission</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 12 }}>
                    <Text style={styles.goBackText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                onBarcodeScanned={!loading ? handleBarcodeScanned : undefined}
                barcodeScannerSettings={{
                    barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr'],
                }}
            >
                {/* Dim overlay */}
                <View style={styles.dimOverlay} pointerEvents="none" />

                <ScanFrame loading={loading} statusText={statusText} />

                {/* Top bar */}
                <View style={styles.topBar}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                        <Ionicons name="close" size={22} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.topTitle}>Scan Barcode</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Hint */}
                <View style={styles.hintRow}>
                    <Text style={styles.hintText}>
                        Supports EAN-13, EAN-8, UPC, QR codes
                    </Text>
                </View>
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    centred: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
    dimOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    topBar: {
        position: 'absolute',
        top: 56,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    closeBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.45)',
        alignItems: 'center', justifyContent: 'center',
    },
    topTitle: {
        color: '#fff', fontSize: 16, fontWeight: '700',
    },
    hintRow: {
        position: 'absolute',
        bottom: 60,
        left: 0, right: 0,
        alignItems: 'center',
    },
    hintText: {
        color: 'rgba(255,255,255,0.55)',
        fontSize: 12,
        fontWeight: '500',
    },
    // Permission screen
    permissionTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 8 },
    permissionSub:   { color: 'rgba(255,255,255,0.65)', fontSize: 14, textAlign: 'center', marginBottom: 24 },
    permissionBtn: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 28, paddingVertical: 14,
        borderRadius: theme.borderRadius.pill,
    },
    permissionBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    goBackText: { color: 'rgba(255,255,255,0.55)', fontSize: 14 },
});
