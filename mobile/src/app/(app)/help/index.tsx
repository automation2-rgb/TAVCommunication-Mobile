import { Href, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SupportScreenShell } from '@/components/workspace/support-screen-shell';
import { HELP_QUICK_LINKS, HELP_SECTIONS } from '@/lib/help/topics';
import { tavColors } from '@/lib/theme';

export default function HelpScreen() {
  const router = useRouter();

  return (
    <SupportScreenShell title="Help" padded={false} showBack backLabel="Profile">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.intro}>
          Quick reference for messaging, notifications, and account screens in TAV Communication.
        </Text>

        {HELP_SECTIONS.map((section) => (
          <View key={section.id} style={styles.card}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.paragraphs.map((paragraph) => (
              <Text key={paragraph} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}
            {section.bullets?.length ? (
              <View style={styles.bulletList}>
                {section.bullets.map((bullet) => (
                  <View key={bullet} style={styles.bulletRow}>
                    <Text style={styles.bulletMark}>•</Text>
                    <Text style={styles.bulletText}>{bullet}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ))}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Quick links</Text>
          <View style={styles.linkList}>
            {HELP_QUICK_LINKS.map((link) => (
              <Pressable
                key={link.id}
                accessibilityRole="button"
                onPress={() => {
                  router.push(link.href as Href);
                }}
                style={({ pressed }) => [styles.linkRow, pressed && styles.linkRowPressed]}>
                <Text style={styles.linkLabel}>{link.label}</Text>
                <Text style={styles.linkChevron}>→</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SupportScreenShell>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 32,
  },
  intro: {
    fontSize: 15,
    lineHeight: 22,
    color: tavColors.zinc600,
  },
  card: {
    backgroundColor: tavColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tavColors.zinc200,
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: tavColors.zinc900,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: tavColors.zinc700,
  },
  bulletList: {
    gap: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletMark: {
    fontSize: 15,
    lineHeight: 22,
    color: tavColors.zinc500,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: tavColors.zinc700,
  },
  linkList: {
    gap: 4,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  linkRowPressed: {
    backgroundColor: tavColors.zinc50,
  },
  linkLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: tavColors.blue,
  },
  linkChevron: {
    fontSize: 16,
    color: tavColors.blue,
  },
});
