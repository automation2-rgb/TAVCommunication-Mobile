import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { fetchInboxAccessCatalog, requestInboxAccess, type InboxAccessCatalogItem } from '@/lib/inbox-access';
import { tavColors } from '@/lib/theme';

export function RequestInboxAccessPanel() {
  const [catalog, setCatalog] = useState<InboxAccessCatalogItem[]>([]);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadCatalog = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const rows = await fetchInboxAccessCatalog();
      setCatalog(rows);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load inboxes.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCatalog();
  }, []);

  const selectable = useMemo(
    () => catalog.filter((item) => !item.assigned && !item.requested),
    [catalog],
  );

  const hasPending = useMemo(() => catalog.some((item) => item.requested), [catalog]);

  const toggleSlug = (slug: string) => {
    setSelectedSlugs((current) =>
      current.includes(slug) ? current.filter((value) => value !== slug) : [...current, slug],
    );
  };

  const handleSubmit = async () => {
    if (selectedSlugs.length === 0) {
      setErrorMessage('Select at least one inbox.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await requestInboxAccess(selectedSlugs);
      setSuccessMessage('Inbox access request submitted.');
      setSelectedSlugs([]);
      await loadCatalog();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to submit request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>No inboxes assigned yet</Text>
      <Text style={styles.subtitle}>
        Pick the inboxes you need access to. An administrator will review your request.
      </Text>

      {hasPending ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>You have inbox requests awaiting review.</Text>
        </View>
      ) : null}

      {errorMessage ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Pressable onPress={() => void loadCatalog()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {successMessage ? (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      ) : null}

      {isLoading ? (
        <ActivityIndicator color={tavColors.blue} />
      ) : (
        <View style={styles.list}>
          {catalog.map((item) => {
            const disabled = item.assigned || item.requested;
            const selected = selectedSlugs.includes(item.slug);
            return (
              <Pressable
                key={item.slug}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected, disabled }}
                disabled={disabled}
                onPress={() => {
                  toggleSlug(item.slug);
                }}
                style={[styles.row, disabled && styles.rowDisabled, selected && styles.rowSelected]}>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{item.displayName}</Text>
                  {item.assigned ? <Text style={styles.badge}>Assigned</Text> : null}
                  {item.requested ? <Text style={styles.badge}>Requested</Text> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      <AuthButton
        disabled={isSubmitting || selectable.length === 0}
        label={isSubmitting ? 'Submitting…' : `Request access (${selectedSlugs.length})`}
        onPress={() => {
          void handleSubmit();
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    gap: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: tavColors.zinc900,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: tavColors.zinc600,
    textAlign: 'center',
  },
  banner: {
    backgroundColor: tavColors.amber50,
    borderRadius: 12,
    padding: 12,
  },
  bannerText: {
    color: tavColors.amber600,
    fontSize: 14,
  },
  errorBanner: {
    backgroundColor: tavColors.red50,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  errorText: {
    color: tavColors.red600,
    fontSize: 14,
  },
  retryText: {
    color: tavColors.blue,
    fontWeight: '600',
  },
  successBanner: {
    backgroundColor: tavColors.emerald50,
    borderRadius: 12,
    padding: 12,
  },
  successText: {
    color: tavColors.emerald600,
    fontSize: 14,
  },
  list: {
    gap: 8,
  },
  row: {
    borderWidth: 1,
    borderColor: tavColors.zinc200,
    borderRadius: 12,
    padding: 14,
    backgroundColor: tavColors.white,
  },
  rowSelected: {
    borderColor: tavColors.blue,
    backgroundColor: '#eff6ff',
  },
  rowDisabled: {
    opacity: 0.65,
  },
  rowText: {
    gap: 4,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: tavColors.zinc900,
  },
  badge: {
    fontSize: 12,
    color: tavColors.zinc500,
  },
});
