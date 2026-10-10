import { ScrollView, Text, View } from "react-native";
import { AppHeader } from "@/src/components/AppHeader";
import { Body, Screen, Subtitle, Title } from "@/src/components/ui";
import { useTheme } from "@/src/providers/ThemeProvider";

// Ported verbatim from app/legal/privacy/page.tsx (web) — same working-draft
// pilot copy, just rendered as native text instead of HTML.
const SECTIONS: { heading: string; paragraphs: string[]; bullets?: string[] }[] = [
  {
    heading: "Who this applies to",
    paragraphs: [
      "It applies to people who create a talent or company account, and to anyone whose details are entered into a company profile with their knowledge.",
    ],
  },
  {
    heading: "What we collect",
    paragraphs: ["Depending on how you use mingle, we may process:"],
    bullets: [
      "account data: email address, password hash (via our auth provider), chosen path (talent or company)",
      "profile data: name, headline, location, experience, industry, bio, motivations, work style, career goals, company mission and culture",
      "activity data: saved profiles, connection requests and their status, messages, relationship events, and timestamps",
      "technical data: session cookies required to keep you signed in",
    ],
  },
  {
    heading: "",
    paragraphs: [
      "We do not currently collect payment information. Profile photos and CV files are designed in the product but file storage may not be active in this pilot build.",
    ],
  },
  {
    heading: "Why we use it",
    paragraphs: ["We process this data to:"],
    bullets: [
      "create and secure your account",
      "show your profile to the other side of the platform",
      "compute and explain match factors",
      "deliver connections, conversations, and relationship stages",
      "operate, debug, and improve the pilot",
    ],
  },
  {
    heading: "",
    paragraphs: [
      "The legal bases we rely on are performing the Service you asked for, our legitimate interest in running a safe pilot, and any consent you give for optional features.",
    ],
  },
  {
    heading: "Where it is stored",
    paragraphs: [
      "Authentication, database, and realtime messaging are provided by Supabase (PostgreSQL). The Next.js application may be hosted on a cloud platform such as Vercel when the pilot is deployed. Those providers process data on our instructions as infrastructure processors.",
    ],
  },
  {
    heading: "Who can see your profile",
    paragraphs: [
      "Talent profiles are visible to signed in company users, and company profiles are visible to signed in talent users, according to the access rules in the database. Messages are visible only to the two people in that conversation. We do not sell your data.",
    ],
  },
  {
    heading: "How long we keep it",
    paragraphs: [
      "We keep pilot account and activity data for the duration of the pilot and a reasonable period afterwards so we can close the programme fairly. You can ask us to delete your account and associated profile data.",
    ],
  },
  {
    heading: "Your choices",
    paragraphs: [
      "You can update most profile fields in the product. You can decline or cancel connections. Depending on applicable law you may also ask to access, correct, or delete personal data, or to object to certain processing. Use the same channel you were invited to the pilot on.",
    ],
  },
  {
    heading: "Children",
    paragraphs: [
      "mingle is for working professionals. It is not intended for anyone under 18.",
    ],
  },
  {
    heading: "Changes",
    paragraphs: [
      "We may update this Policy as the pilot evolves. The date at the top of this page will change when we do.",
      "This Policy is a working draft for the pilot and should be reviewed by counsel before a wider launch.",
    ],
  },
];

export default function PrivacyScreen() {
  const { colors } = useTheme();
  return (
    <Screen>
      <AppHeader title="Privacy" showBack />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Title>Privacy Policy</Title>
        <Subtitle>Updated 1 September 2026</Subtitle>
        <Body>
          This Privacy Policy explains how mingle handles personal data
          during the closed pilot. It should be read with the Terms of
          Service.
        </Body>
        {SECTIONS.map((section, index) => (
          <View key={section.heading || `p-${index}`} style={{ gap: 8 }}>
            {section.heading ? (
              <Text
                style={{
                  fontFamily: "Poppins_700Bold",
                  fontSize: 16,
                  color: colors.text,
                }}
              >
                {section.heading}
              </Text>
            ) : null}
            {section.paragraphs.map((p, i) => (
              <Body key={i}>{p}</Body>
            ))}
            {section.bullets?.map((b, i) => (
              <Body key={i}>• {b}</Body>
            ))}
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}
