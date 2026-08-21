import { Href, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { SupportScreenShell } from '@/components/workspace/support-screen-shell';
import {
  SupportCard,
  SupportIntroText,
  SupportKbd,
  SupportLinkList,
  SupportLinkRow,
  SupportScrollContent,
  SupportSection,
} from '@/components/workspace/support-screen-ui';
import { HELP_QUICK_LINKS, HELP_SECTIONS } from '@/lib/help/topics';
import { tavColors } from '@/lib/theme';

export default function HelpScreen() {
  const router = useRouter();

  return (
    <SupportScreenShell title="Help" padded={false} showBack backLabel="Profile">
      <ScrollView contentContainerStyle={styles.scrollGrow}>
        <SupportScrollContent>
          <SupportIntroText>
            Quick reference for messaging, notifications, and account screens in TAV Communication.
          </SupportIntroText>

          {HELP_SECTIONS.map((section) => (
            <SupportCard key={section.id}>
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
              {section.id === 'mobile-notes' ? (
                <View style={styles.shortcutRow}>
                  <Text style={styles.shortcutLabel}>Web shortcuts not on mobile:</Text>
                  <View style={styles.shortcutChips}>
                    <SupportKbd>⌘K</SupportKbd>
                    <SupportKbd>Ctrl+K</SupportKbd>
                    <SupportKbd>Esc</SupportKbd>
                  </View>
                </View>
              ) : null}
            </SupportCard>
          ))}

          <SupportSection title="Quick links">
            <SupportCard style={styles.linkCard}>
              <SupportLinkList>
                {HELP_QUICK_LINKS.map((link, index) => (
                  <SupportLinkRow
                    key={link.id}
                    isLast={index === HELP_QUICK_LINKS.length - 1}
                    label={link.label}
                    onPress={() => {
                      router.push(link.href as Href);
                    }}
                  />
                ))}
              </SupportLinkList>
            </SupportCard>
          </SupportSection>
        </SupportScrollContent>
      </ScrollView>
    </SupportScreenShell>
  );
}

const styles = StyleSheet.create({
  scrollGrow: {
    flexGrow: 1,
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
  shortcutRow: {
    gap: 8,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: tavColors.zinc200,
  },
  shortcutLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: tavColors.zinc600,
  },
  shortcutChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  linkCard: {
    paddingVertical: 8,
    gap: 0,
  },
});
