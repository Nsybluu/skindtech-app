import { Redirect, useLocalSearchParams } from 'expo-router';

/**
 * The care recommendations now live at the bottom of the scan result, so there is one screen for
 * a scan instead of two that could disagree. This route only keeps old links working.
 */
export default function RecommendationRedirect() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <Redirect href={{ pathname: '/scan-result', params: typeof id === 'string' && id !== '' ? { id } : {} }} />;
}
