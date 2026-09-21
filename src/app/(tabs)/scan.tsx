import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet } from 'react-native';

import { cameraAccessoryStyles, CameraFrame } from '@/components/scan/camera-frame';
import { CameraPlaceholder } from '@/components/scan/camera-placeholder';
import { CaptureControls } from '@/components/scan/capture-controls';
import { ScanFlowLayout } from '@/components/scan/scan-flow-layout';
import { ScanNote, ScanNotice } from '@/components/scan/scan-notice';
import { AppIcon } from '@/components/ui/app-icon';
import { SwitchCameraIcon } from '@/components/ui/icons';
import { goBackOr } from '@/components/ui/screen-header';
import { Colors } from '@/constants/colors';
import { useI18n } from '@/i18n/i18n-provider';
import { useUserData } from '@/providers/app-provider';

/** Figma 07 — Scan with a live Expo camera and gallery import. */
export default function ScanScreen() {
  const { t } = useI18n();
  const { skinProfile, setPendingPhotoUri } = useUserData();
  // "Choose another" on the photo-problem screen passes a new `pick` value to open the library.
  const { pick } = useLocalSearchParams<{ pick?: string }>();
  const cameraRef = useRef<CameraView>(null);
  const requestedPermission = useRef(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('front');
  const [cameraReady, setCameraReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  useEffect(() => {
    if (
      skinProfile &&
      permission &&
      !permission.granted &&
      permission.canAskAgain &&
      !requestedPermission.current
    ) {
      requestedPermission.current = true;
      void requestPermission();
    }
  }, [permission, requestPermission, skinProfile]);

  const capturePhoto = async () => {
    if (!permission?.granted) {
      const nextPermission = await requestPermission();
      if (!nextPermission.granted) {
        Alert.alert(t.scan.permissionTitle, t.scan.cameraPermission);
      }
      return;
    }

    if (!cameraRef.current || !cameraReady || busy) return;

    try {
      setBusy(true);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      if (!photo?.uri) throw new Error('Camera did not return a photo URI.');
      setPendingPhotoUri(photo.uri);
      router.push('/photo-review');
    } catch {
      Alert.alert(t.scan.captureFailedTitle, t.scan.captureFailedBody);
    } finally {
      setBusy(false);
    }
  };

  const choosePhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
        preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setPendingPhotoUri(result.assets[0].uri);
        router.push('/photo-review');
      }
    } catch {
      Alert.alert(t.scan.captureFailedTitle, t.scan.galleryFailedBody);
    }
  };

  useEffect(() => {
    if (pick && skinProfile) void choosePhoto();
    // Only a new `pick` value should reopen the library.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pick]);

  // A Skin Profile is required before the first scan.
  if (!skinProfile) {
    return <Redirect href={{ pathname: '/skin-profile', params: { next: 'scan' } }} />;
  }

  return (
    <ScanFlowLayout
      title={t.scan.title}
      onBack={() => goBackOr(() => router.navigate('/'))}
      preview={
        <CameraFrame
          guidanceTitle={permission && !permission.granted ? t.scan.noCameraGuidanceTitle : t.scan.guidanceTitle}
          guidanceBody={permission && !permission.granted ? t.scan.noCameraGuidanceBody : t.scan.guidanceBody}
          emptyContent={
            permission && !permission.granted ? (
              <CameraPlaceholder
                canAskAgain={permission.canAskAgain}
                onAllow={() => void requestPermission()}
                onOpenSettings={() => void Linking.openSettings()}
              />
            ) : undefined
          }
          cameraContent={
            permission?.granted ? (
              <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing={facing}
                flash={flashOn ? 'on' : 'off'}
                mode="picture"
                onCameraReady={() => setCameraReady(true)}
              />
            ) : undefined
          }
          topRightAccessory={
            permission?.granted ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.scan.switchCamera}
                onPress={() => setFacing((value) => (value === 'front' ? 'back' : 'front'))}
                style={({ pressed }) => [cameraAccessoryStyles.roundButton, pressed && { opacity: 0.7 }]}>
                <AppIcon icon={SwitchCameraIcon} size={18} color={Colors.text.onBrand} />
              </Pressable>
            ) : undefined
          }
        />
      }
      controls={
        <>
          <ScanNotice message={t.scan.notice} />
          <CaptureControls
            onCapture={() => void capturePhoto()}
            onUpload={() => void choosePhoto()}
            flashOn={flashOn}
            onToggleFlash={() => setFlashOn((value) => !value)}
          />
          <ScanNote message={t.scan.privacyNote} variant="footnote" />
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  camera: {
    flex: 1,
  },
});
