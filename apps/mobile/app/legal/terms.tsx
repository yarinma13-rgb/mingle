import { ScrollView, Text, View } from "react-native";
import { AppHeader } from "@/src/components/AppHeader";
import { Body, Screen, Subtitle, Title } from "@/src/components/ui";
import { useTheme } from "@/src/providers/ThemeProvider";

// Ported verbatim from app/legal/terms/page.tsx (web) — same working-draft
// pilot copy, just rendered as native text instead of HTML.
const SECTIONS: { heading: string; paragraphs: string[]; bullets?: string[] }[] = [
  {
    heading: "Who we are",
    paragraphs: [
      "mingle is operated as a pilot product. The operator of the Service (we, us) provides mingle so talent and companies can discover each other, connect, and build a professional relationship over time.",
    ],
  },
  {
    heading: "The Service",
    paragraphs: [
      "mingle is not a job board and not a guarantee of employment, hiring, or any specific outcome. Profiles, match explanations, messages, and relationship stages are tools for conversation. You remain responsible for your own hiring and career decisions.",
      "The pilot may change, pause, or end. Features may be incomplete. We will try to keep the Service reliable, but we do not promise uninterrupted availability.",
    ],
  },
  {
    heading: "Your account",
    paragraphs: [
      "You must provide accurate information and keep your login details private. You are responsible for activity under your account. Do not create an account for someone else without their permission.",
      "Talent and company paths are separate. Use the path that matches how you intend to participate in the pilot.",
    ],
  },
  {
    heading: "Acceptable use",
    paragraphs: ["You agree not to:"],
    bullets: [
      "misrepresent who you are, who you work for, or your role",
      "scrape, harvest, or bulk export other people's profiles",
      "harass, spam, or pressure anyone on the Service",
      "upload unlawful, discriminatory, or confidential content you are not allowed to share",
      "attempt to bypass security or access another account",
    ],
  },
  {
    heading: "Content you share",
    paragraphs: [
      "You keep ownership of the profile text, messages, and other content you submit. You grant us a licence to host, display, and process that content only as needed to operate mingle (for example showing your profile to the other side, delivering messages, and recording relationship events).",
      "Do not share secrets, unpublished offers, or personal data about third parties without a lawful basis.",
    ],
  },
  {
    heading: "Connections and messages",
    paragraphs: [
      "Sending a connection, accepting one, or starting a conversation is your choice. The other person may decline, cancel, or stop participating. We do not mediate employment disputes.",
    ],
  },
  {
    heading: "Disclaimer",
    paragraphs: [
      "The Service is provided as is during the pilot. To the fullest extent allowed by law we disclaim warranties of fitness for a particular purpose, merchantability, and non infringement. Match scores are explanations, not advice.",
    ],
  },
  {
    heading: "Limitation of liability",
    paragraphs: [
      "To the fullest extent allowed by law we are not liable for lost profits, lost opportunity, or indirect damages arising from your use of mingle. Our total liability for claims related to the Service is limited to zero because the pilot is offered without charge, unless a mandatory law says otherwise.",
    ],
  },
  {
    heading: "Changes",
    paragraphs: [
      "We may update these Terms as the pilot evolves. The date at the top of this page will change when we do. Continued use after an update means you accept the new Terms.",
    ],
  },
  {
    heading: "Contact",
    paragraphs: [
      "Questions about these Terms can be sent to the operator of mingle through the channel you were invited to the pilot on.",
      "These Terms are a working draft for the pilot and should be reviewed by counsel before a wider launch.",
    ],
  },
];

export default function TermsScreen() {
  const { colors } = useTheme();
  return (
    <Screen>
      <AppHeader title="Terms" showBack />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Title>Terms of Service</Title>
        <Subtitle>Updated 1 September 2026</Subtitle>
        <Body>
          These Terms govern your use of mingle, a career relationship
          platform currently offered as a closed pilot. By creating an
          account or using the Service you agree to these Terms.
        </Body>
        {SECTIONS.map((section) => (
          <View key={section.heading} style={{ gap: 8 }}>
            <Text
              style={{
                fontFamily: "Poppins_700Bold",
                fontSize: 16,
                color: colors.text,
              }}
            >
              {section.heading}
            </Text>
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
