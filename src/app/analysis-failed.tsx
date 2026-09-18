import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import FailedIcon from '@/assets/icons/analysis-failed.svg';
import NotSavedIcon from '@/assets/icons/info.svg';
import { ActionBar } from '@/components/ui/action-bar';
import { AppButton } from '@/components/ui/app-button';
import { AppScreen } from '@/components/ui/app-screen';
import { AppText } from '@/components/ui/app-text';
import { ScreenHeader, goBackOr } from '@/components/ui/screen-header';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { useI18n } from '@/i18n/i18n-provider';

/** Figma 07D — Analysis Failed. */
export default function AnalysisFailedScreen() {
  const { t } = useI18n();
  const backToScan = () => goBackOr(() => router.replace('/scan'));

  return (
    <AppScreen
      header={<ScreenHeader title={t.analysisFailed.title} gap={Spacing.m} onBack={backToScan} />}
      contentStyle={styles.content}
      footer={
        <ActionBar>
          <AppButton
            variant="secondary"
            label={t.analysisFailed.backToScan}
            onPress={backToScan}
            style={styles.secondary}
          />
          <AppButton
            variant="solid"
            label={t.analysisFailed.tryAgain}
            onPress={() => router.replace('/analyzing')}
            style={styles.primary}
          />
        </ActionBar>
      }>
      <View style={styles.iconCircle}>
        <FailedIcon />
      </View>

      <AppText variant="cardHeadline" color={Colors.error.title} align="center">
        {t.analysisFailed.heading}
      </AppText>
      <AppText variant="body" color={Colors.error.body} align="center">
        {t.analysisFailed.body}
      </AppText>

      <View style={styles.card}>
        <AppText variant="bodyLarge" weight="semibold" color={Colors.error.title}>
          {t.analysisFailed.whatYouCanDo}
        </AppText>
        <View>
          {t.analysisFailed.tips.map((tip) => (
            <AppText key={tip} variant="listStep" color={Colors.error.text}>
              {`•  ${tip}`}
            </AppText>
          ))}
        </View>
      </View>

      <View style={styles.notice}>
        <NotSavedIcon />
        <AppText variant="bodySmall" color={Colors.error.text} style={styles.noticeText}>
          {t.analysisFailed.notSaved}
        </AppText>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.l,
    paddingVertical: Spacing.xxxl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: Colors.error.iconBorder,
    backgroundColor: Colors.error.iconSurface,
  },
  card: {
    alignSelf: 'stretch',
    gap: Spacing.s,
    padding: Spacing.l,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Colors.error.cardBorder,
    backgroundColor: '#FFFFFF',
  },
  notice: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m,
    padding: Spacing.m,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Colors.error.noticeBorder,
    backgroundColor: Colors.error.noticeSurface,
  },
  noticeText: {
    flex: 1,
  },
  secondary: {
    width: 104,
  },
  primary: {
    flex: 1,
  },
});
