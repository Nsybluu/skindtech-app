import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Redirect, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';

import SwitchCameraIcon from '@/assets/icons/switch-camera.svg';
import { cameraAccessoryStyles, CameraFrame } from '@/components/scan/camera-frame';
import { CaptureControls } from '@/components/scan/capture-controls';
import { ScanFlowLayout } from '@/components/scan/scan-flow-layout';
import { ScanNote, ScanNotice } from '@/components/scan/scan-notice';
import { goBackOr } from '@/components/ui/screen-header';
import { useI18n } from '@/i18n/i18n-provider';
import { useUserData } from '@/providers/app-provider';

/** Figma 07 — Scan with a live Expo camera and gallery import. */
export default function ScanScreen() {
  const { t } = useI18n();
  const { skinProfile, setPendingPhotoUri } = useUserData();
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
          guidanceTitle={t.scan.guidanceTitle}
          guidanceBody={t.scan.guidanceBody}
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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.scan.switchCamera}
              onPress={() => setFacing((value) => (value === 'front' ? 'back' : 'front'))}
              style={({ pressed }) => [cameraAccessoryStyles.roundButton, pressed && { opacity: 0.7 }]}>
              <SwitchCameraIcon />
            </Pressable>
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
